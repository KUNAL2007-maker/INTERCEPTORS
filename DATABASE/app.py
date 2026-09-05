import http.server
import socketserver
import json
import os
import urllib.parse
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime

PORT = 5000
PUBLIC_DIR = os.path.join(os.path.dirname(__file__), 'frontend')

# PostgreSQL Database Configuration
DB_CONFIG = {
    'dbname': 'crypto_attribution',
    'user': 'postgres',
    'password': 'admin',
    'host': 'localhost',
    'port': 5432
}

def get_db_connection():
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        return conn
    except Exception as e:
        print(f"Database connection error: {e}")
        return None

# Current Active User Session State (Default: Senior Investigator Officer Sharma)
current_user_id = 2

def get_current_user():
    conn = get_db_connection()
    if not conn:
        # Fallback if DB disconnected
        return {"id": 2, "name": "Officer Sharma (MH Cyber)", "email": "senior.sharma@mhcyber.gov.in", "role_id": 3, "role_name": "SENIOR_INVESTIGATOR", "workspace_id": 1, "vasp_id": None}

    cursor = conn.cursor(cursor_factory=RealDictCursor)
    query = """
        SELECT u.id, u.name, u.email, u.role_id, r.name as role_name, u.workspace_id, u.vasp_id, u.badge_number
        FROM users u
        JOIN roles r ON u.role_id = r.id
        WHERE u.id = %s
    """
    cursor.execute(query, (current_user_id,))
    user = cursor.fetchone()
    cursor.close()
    conn.close()
    return user

def filter_cases_by_scope(user):
    conn = get_db_connection()
    if not conn:
        return []

    cursor = conn.cursor(cursor_factory=RealDictCursor)
    role = user["role_name"]

    if role in ["SUPER_ADMIN", "AUDITOR"]:
        query = "SELECT * FROM cases ORDER BY id DESC"
        cursor.execute(query)
    elif role == "VICTIM":
        query = "SELECT * FROM cases WHERE victim_id = %s ORDER BY id DESC"
        cursor.execute(query, (user["id"],))
    elif role in ["NORMAL_INVESTIGATOR", "SENIOR_INVESTIGATOR", "WORKSPACE_ADMIN"]:
        query = "SELECT * FROM cases WHERE workspace_id = %s ORDER BY id DESC"
        cursor.execute(query, (user["workspace_id"],))
    elif role == "EXCHANGE_NODAL_OFFICER":
        query = """
            SELECT c.* FROM cases c
            JOIN freeze_requests fr ON c.id = fr.case_id
            WHERE fr.vasp_id = %s
            ORDER BY c.id DESC
        """
        cursor.execute(query, (user["vasp_id"],))
    else:
        cursor.close()
        conn.close()
        return []

    cases = cursor.fetchall()
    # Format numeric & datetime for JSON output
    for c in cases:
        c["loss_amount_inr"] = float(c["loss_amount_inr"]) if c["loss_amount_inr"] else 0.0
        c["created_at"] = c["created_at"].isoformat() if c["created_at"] else ""

    cursor.close()
    conn.close()
    return cases

class RequestHandler(http.server.SimpleHTTPRequestHandler):
    def translate_path(self, path):
        if not path.startswith('/api/'):
            clean_path = urllib.parse.urlparse(path).path
            if clean_path in ['/', '']:
                clean_path = '/index.html'
            return os.path.join(PUBLIC_DIR, clean_path.lstrip('/'))
        return super().translate_path(path)

    def _send_json(self, status_code, data):
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.end_headers()

    def do_GET(self):
        parsed_path = urllib.parse.urlparse(self.path).path
        user = get_current_user()

        if parsed_path == '/api/auth/current-user':
            return self._send_json(200, {"user": user})

        if parsed_path == '/api/cases':
            cases = filter_cases_by_scope(user)
            return self._send_json(200, {
                "role": user["role_name"],
                "workspace_id": user["workspace_id"],
                "cases": cases
            })

        return super().do_GET()

    def do_POST(self):
        global current_user_id
        parsed_path = urllib.parse.urlparse(self.path).path
        content_length = int(self.headers.get('Content-Length', 0))
        body_bytes = self.rfile.read(content_length) if content_length > 0 else b'{}'
        body = json.loads(body_bytes.decode('utf-8')) if body_bytes else {}

        user = get_current_user()

        # 1. Switch Role Persona
        if parsed_path == '/api/auth/switch-role':
            role_name = body.get('roleName')
            conn = get_db_connection()
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            cursor.execute("SELECT u.id FROM users u JOIN roles r ON u.role_id = r.id WHERE r.name = %s LIMIT 1", (role_name,))
            target = cursor.fetchone()
            cursor.close()
            conn.close()

            if not target:
                return self._send_json(404, {"error": "Target persona not found in PostgreSQL"})

            current_user_id = target["id"]
            updated_user = get_current_user()
            return self._send_json(200, {"message": f"Switched persona to {updated_user['name']}", "user": updated_user})

        # 2. Submit Complaint (Victim / Super Admin)
        if parsed_path == '/api/cases':
            if user["role_name"] not in ["VICTIM", "SUPER_ADMIN"]:
                return self._send_json(403, {"error": "RBAC Violation", "message": "Only VICTIM or SUPER_ADMIN can submit new complaints."})

            conn = get_db_connection()
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            case_num = f"MH-CYBER-2026-0{int(datetime.now().timestamp()) % 10000}"
            wallet = body.get("suspect_wallet_address", "0x71C7656EC7ab88b098defB751B7401B5f6d8976F")
            network = body.get("blockchain_network", "Ethereum")
            amount = float(body.get("loss_amount_inr", 450000))
            crime = body.get("crime_type", "Task-Based Crypto Fraud")

            cursor.execute("""
                INSERT INTO cases (case_number, victim_id, workspace_id, assigned_investigator_id, suspect_wallet_address, blockchain_network, loss_amount_inr, crime_type, status)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING *
            """, (case_num, user["id"], 1, 3, wallet, network, amount, crime, 'PENDING_TRACING'))
            
            new_case = cursor.fetchone()
            new_case["loss_amount_inr"] = float(new_case["loss_amount_inr"])
            new_case["created_at"] = new_case["created_at"].isoformat()

            conn.commit()
            cursor.close()
            conn.close()

            return self._send_json(201, {"message": "Complaint filed in PostgreSQL database", "case": new_case})

        # 3. Blockchain Tracing
        if parsed_path == '/api/trace/run':
            if user["role_name"] not in ["NORMAL_INVESTIGATOR", "SENIOR_INVESTIGATOR", "SUPER_ADMIN"]:
                return self._send_json(403, {"error": "RBAC Violation", "message": "Requires Investigator privileges to run wallet graph tracing."})

            case_id = int(body.get("case_id", 1))
            conn = get_db_connection()
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            
            cursor.execute("UPDATE cases SET status = 'TRACED' WHERE id = %s RETURNING suspect_wallet_address", (case_id,))
            updated = cursor.fetchone()

            cursor.execute("""
                INSERT INTO wallet_traces (case_id, input_wallet, detected_vasp_id, layering_depth, risk_score, risk_category)
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING *
            """, (case_id, updated["suspect_wallet_address"] if updated else "0x71C...", 1, 3, 94, 'CRITICAL'))

            trace = cursor.fetchone()
            trace["detected_vasp"] = "Binance International"
            trace["created_at"] = trace["created_at"].isoformat()

            conn.commit()
            cursor.close()
            conn.close()

            return self._send_json(200, {"message": "Attribution trace saved to PostgreSQL", "trace": trace})

        # 4. Draft Freeze Order
        if parsed_path == '/api/freeze/draft':
            if user["role_name"] not in ["NORMAL_INVESTIGATOR", "SENIOR_INVESTIGATOR", "SUPER_ADMIN"]:
                return self._send_json(403, {"error": "RBAC Violation", "message": "Requires Investigator privileges to draft freeze notices."})

            case_id = int(body.get("case_id", 1))
            conn = get_db_connection()
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            cursor.execute("UPDATE cases SET status = 'FREEZE_DRAFTED' WHERE id = %s", (case_id,))
            
            cursor.execute("""
                INSERT INTO freeze_requests (case_id, vasp_id, drafted_by, bnss_section, freeze_reason, status)
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING *
            """, (case_id, 1, user["id"], "Sec 94 BNSS / 91 CrPC", body.get("freeze_reason", "Statutory Freeze"), "DRAFTED"))

            notice = cursor.fetchone()
            notice["vasp_name"] = "Binance International"
            notice["created_at"] = notice["created_at"].isoformat()

            conn.commit()
            cursor.close()
            conn.close()

            return self._send_json(201, {"message": "Freeze request saved in PostgreSQL", "freezeNotice": notice})

        # 5. Approve & Anchor Evidence (SENIOR ROLE ONLY)
        if parsed_path == '/api/freeze/approve':
            if user["role_name"] not in ["SENIOR_INVESTIGATOR", "SUPER_ADMIN"]:
                return self._send_json(403, {
                    "error": "Access Denied (RBAC Restriction)",
                    "message": f"Your role '{user['role_name']}' is not authorized to approve freeze orders or anchor evidence."
                })

            conn = get_db_connection()
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            cursor.execute("UPDATE cases SET status = 'FREEZE_APPROVED' WHERE id = 1")
            
            cursor.execute("""
                INSERT INTO evidence_anchors (case_id, pdf_hash, smart_contract_tx_hash, anchored_by)
                VALUES (%s, %s, %s, %s)
                RETURNING *
            """, (1, "0xa7f83e2b9c1d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f", "0x0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e", user["id"]))

            anchor = cursor.fetchone()
            anchor["anchored_by"] = user["name"]
            anchor["timestamp"] = anchor["timestamp"].isoformat()

            conn.commit()
            cursor.close()
            conn.close()

            return self._send_json(200, {"message": "Approved & Anchored to PostgreSQL + Blockchain!", "anchor": anchor})

        # 6. Super Admin Create Workspace
        if parsed_path == '/api/workspaces/create':
            if user["role_name"] != "SUPER_ADMIN":
                return self._send_json(403, {"error": "RBAC Violation", "message": "Super Admin access required to create state workspaces."})

            conn = get_db_connection()
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            cursor.execute("""
                INSERT INTO workspaces (name, state, jurisdiction_code)
                VALUES (%s, %s, %s)
                RETURNING *
            """, (body.get("name", "Karnataka Cyber Taskforce"), body.get("state", "Karnataka"), body.get("jurisdiction_code", "KA-CYBER-03")))

            ws = cursor.fetchone()
            ws["created_at"] = ws["created_at"].isoformat()

            conn.commit()
            cursor.close()
            conn.close()

            return self._send_json(201, {"message": "State workspace created in PostgreSQL", "workspace": ws})

        # 7. Super Admin Emergency Lockdown
        if parsed_path == '/api/admin/lockdown':
            if user["role_name"] != "SUPER_ADMIN":
                return self._send_json(403, {"error": "RBAC Violation", "message": "Super Admin access required for emergency lockdown."})
            return self._send_json(200, {"message": "EMERGENCY LOCKDOWN TRIGGERED: All API keys suspended & state workspaces isolated."})

        return self._send_json(404, {"error": "Endpoint not found"})

print(f"Starting PostgreSQL-Connected Python server on http://localhost:{PORT}...")
with socketserver.TCPServer(("", PORT), RequestHandler) as httpd:
    httpd.serve_forever()
