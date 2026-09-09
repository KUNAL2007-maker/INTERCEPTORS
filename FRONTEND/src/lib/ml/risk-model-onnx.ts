// Optional ONNX inference for the ported ANISHA risk model.
//
// This is the ONE throwaway bridge in the integration. The durable artifacts are
// scripts/ml/train_and_export.py (which reproduces the collaborator's XGBoost +
// GradientBoosting ensemble and exports it) and the .onnx / scaler.json files it
// emits — those survive the planned migration to a Python backend unchanged. This
// wrapper only exists to run those artifacts from Node until then.
//
// Everything here is best-effort and non-fatal. The model is an ANALYTICAL
// OVERLAY on top of the always-present, court-defensible Factors A–G heuristic in
// graph-algorithms.ts. If onnxruntime-node is not installed, or the artifacts are
// absent (e.g. the operator hasn't run the Python training step), or a run fails
// for any reason, scoreVectors() returns nulls and the caller scores on the
// heuristic alone. The app is fully functional with no model present.
//
// SERVER ONLY. onnxruntime-node is a native addon; this module must never be
// imported into client code. It is consumed by the /api/graph route handler.
//
// Note on the dynamic import: the specifier is held in a variable on purpose.
// That keeps TypeScript from requiring onnxruntime-node's type declarations at
// build time (so the project typechecks and builds without the native package
// installed), and, combined with serverComponentsExternalPackages in
// next.config, keeps the bundler from trying to trace a native .node file. When
// the package IS installed, Node resolves it at runtime.

import { readFile } from "node:fs/promises";
import { join } from "node:path";

// ── Minimal structural typing for the slice of onnxruntime-node we use ─────────
type OrtTensorData = Float32Array | Int32Array | BigInt64Array | number[];
interface OrtTensor {
  data: OrtTensorData;
  dims: number[];
}
interface OrtSession {
  inputNames: string[];
  outputNames: string[];
  run(feeds: Record<string, OrtTensor>): Promise<Record<string, OrtTensor>>;
}
interface OrtModule {
  InferenceSession: { create(path: string): Promise<OrtSession> };
  Tensor: new (type: "float32", data: Float32Array, dims: number[]) => OrtTensor;
}

type Scaler = { mean: number[]; scale: number[]; feature_names?: string[] };

type LoadedModel = {
  ort: OrtModule;
  xgb: OrtSession;
  gb: OrtSession;
  scaler: Scaler;
  dir: string;
};

// Where the artifacts live, tried in order. `npm start` after `npm run build`
// runs from the project root with the source tree intact, so src/lib/ml resolves;
// a bare `ml/` at the root is offered as an override for other layouts.
const CANDIDATE_DIRS = ["src/lib/ml", "ml"];

const XGB_FILE = "risk_model_xgb.onnx";
const GB_FILE = "risk_model_gb.onnx";
const SCALER_FILE = "scaler.json";

export type MlStatus = {
  available: boolean;
  reason: string;
  dir: string | null;
};

// Load exactly once per process. A resolved null means "tried and unavailable" —
// we don't retry the heavy native import on every request. `status` records why,
// for the route's diagnostics line.
let loadPromise: Promise<LoadedModel | null> | null = null;
let status: MlStatus = { available: false, reason: "not yet initialised", dir: null };

async function fileExists(path: string): Promise<boolean> {
  try {
    await readFile(path);
    return true;
  } catch {
    return false;
  }
}

async function loadOrtModule(): Promise<OrtModule | null> {
  try {
    // Variable specifier — see the module header for why.
    const specifier = "onnxruntime-node";
    const mod = (await import(/* webpackIgnore: true */ specifier)) as unknown as
      | OrtModule
      | { default: OrtModule };
    // Some CJS/ESM interop paths expose the module under `.default`.
    const ort = (mod as { default?: OrtModule }).default ?? (mod as OrtModule);
    return ort?.InferenceSession && ort?.Tensor ? ort : null;
  } catch {
    return null;
  }
}

function parseScaler(raw: string): Scaler | null {
  try {
    const j = JSON.parse(raw) as Partial<Scaler>;
    if (
      Array.isArray(j.mean) &&
      Array.isArray(j.scale) &&
      j.mean.length === j.scale.length &&
      j.mean.length > 0 &&
      j.mean.every((n) => typeof n === "number" && Number.isFinite(n)) &&
      j.scale.every((n) => typeof n === "number" && Number.isFinite(n))
    ) {
      return { mean: j.mean, scale: j.scale, feature_names: j.feature_names };
    }
  } catch {
    // fall through
  }
  return null;
}

async function doLoad(): Promise<LoadedModel | null> {
  const ort = await loadOrtModule();
  if (!ort) {
    status = { available: false, reason: "onnxruntime-node not installed", dir: null };
    return null;
  }

  for (const rel of CANDIDATE_DIRS) {
    const dir = join(process.cwd(), rel);
    const scalerPath = join(dir, SCALER_FILE);
    const xgbPath = join(dir, XGB_FILE);
    const gbPath = join(dir, GB_FILE);

    if (!(await fileExists(scalerPath)) || !(await fileExists(xgbPath)) || !(await fileExists(gbPath))) {
      continue;
    }

    const scaler = parseScaler(await readFile(scalerPath, "utf8"));
    if (!scaler) {
      status = { available: false, reason: `malformed ${SCALER_FILE} in ${rel}`, dir: null };
      return null;
    }

    try {
      const [xgb, gb] = await Promise.all([
        ort.InferenceSession.create(xgbPath),
        ort.InferenceSession.create(gbPath),
      ]);
      status = { available: true, reason: "loaded", dir: rel };
      return { ort, xgb, gb, scaler, dir: rel };
    } catch (err) {
      status = {
        available: false,
        reason: `failed to load ONNX sessions: ${(err as Error).message}`,
        dir: null,
      };
      return null;
    }
  }

  status = { available: false, reason: "no model artifacts found (run scripts/ml/train_and_export.py)", dir: null };
  return null;
}

function ensureLoaded(): Promise<LoadedModel | null> {
  if (!loadPromise) loadPromise = doLoad();
  return loadPromise;
}

/** Standardise one raw feature vector: (x - mean) / scale, per column. */
function standardise(vec: number[], scaler: Scaler): Float32Array {
  const n = scaler.mean.length;
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const raw = i < vec.length && Number.isFinite(vec[i]) ? vec[i] : 0;
    const s = scaler.scale[i];
    out[i] = s !== 0 ? (raw - scaler.mean[i]) / s : 0;
  }
  return out;
}

/**
 * Probability of the positive (illicit) class from one session's output.
 *
 * The Python export disables ZipMap, so probabilities come out as a plain float
 * tensor of shape [N, 2]; class 1 is the second column. We tolerate a few shapes
 * defensively — [1,2], [2], or a lone scalar already in [0,1] — and return null
 * if we can't confidently read a probability, so a shape surprise degrades to the
 * heuristic rather than fabricating a score.
 */
function positiveProb(results: Record<string, OrtTensor>, session: OrtSession): number | null {
  // Prefer an output whose name mentions probability; else the last output
  // (skl2onnx/onnxmltools emit [label, probabilities] in that order).
  const names = session.outputNames;
  const probName =
    names.find((n) => /prob/i.test(n)) ?? (names.length > 1 ? names[names.length - 1] : names[0]);
  const tensor = probName ? results[probName] : undefined;
  if (!tensor || !tensor.data) return null;

  const data = tensor.data;
  const toNum = (v: number | bigint): number => (typeof v === "bigint" ? Number(v) : v);

  if (data.length === 2) {
    const p = toNum(data[1] as number | bigint);
    return Number.isFinite(p) ? clamp01(p) : null;
  }
  if (data.length === 1) {
    const p = toNum(data[0] as number | bigint);
    return Number.isFinite(p) ? clamp01(p) : null;
  }
  // [N,2] flattened for a single row → take index 1.
  if (data.length >= 2 && tensor.dims.length === 2 && tensor.dims[1] === 2) {
    const p = toNum(data[1] as number | bigint);
    return Number.isFinite(p) ? clamp01(p) : null;
  }
  return null;
}

function clamp01(x: number): number {
  return x < 0 ? 0 : x > 1 ? 1 : x;
}

/**
 * Score a batch of 18-feature vectors. Returns an ml_score in [0,100] per vector,
 * or null for that vector if the model is unavailable or its run failed. Runs the
 * two sessions and blends 0.6·XGBoost + 0.4·GradientBoosting (probabilities ×100),
 * matching the ported model's ml_score. Never throws.
 */
export async function scoreVectors(vectors: number[][]): Promise<(number | null)[]> {
  const model = await ensureLoaded();
  if (!model) return vectors.map(() => null);

  const { ort, xgb, gb, scaler } = model;
  const xgbIn = xgb.inputNames[0] ?? "float_input";
  const gbIn = gb.inputNames[0] ?? "float_input";

  return Promise.all(
    vectors.map(async (vec) => {
      try {
        const scaled = standardise(vec, scaler);
        const xt = new ort.Tensor("float32", scaled, [1, scaler.mean.length]);
        const gt = new ort.Tensor("float32", scaled, [1, scaler.mean.length]);
        const [xr, gr] = await Promise.all([xgb.run({ [xgbIn]: xt }), gb.run({ [gbIn]: gt })]);
        const xp = positiveProb(xr, xgb);
        const gp = positiveProb(gr, gb);
        if (xp === null && gp === null) return null;
        // If one head fails, lean on the other rather than discarding the row.
        if (xp === null) return clamp01(gp!) * 100;
        if (gp === null) return clamp01(xp) * 100;
        return (0.6 * xp + 0.4 * gp) * 100;
      } catch {
        return null;
      }
    })
  );
}

/** Whether the model loaded, and why not if it didn't. For the route's log line. */
export async function mlModelStatus(): Promise<MlStatus> {
  await ensureLoaded();
  return status;
}
