'use client';

import { useState, useEffect } from 'react';
import RequestDetails from './RequestDetails';
const API_BASE_URL = 'http://localhost:8000';

const ROLE_NAMES = {
  manager: 'Department Manager',
  finance: 'Finance Approver', 
  legal: 'Legal Approver'
};

interface User {
  id: number;
  name: string;
  role: string;
}

interface ApproverDashboardProps {
  user: User;
}

export default function ApproverDashboard({ user }: ApproverDashboardProps) {
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [allRequests, setAllRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    fetchPendingApprovals();
    fetchAllRequests();
    // Poll for updates every 5 seconds
    const interval = setInterval(() => {
      fetchPendingApprovals();
      fetchAllRequests();
    }, 5000);
    return () => clearInterval(interval);
  }, [user.id]);

  const fetchPendingApprovals = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/approvals/mine/${user.id}`);
      const data = await response.json();
      setPendingApprovals(data.pending_approvals || []);
    } catch (error) {
      console.error('Error fetching pending approvals:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllRequests = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/requests`);
      const data = await response.json();
      setAllRequests(data.requests || []);
    } catch (error) {
      console.error('Error fetching all requests:', error);
    }
  };

  const handleApproval = async (requestId: number, action: 'approve' | 'reject') => {
    try {
      const response = await fetch(`${API_BASE_URL}/requests/${requestId}/${action}?approver_id=${user.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });

      alert(`Request ${action}d successfully!`);
      fetchPendingApprovals();
      
      if (selectedRequest === requestId) {
        setSelectedRequest(null);
      }
    } catch (error) {
      alert(`Error ${action}ing request. Please try again.`);
      console.error(`Error ${action}ing request:`, error);
    }
  };

  const getRoleDisplayName = (role: string) => {
    return ROLE_NAMES[role as keyof typeof ROLE_NAMES] || role;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getUrgencyColor = (amount: number) => {
    if (amount > 10000) return 'bg-orange-100 text-orange-800 border-orange-200';
    return 'bg-green-100 text-green-800 border-green-200';
  };

  if (selectedRequest) {
    return (
      <RequestDetails
        requestId={selectedRequest}
        onBack={() => setSelectedRequest(null)}
        userRole={user.role}
        userId={user.id}
        onApprovalAction={handleApproval}
      />
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          {getRoleDisplayName(user.role)} Dashboard
        </h2>
        <p className="text-gray-600">
          Welcome back, {user.name}! You have {pendingApprovals.length} request(s) waiting for your approval.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-gray-600">Loading pending approvals...</div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {showHistory ? `All Requests (${allRequests.length})` : `Pending Approvals (${pendingApprovals.length})`}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {showHistory 
                    ? 'View all requests in the system including completed ones.'
                    : 'These requests are waiting for your approval. Click on any request to view details and take action.'
                  }
                </p>
              </div>
              
              {/* Toggle Buttons */}
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowHistory(false)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    !showHistory 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Pending ({pendingApprovals.length})
                </button>
                <button
                  onClick={() => setShowHistory(true)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    showHistory 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  All Requests ({allRequests.length})
                </button>
              </div>
            </div>
          </div>

          {(!showHistory && pendingApprovals.length === 0) ? (
            <div className="p-12 text-center">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">All caught up!</h3>
              <p className="text-gray-500">No pending approvals at the moment.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {(showHistory ? allRequests : pendingApprovals).map((item: any) => (
                <div
                  key={item.id}
                  className="p-6 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => setSelectedRequest(showHistory ? item.id : item.request_id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <h4 className="text-lg font-medium text-gray-900 mr-3">
                          {item.title}
                        </h4>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded border ${getUrgencyColor(
                            item.amount
                          )}`}
                        >
                          ${item.amount.toLocaleString()}
                        </span>
                        {showHistory && (
                          <span
                            className={`ml-2 px-2 py-1 text-xs font-medium rounded border ${getStatusColor(
                              item.status
                            )}`}
                          >
                            {item.status.toUpperCase()}
                          </span>
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {item.description}
                      </p>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>Requested by: <span className="font-medium">{item.requester_name}</span></span>
                        <span>Vendor: <span className="font-medium">{item.vendor_name}</span></span>
                        <span>Department: <span className="font-medium">{item.department_name}</span></span>
                        <span>
                          Submitted: {new Date(item.request_created || item.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    
                    {!showHistory && (
                      <div className="ml-6 flex items-center space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApproval(item.request_id, 'approve');
                          }}
                          className="bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-3 rounded-lg text-base border-2 border-green-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                        >
                          APPROVE
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApproval(item.request_id, 'reject');
                          }}
                          className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-lg text-base border-2 border-red-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                        >
                          REJECT
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Auto-refresh indicator */}
      <div className="mt-4 text-center text-xs text-gray-400">
        Auto-refreshing every 5 seconds for new approvals
      </div>
    </div>
  );
}
