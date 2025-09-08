"""
Simple rules engine for determining approval workflow.
Super straightforward logic that's easy to explain in an interview.
"""
from typing import List, Dict
from database import db

class RulesEngine:
    def __init__(self):
        pass
    
    def determine_approval_steps(self, request_data: Dict) -> List[Dict]:
        """
        Determine the approval steps based on simple rules.
        Returns list of approval steps in order.
        
        Rules:
        1. Always start with department manager
        2. If amount > $10,000 -> add Finance approval
        3. If new vendor -> add Legal approval
        """
        steps = []
        step_order = 1
        
        # Rule 1: Always require department manager approval first
        manager = self._get_department_manager(request_data['department_id'])
        if manager:
            steps.append({
                'step_order': step_order,
                'role': 'manager',
                'approver_id': manager['id'],
                'approver_name': manager['name']
            })
            step_order += 1
        
        # Rule 2: If amount > $10,000, require Finance approval
        if request_data['amount'] > 10000:
            finance_approver = self._get_finance_approver()
            if finance_approver:
                steps.append({
                    'step_order': step_order,
                    'role': 'finance',
                    'approver_id': finance_approver['id'],
                    'approver_name': finance_approver['name']
                })
                step_order += 1
        
        # Rule 3: If new vendor, require Legal approval
        if self._is_new_vendor(request_data['vendor_id']):
            legal_approver = self._get_legal_approver()
            if legal_approver:
                steps.append({
                    'step_order': step_order,
                    'role': 'legal',
                    'approver_id': legal_approver['id'],
                    'approver_name': legal_approver['name']
                })
                step_order += 1
        
        return steps
    
    def _get_department_manager(self, department_id: int) -> Dict:
        """Get the manager for a department"""
        query = """
            SELECT u.id, u.name, u.email, u.role 
            FROM users u
            JOIN departments d ON u.id = d.manager_id
            WHERE d.id = ?
        """
        results = db.execute_query(query, (department_id,))
        return results[0] if results else None
    
    def _get_finance_approver(self) -> Dict:
        """Get a finance approver"""
        query = "SELECT id, name, email, role FROM users WHERE role = 'finance' LIMIT 1"
        results = db.execute_query(query)
        return results[0] if results else None
    
    def _get_legal_approver(self) -> Dict:
        """Get a legal approver"""
        query = "SELECT id, name, email, role FROM users WHERE role = 'legal' LIMIT 1"
        results = db.execute_query(query)
        return results[0] if results else None
    
    def _is_new_vendor(self, vendor_id: int) -> bool:
        """Check if vendor is new"""
        query = "SELECT is_new_vendor FROM vendors WHERE id = ?"
        results = db.execute_query(query, (vendor_id,))
        return bool(results[0]['is_new_vendor']) if results else False
    
    def get_next_pending_step(self, request_id: int) -> Dict:
        """Get the next pending approval step for a request"""
        query = """
            SELECT * FROM approvals 
            WHERE request_id = ? AND status = 'pending' 
            ORDER BY step_order ASC 
            LIMIT 1
        """
        results = db.execute_query(query, (request_id,))
        return results[0] if results else None
    
    def is_request_complete(self, request_id: int) -> bool:
        """Check if all approval steps are complete"""
        query = """
            SELECT COUNT(*) as total, 
                   SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved
            FROM approvals 
            WHERE request_id = ?
        """
        results = db.execute_query(query, (request_id,))
        if results:
            result = results[0]
            return result['total'] > 0 and result['total'] == result['approved']
        return False
    

# Global rules engine instance
rules_engine = RulesEngine()
