"""
Simple SQLite database setup for Zip-like procurement system.
Everything in one file to keep it simple for demo.
"""
import sqlite3
from typing import List, Dict, Optional
from datetime import datetime

class Database:
    def __init__(self, db_path: str = "procurement.db"):
        self.db_path = db_path
        self.init_database()
        self.seed_demo_data()
    
    def get_connection(self):
        """Get database connection"""
        return sqlite3.connect(self.db_path)
    
    def init_database(self):
        """Create all tables"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        # Users table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                role TEXT NOT NULL,
                department_id INTEGER,
                FOREIGN KEY (department_id) REFERENCES departments (id)
            )
        """)
        
        # Departments table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS departments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                manager_id INTEGER,
                FOREIGN KEY (manager_id) REFERENCES users (id)
            )
        """)
        
        # Vendors table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS vendors (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                is_new_vendor BOOLEAN DEFAULT TRUE
            )
        """)
        
        # Requests table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS requests (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                description TEXT,
                amount REAL NOT NULL,
                vendor_id INTEGER,
                department_id INTEGER,
                requester_id INTEGER,
                status TEXT DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (vendor_id) REFERENCES vendors (id),
                FOREIGN KEY (department_id) REFERENCES departments (id),
                FOREIGN KEY (requester_id) REFERENCES users (id)
            )
        """)
        
        # Approvals table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS approvals (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                request_id INTEGER,
                step_order INTEGER,
                role TEXT NOT NULL,
                approver_id INTEGER,
                status TEXT DEFAULT 'pending',
                comment TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (request_id) REFERENCES requests (id),
                FOREIGN KEY (approver_id) REFERENCES users (id)
            )
        """)
        
        # Audit logs table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS audit_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                request_id INTEGER,
                action TEXT NOT NULL,
                actor_id INTEGER,
                details TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (request_id) REFERENCES requests (id),
                FOREIGN KEY (actor_id) REFERENCES users (id)
            )
        """)
        
        # Payments table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS payments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                request_id INTEGER UNIQUE,
                amount DECIMAL(10,2) NOT NULL,
                payment_method TEXT DEFAULT 'bank_transfer',
                payment_status TEXT DEFAULT 'pending',
                transaction_id TEXT,
                processed_by INTEGER,
                processed_at DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (request_id) REFERENCES requests (id),
                FOREIGN KEY (processed_by) REFERENCES users (id)
            )
        """)
        
        conn.commit()
        conn.close()
    
    def seed_demo_data(self):
        """Add demo users, departments, and vendors"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        # Check if data already exists
        cursor.execute("SELECT COUNT(*) FROM users")
        if cursor.fetchone()[0] > 0:
            conn.close()
            return
        
        # Insert departments first - Simple structure
        departments = [
            (1, "Engineering", None),
            (2, "Finance", None),
            (3, "Legal", None)
        ]
        cursor.executemany("INSERT INTO departments (id, name, manager_id) VALUES (?, ?, ?)", departments)
        
        # Insert users - Clean hierarchy: 1 Requester → 1 Manager → Finance → Legal
        users = [
            # The main requester (our demo protagonist)
            (1, "Alice Chen", "alice@company.com", "requester", 1),
            
            # Approval chain
            (2, "Bob Smith", "bob@company.com", "manager", 1),      # Engineering Manager
            (3, "Fiona Davis", "fiona@company.com", "finance", 2),  # Finance Approver
            (4, "Lily Johnson", "lily@company.com", "legal", 3),    # Legal Approver
            
            # Admin for system overview
            (5, "Admin User", "admin@company.com", "admin", None)
        ]
        cursor.executemany("INSERT INTO users (id, name, email, role, department_id) VALUES (?, ?, ?, ?, ?)", users)
        
        # Update department managers - Simple clean structure
        cursor.execute("UPDATE departments SET manager_id = 2 WHERE id = 1")   # Bob manages Engineering
        cursor.execute("UPDATE departments SET manager_id = 3 WHERE id = 2")   # Fiona manages Finance  
        cursor.execute("UPDATE departments SET manager_id = 4 WHERE id = 3")   # Lily manages Legal
        
        # Insert vendors - Clean selection for demo
        vendors = [
            # New vendors (trigger Legal approval)
            (1, "Snyk", True),
            (2, "DataDog", True),
            
            # Existing vendors (no Legal needed)
            (3, "GitHub", False),
            (4, "AWS", False),
            (5, "Slack", False),
            (6, "Zoom", False)
        ]
        cursor.executemany("INSERT INTO vendors (id, name, is_new_vendor) VALUES (?, ?, ?)", vendors)
        
        conn.commit()
        conn.close()
    
    def execute_query(self, query: str, params: tuple = ()) -> List[Dict]:
        """Execute query and return results as list of dictionaries"""
        conn = self.get_connection()
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute(query, params)
        results = [dict(row) for row in cursor.fetchall()]
        conn.close()
        return results
    
    def execute_insert(self, query: str, params: tuple = ()) -> int:
        """Execute insert query and return the last row id"""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute(query, params)
        last_id = cursor.lastrowid
        conn.commit()
        conn.close()
        return last_id
    
    def execute_update(self, query: str, params: tuple = ()) -> int:
        """Execute update query and return number of affected rows"""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute(query, params)
        affected_rows = cursor.rowcount
        conn.commit()
        conn.close()
        return affected_rows
    
    def create_payment(self, request_id: int, amount: float) -> int:
        """Create a payment record for an approved request"""
        import uuid
        transaction_id = f"TXN_{uuid.uuid4().hex[:8].upper()}"
        
        query = """
            INSERT INTO payments (request_id, amount, transaction_id, payment_status)
            VALUES (?, ?, ?, 'pending')
        """
        return self.execute_insert(query, (request_id, amount, transaction_id))
    
    def process_payment(self, payment_id: int, processed_by: int, status: str = 'completed') -> bool:
        """Process a payment (mark as completed/failed)"""
        query = """
            UPDATE payments 
            SET payment_status = ?, processed_by = ?, processed_at = CURRENT_TIMESTAMP
            WHERE id = ?
        """
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute(query, (status, processed_by, payment_id))
        success = cursor.rowcount > 0
        conn.commit()
        conn.close()
        return success
    
    def get_payments(self) -> list:
        """Get all payments with request details"""
        query = """
            SELECT p.*, r.title, r.description, r.vendor_id, v.name as vendor_name,
                   u.name as processed_by_name
            FROM payments p
            JOIN requests r ON p.request_id = r.id
            JOIN vendors v ON r.vendor_id = v.id
            LEFT JOIN users u ON p.processed_by = u.id
            ORDER BY p.created_at DESC
        """
        return self.execute_query(query)

# Global database instance
db = Database()
