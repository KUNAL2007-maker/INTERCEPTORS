/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // onnxruntime-node (optional ML risk model) and neo4j-driver (optional graph
  // projection) are native / Node-only packages. Marking them external keeps
  // Next from trying to bundle them into the server output — so the build
  // succeeds even when onnxruntime-node is not installed, and neo4j-driver's
  // native bits are require()d at runtime rather than webpacked.
  experimental: {
    serverComponentsExternalPackages: ["onnxruntime-node", "neo4j-driver"],
  },
};

module.exports = nextConfig;
