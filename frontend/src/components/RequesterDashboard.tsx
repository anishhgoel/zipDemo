'use client';

import { useState, useEffect } from 'react';
import RequestForm from './RequestForm';
import RequestDetails from './RequestDetails';

interface User {
  id: number;
  name: string;
  role: string;
  department_id: number;
}

interface RequesterDashboardProps {
  user: User;
}

export default function RequesterDashboard({ user }: RequesterDashboardProps) {
  const [activeTab, setActiveTab] = useState<'submit' | 'track'>('submit');
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState<number | null>(null);

  useEffect(() => {
    if (activeTab === 'track') {
      fetchMyRequests();
    }
  }, [activeTab, user.id]);

  const fetchMyRequests = async () => {
    try {
      const response = await fetch('http://localhost:8000/requests');
      const data = await response.json();
      // Filter requests by this user
      const myRequests = data.requests.filter((req: any) => req.requester_id === user.id);
      setRequests(myRequests);
    } catch (error) {
      console.error('Error fetching requests:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (selectedRequest) {
    return (
      <RequestDetails
        requestId={selectedRequest}
        onBack={() => setSelectedRequest(null)}
        userRole={user.role}
      />
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Requester Dashboard
        </h2>
        <p className="text-gray-600">
          Welcome back, {user.name}! Submit new requests or track existing ones.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('submit')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'submit'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Submit Request
          </button>
          <button
            onClick={() => setActiveTab('track')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'track'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Track Requests
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'submit' && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            Submit New Procurement Request
          </h3>
          <RequestForm user={user} onSubmitSuccess={() => setActiveTab('track')} />
        </div>
      )}

      {activeTab === 'track' && (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold text-gray-900">
              Your Requests ({requests.length})
            </h3>
          </div>
          
          {requests.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No requests found. Submit your first request!
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {requests.map((request: any) => (
                <div
                  key={request.id}
                  className="p-6 hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelectedRequest(request.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-lg font-medium text-gray-900 mb-2">
                        {request.title}
                      </h4>
                      <p className="text-sm text-gray-600 mb-3">
                        {request.description}
                      </p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>Amount: ${request.amount.toLocaleString()}</span>
                        <span>Vendor: {request.vendor_name}</span>
                        <span>Department: {request.department_name}</span>
                        <span>
                          Submitted: {new Date(request.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="ml-6">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                          request.status
                        )}`}
                      >
                        {request.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
