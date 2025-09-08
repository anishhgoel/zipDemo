"""
FastAPI backend for Zip-like procurement system.
Simple, clean code perfect for interview demo.
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

from database import db
from rules_engine import rules_engine

app = FastAPI(title="Zip-like Procurement System", version="1.0.0")

# Enable CORS for frontend - allow all origins for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models for request/response
class RequestCreate(BaseModel):
    title: str
    description: str
    amount: float
    vendor_id: int
    department_id: int
    requester_id: int

class ApprovalAction(BaseModel):
    comment: Optional[str] = None

# ============================================================================
# REQUEST ENDPOINTS
# ============================================================================

@app.post("/requests")
async def create_request(request_data: RequestCreate):
    """Submit a new procurement request"""
    
    # Insert the request
    query = """
        INSERT INTO requests (title, description, amount, vendor_id, department_id, requester_id, status)
        VALUES (?, ?, ?, ?, ?, ?, 'pending')
    """
    request_id = db.execute_insert(query, (
        request_data.title,
        request_data.description,
        request_data.amount,
        request_data.vendor_id,
        request_data.department_id,
        request_data.requester_id
    ))
    
    # Determine approval steps using rules engine
    approval_steps = rules_engine.determine_approval_steps(request_data.model_dump())
    
    # Insert approval steps
    for step in approval_steps:
        approval_query = """
            INSERT INTO approvals (request_id, step_order, role, approver_id, status)
            VALUES (?, ?, ?, ?, 'pending')
        """
        db.execute_insert(approval_query, (
            request_id,
            step['step_order'],
            step['role'],
            step['approver_id']
        ))
    
    # Log the action
    log_action(request_id, "created", request_data.requester_id, f"Request created: {request_data.title}")
    
    return {"request_id": request_id, "status": "pending", "approval_steps": approval_steps}

@app.get("/requests/{request_id}")
async def get_request(request_id: int):
    """Get request details with approval steps and audit trail"""
    
    # Get request details
    request_query = """
        SELECT r.*, u.name as requester_name, d.name as department_name, v.name as vendor_name
        FROM requests r
        JOIN users u ON r.requester_id = u.id
        JOIN departments d ON r.department_id = d.id
        JOIN vendors v ON r.vendor_id = v.id
        WHERE r.id = ?
    """
    request_results = db.execute_query(request_query, (request_id,))
    if not request_results:
        raise HTTPException(status_code=404, detail="Request not found")
    
    request_data = request_results[0]
    
    # Get approval steps
    approval_query = """
        SELECT a.*, u.name as approver_name
        FROM approvals a
        JOIN users u ON a.approver_id = u.id
        WHERE a.request_id = ?
        ORDER BY a.step_order
    """
    approvals = db.execute_query(approval_query, (request_id,))
    
    # Get audit trail
    audit_query = """
        SELECT al.*, u.name as actor_name
        FROM audit_logs al
        JOIN users u ON al.actor_id = u.id
        WHERE al.request_id = ?
        ORDER BY al.created_at DESC
    """
    audit_trail = db.execute_query(audit_query, (request_id,))
    
    return {
        "request": request_data,
        "approvals": approvals,
        "audit_trail": audit_trail
    }

# ============================================================================
# APPROVAL ENDPOINTS
# ============================================================================

@app.get("/approvals/mine/{user_id}")
async def get_my_pending_approvals(user_id: int):
    """Get pending approvals for a specific user"""
    
    query = """
        SELECT a.*, r.title, r.description, r.amount, r.created_at as request_created,
               u.name as requester_name, v.name as vendor_name, d.name as department_name
        FROM approvals a
        JOIN requests r ON a.request_id = r.id
        JOIN users u ON r.requester_id = u.id
        JOIN vendors v ON r.vendor_id = v.id
        JOIN departments d ON r.department_id = d.id
        WHERE a.approver_id = ? AND a.status = 'pending'
        ORDER BY r.created_at ASC
    """
    
    pending_approvals = db.execute_query(query, (user_id,))
    return {"pending_approvals": pending_approvals}

@app.post("/requests/{request_id}/approve")
async def approve_request(request_id: int, action: ApprovalAction, approver_id: int):
    """Approve the current step of a request"""
    
    # Find the pending approval for this user
    approval_query = "SELECT * FROM approvals WHERE request_id = ? AND approver_id = ? AND status = 'pending'"
    approval_result = db.execute_query(approval_query, (request_id, approver_id))
    
    if not approval_result:
        raise HTTPException(status_code=404, detail="No pending approval found for this user")
    
    # Update approval status
    approval = approval_result[0]
    update_query = "UPDATE approvals SET status = 'approved' WHERE id = ?"
    db.execute_update(update_query, (approval['id'],))
    
    # Check if request is now complete
    if rules_engine.is_request_complete(request_id):
        db.execute_update("UPDATE requests SET status = 'approved' WHERE id = ?", (request_id,))
        status = "approved"
        
        # Create payment record for approved request
        request_query = "SELECT amount FROM requests WHERE id = ?"
        request_data = db.execute_query(request_query, (request_id,))
        if request_data:
            payment_id = db.create_payment(request_id, request_data[0]['amount'])
            log_action(request_id, "payment_created", approver_id, f"Payment created (ID: {payment_id})")
    else:
        status = "pending"
    
    # Log the action
    log_action(request_id, "approved", approver_id, "Approved")
    
    return {"status": status, "message": "Request approved"}

@app.post("/requests/{request_id}/reject")
async def reject_request(request_id: int, action: ApprovalAction, approver_id: int):
    """Reject the current step of a request"""
    
    # Find the pending approval for this user
    approval_query = "SELECT * FROM approvals WHERE request_id = ? AND approver_id = ? AND status = 'pending'"
    approval_result = db.execute_query(approval_query, (request_id, approver_id))
    
    if not approval_result:
        raise HTTPException(status_code=404, detail="No pending approval found for this user")
    
    # Update approval status
    approval = approval_result[0]
    update_query = "UPDATE approvals SET status = 'rejected' WHERE id = ?"
    db.execute_update(update_query, (approval['id'],))
    
    # Update request status to rejected
    db.execute_update("UPDATE requests SET status = 'rejected' WHERE id = ?", (request_id,))
    
    # Log the action
    log_action(request_id, "rejected", approver_id, "Rejected")
    
    return {"status": "rejected", "message": "Request rejected"}

# ============================================================================
# UTILITY ENDPOINTS
# ============================================================================

@app.get("/users")
async def get_users():
    """Get all users for demo purposes"""
    query = "SELECT id, name, email, role, department_id FROM users"
    users = db.execute_query(query)
    return {"users": users}

@app.get("/departments")
async def get_departments():
    """Get all departments"""
    query = "SELECT id, name, manager_id FROM departments"
    departments = db.execute_query(query)
    return {"departments": departments}

@app.get("/vendors")
async def get_vendors():
    """Get all vendors"""
    query = "SELECT id, name, is_new_vendor FROM vendors"
    vendors = db.execute_query(query)
    return {"vendors": vendors}

@app.get("/requests")
async def get_all_requests():
    """Get all requests for admin dashboard"""
    query = """
        SELECT r.*, u.name as requester_name, d.name as department_name, v.name as vendor_name
        FROM requests r
        JOIN users u ON r.requester_id = u.id
        JOIN departments d ON r.department_id = d.id
        JOIN vendors v ON r.vendor_id = v.id
        ORDER BY r.created_at DESC
    """
    requests = db.execute_query(query)
    return {"requests": requests}

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def log_action(request_id: int, action: str, actor_id: int, details: str = ""):
    """Log an action to the audit trail"""
    query = """
        INSERT INTO audit_logs (request_id, action, actor_id, details)
        VALUES (?, ?, ?, ?)
    """
    db.execute_insert(query, (request_id, action, actor_id, details))

# ============================================================================
# PAYMENT ENDPOINTS
# ============================================================================

@app.get("/payments")
async def get_all_payments():
    """Get all payments with request details"""
    try:
        payments = db.get_payments()
        return {"payments": payments}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching payments: {str(e)}")

@app.post("/payments/{payment_id}/process")
async def process_payment(payment_id: int, processed_by: int, status: str = "completed"):
    """Process a payment (mark as completed/failed)"""
    try:
        success = db.process_payment(payment_id, processed_by, status)
        if not success:
            raise HTTPException(status_code=404, detail="Payment not found")
        
        # Log the payment processing
        db.execute_insert(
            "INSERT INTO audit_logs (request_id, action, actor_id, details) SELECT request_id, ?, ?, ? FROM payments WHERE id = ?",
            (f"payment_{status}", processed_by, f"Payment {status} by user {processed_by}", payment_id)
        )
        
        return {"message": f"Payment {status} successfully", "payment_id": payment_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing payment: {str(e)}")

# ============================================================================
# HEALTH CHECK
# ============================================================================

@app.get("/health")
async def health_check():
    """Simple health check endpoint"""
    return {"status": "healthy", "message": "Zip-like Procurement System is running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
