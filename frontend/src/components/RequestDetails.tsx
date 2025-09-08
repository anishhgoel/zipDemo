'use client';

import { useState, useEffect } from 'react';

interface RequestDetailsProps {
  requestId: number;
  onBack: () => void;
  userRole: string;
  userId?: number;
  onApprovalAction?: (requestId: number, action: 'approve' | 'reject') => void;
}

export default function RequestDetails({ requestId, onBack, userRole, userId, onApprovalAction }: RequestDetailsProps) {
  const [requestData, setRequestData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequestDetails();
    // Poll for updates every 3 seconds when viewing details
    const interval = setInterval(fetchRequestDetails, 3000);
    return () => clearInterval(interval);
  }, [requestId]);

  const fetchRequestDetails = async () => {
    try {
      // Add cache busting to ensure fresh data
      const response = await fetch(`http://192.168.105.1:8000/requests/${requestId}?t=${Date.now()}`);
      const data = await response.json();
      setRequestData(data);
      
    } catch (error) {
      console.error('Error fetching request details:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getApprovalStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <span className="text-green-500">APPROVED</span>;
      case 'rejected':
        return <span className="text-red-500">REJECTED</span>;
      case 'pending':
        return <span className="text-yellow-500">PENDING</span>;
      default:
        return <span className="text-gray-500">○</span>;
    }
  };

  const canApprove = () => {
    if (!userId || !requestData || userRole === 'requester') return false;
    
    // Find pending approval for this user
    const myPendingApproval = requestData.approvals?.find((a: any) => 
      a.approver_id === userId && a.status === 'pending'
    );
    
    return !!myPendingApproval;
  };

  const handleApproval = (action: 'approve' | 'reject') => {
    if (onApprovalAction) {
      onApprovalAction(requestId, action);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-600">Loading request details...</div>
      </div>
    );
  }

  if (!requestData) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">Error loading request details</div>
        <button onClick={onBack} className="text-blue-600 hover:text-blue-800">
          ← Back to Dashboard
        </button>
      </div>
    );
  }

  const { request, approvals, audit_trail } = requestData;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={onBack}
          className="text-blue-600 hover:text-blue-800 mb-4 flex items-center"
        >
          ← Back to Dashboard
        </button>
        
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{request.title}</h2>
            <p className="text-gray-600">Request #{request.id}</p>
          </div>
          <span
            className={`px-3 py-1 text-sm font-medium rounded-full border ${getStatusColor(
              request.status
            )}`}
          >
            {request.status.toUpperCase()}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Request Details */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Request Details</h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Description</label>
                <p className="mt-1 text-gray-900">{request.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Amount</label>
                  <p className="mt-1 text-lg font-semibold text-gray-900">
                    ${request.amount.toLocaleString()}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Vendor</label>
                  <p className="mt-1 text-gray-900">{request.vendor_name}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Requester</label>
                  <p className="mt-1 text-gray-900">{request.requester_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Department</label>
                  <p className="mt-1 text-gray-900">{request.department_name}</p>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Submitted</label>
                <p className="mt-1 text-gray-900">
                  {new Date(request.created_at).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Approval Actions (if user can approve) */}
          {canApprove() && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-4">
                Your Approval Required
              </h3>
              <p className="text-blue-800 mb-4">
                This request is waiting for your approval as {userRole}.
              </p>
              
                              <div className="flex space-x-4">
                  <button
                    onClick={() => handleApproval('approve')}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold px-8 py-4 rounded-lg text-xl border-2 border-green-700 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200"
                  >
                    APPROVE REQUEST
                  </button>
                  <button
                    onClick={() => handleApproval('reject')}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold px-8 py-4 rounded-lg text-xl border-2 border-red-700 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200"
                  >
                    REJECT REQUEST
                  </button>
                </div>
            </div>
          )}

          {/* Show message when request is already completed */}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Approval Workflow */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Approval Workflow</h3>
            
            <div className="space-y-3">
              {approvals?.map((approval: any, index: number) => (
                <div key={approval.id} className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1">
                    {getApprovalStatusIcon(approval.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      Step {approval.step_order}: {approval.approver_name}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">
                      {approval.role} • {approval.status}
                    </p>
                    {approval.status !== 'pending' && approval.created_at && (
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(approval.created_at).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Audit Trail */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Timeline</h3>
            
            <div className="space-y-3">
              {audit_trail?.map((log: any) => (
                <div key={log.id} className="text-sm">
                  <div className="flex justify-between items-start">
                    <span className="font-medium text-gray-900">{log.actor_name}</span>
                    <span className="text-xs text-gray-400">
                      {new Date(log.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-gray-600 capitalize">{log.action}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Auto-refresh indicator */}
      <div className="mt-6 text-center text-xs text-gray-400">
        Auto-refreshing every 3 seconds for live updates
      </div>
    </div>
  );
}
