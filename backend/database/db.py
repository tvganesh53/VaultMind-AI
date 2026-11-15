import sqlite3
import datetime
from typing import List, Dict, Any, Optional
from config import DB_PATH

class Database:
    """
    SQLite Database for VaultMind AI.
    Stores:
    - Encrypted records (ciphertext, nonce, tag, record_id, timestamp). Never stores plaintext.
    - Security audit logs (event_type, action, status, details, timestamp).
      Never logs plaintext secrets, keys, or sensitive PII.
    """

    def __init__(self, db_path=DB_PATH):
        self.db_path = str(db_path)
        self.init_db()

    def get_connection(self):
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def init_db(self):
        with self.get_connection() as conn:
            cursor = conn.cursor()
            # Encrypted records table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS encrypted_vault (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    record_id TEXT UNIQUE NOT NULL,
                    ciphertext TEXT NOT NULL,
                    nonce TEXT NOT NULL,
                    tag TEXT NOT NULL,
                    key_id TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)
            # Non-sensitive Security Audit Event Log
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS audit_logs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    event_type TEXT NOT NULL,
                    action TEXT NOT NULL,
                    status TEXT NOT NULL,
                    details TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)
            conn.commit()

    def store_encrypted_record(self, record_id: str, ciphertext: str, nonce: str, tag: str, key_id: str):
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT OR REPLACE INTO encrypted_vault (record_id, ciphertext, nonce, tag, key_id)
                VALUES (?, ?, ?, ?, ?)
            """, (record_id, ciphertext, nonce, tag, key_id))
            conn.commit()

    def get_encrypted_record(self, record_id: str) -> Optional[Dict[str, Any]]:
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM encrypted_vault WHERE record_id = ?", (record_id,))
            row = cursor.fetchone()
            if row:
                return dict(row)
            return None

    def log_audit_event(self, event_type: str, action: str, status: str, details: str = ""):
        """Logs security telemetry. MUST NEVER contain plaintext keys or sensitive values."""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO audit_logs (event_type, action, status, details)
                VALUES (?, ?, ?, ?)
            """, (event_type, action, status, details))
            conn.commit()

    def get_recent_audit_logs(self, limit: int = 50) -> List[Dict[str, Any]]:
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT id, event_type, action, status, details, created_at 
                FROM audit_logs 
                ORDER BY id DESC LIMIT ?
            """, (limit,))
            rows = cursor.fetchall()
            return [dict(r) for r in rows]

    def get_metrics(self) -> Dict[str, Any]:
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM encrypted_vault")
            total_encrypted = cursor.fetchone()[0]

            cursor.execute("SELECT COUNT(*) FROM audit_logs WHERE event_type = 'ENCRYPTION'")
            encryption_ops = cursor.fetchone()[0]

            cursor.execute("SELECT COUNT(*) FROM audit_logs WHERE event_type = 'REDACTION'")
            redaction_ops = cursor.fetchone()[0]

            cursor.execute("SELECT COUNT(*) FROM audit_logs WHERE event_type = 'AI_QUERY'")
            ai_requests = cursor.fetchone()[0]

            cursor.execute("SELECT COUNT(*) FROM audit_logs WHERE status = 'FAILURE'")
            security_alerts = cursor.fetchone()[0]

            return {
                "total_vault_records": total_encrypted,
                "encryption_operations": encryption_ops,
                "redaction_operations": redaction_ops,
                "ai_requests": ai_requests,
                "security_alerts": security_alerts
            }

db = Database()
