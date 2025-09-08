# Zip-like Procurement System

A simple, clean procurement approval system built for interview demonstrations. Features real-time updates, role-based dashboards, and a rules-based approval engine.

## 🚀 Quick Start

### 1. Start the Backend
```bash
# Install Python dependencies
pip install -r requirements.txt

# Start the FastAPI server
python main.py
```
Backend will run on http://localhost:8000

### 2. Start the Frontend
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies (first time only)
npm install

# Start the development server
npm run dev
```
Frontend will run on http://localhost:3000

## 🎯 Demo Flow

### The Perfect Demo Script:

1. **Open http://localhost:3000**
2. **Login as Alice Chen (Requester)**
   - Submit a request: "$12,000 for Snyk (new vendor)"
   - Watch the approval route preview show: Manager → Finance → Legal

3. **Login as Bob Smith (Manager)**
   - See the request appear in pending approvals
   - Approve it with a comment

4. **Login as Fiona Davis (Finance)**
   - Request automatically appears (amount > $10k)
   - Approve it

5. **Login as Lily Johnson (Legal)**
   - Request appears (new vendor)
   - Can approve or reject with comments

6. **Login as Alice Chen again**
   - See real-time status updates
   - View complete audit trail

7. **Login as Admin User**
   - See all requests and system stats

## 🏗️ Architecture

### Backend (FastAPI + SQLite)
- **`database.py`** - Simple SQLite setup with demo data
- **`rules_engine.py`** - Approval routing logic (3 simple rules)
- **`main.py`** - REST API endpoints

### Frontend (Next.js + Tailwind)
- **Role-based dashboards** for each user type
- **Real-time polling** every 5 seconds
- **Clean, modern UI** that's easy to navigate

### Rules Engine
Simple and explainable:
1. **Always** → Department Manager approval
2. **If amount > $10k** → Add Finance approval  
3. **If new vendor** → Add Legal approval

## 🎨 Key Features for Interview

### 1. **Real Working System**
- Not hardcoded - actual database and rules
- Real approval routing based on business logic
- Live updates without page refresh

### 2. **Clean, Understandable Code**
- Simple functions with clear names
- Well-commented for easy explanation
- No over-engineering - just what's needed

### 3. **Professional UI**
- Modern design with Tailwind CSS
- Responsive and intuitive
- Role-appropriate dashboards

### 4. **Demo-Ready**
- Pre-loaded with test users and data
- Clear demo script to follow
- Works offline (SQLite database)

## 🔧 Technical Details

### Database Schema
```sql
users(id, name, email, role, department_id)
departments(id, name, manager_id)  
vendors(id, name, is_new_vendor)
requests(id, title, description, amount, vendor_id, department_id, status)
approvals(id, request_id, step_order, role, approver_id, status, comment)
audit_logs(id, request_id, action, actor_id, details, created_at)
```

### API Endpoints
- `POST /requests` - Submit new request
- `GET /requests/{id}` - Get request details
- `GET /approvals/mine/{user_id}` - Get pending approvals
- `POST /requests/{id}/approve` - Approve request
- `POST /requests/{id}/reject` - Reject request

### Demo Users
- **Alice Chen** - Requester (Engineering)
- **Bob Smith** - Manager (Engineering) 
- **Fiona Davis** - Finance Approver
- **Lily Johnson** - Legal Approver
- **Admin User** - System Administrator

## 💡 Interview Talking Points

### Why This Architecture?
- **SQLite**: Simple, no setup required, perfect for demo
- **FastAPI**: Fast, modern Python, automatic API docs
- **Next.js**: React with great DX, easy to understand
- **Polling**: Simple real-time updates, no WebSocket complexity

### Scalability Considerations
- Rules engine easily extensible
- Database can swap to Postgres
- Frontend components are modular
- API is stateless and cacheable

### Code Quality
- Type hints throughout
- Clear separation of concerns
- Error handling
- Consistent naming conventions

## 🐛 Troubleshooting

### Backend Issues
- Make sure Python 3.7+ is installed
- Check if port 8000 is available
- Database auto-creates on first run

### Frontend Issues  
- Make sure Node.js 16+ is installed
- Run `npm install` in the frontend directory
- Check if port 3000 is available

### CORS Issues
- Backend is configured to allow localhost:3000
- If testing from different port, update CORS settings in main.py

## 📈 Possible Extensions

Easy to add during interview if asked:
- Email notifications
- File attachments  
- Budget tracking
- Advanced reporting
- WebSocket real-time updates
- Mobile responsive improvements

---

**Built for interview success** - Simple, clean, and impressive! 🎯
# zipDemo
