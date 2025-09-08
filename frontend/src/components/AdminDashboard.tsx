'use client';

import { useState, useEffect } from 'react';
import RequestDetails from './RequestDetails';

interface User {
  id: number;
  name: string;
  role: string;
}

interface AdminDashboardProps {
  user: User;
}

export default function AdminDashboard({ user }: AdminDashboardProps) {
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [paymentStats, setPaymentStats] = useState({ pending: 0, completed: 0, failed: 0, totalAmount: 0 });
  const [vendorSpending, setVendorSpending] = useState<Array<{
    name: string;
    total: number;
    approved: number;
    pending: number;
    rejected: number;
    count: number;
  }>>([]);

  useEffect(() => {
    fetchAllRequests();
    fetchPaymentStats();
    // Poll for updates every 10 seconds
    const interval = setInterval(() => {
      fetchAllRequests();
      fetchPaymentStats();
    }, 10000);
    return () => clearInterval(interval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchAllRequests = async () => {
    try {
      const response = await fetch('http://localhost:8000/requests');
      const data = await response.json();
      setRequests(data.requests || []);
      calculateVendorSpending(data.requests || []);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentStats = async () => {
    try {
      const response = await fetch('http://localhost:8000/payments');
      const data = await response.json();
      const payments = data.payments || [];

      const stats = payments.reduce((acc: {pending: number, completed: number, failed: number, totalAmount: number}, payment: {payment_status: string, amount: number}) => {
        acc[payment.payment_status as keyof typeof acc] = (acc[payment.payment_status as keyof typeof acc] || 0) + 1;
        acc.totalAmount += payment.amount;
        return acc;
      }, { pending: 0, completed: 0, failed: 0, totalAmount: 0 });

      setPaymentStats(stats);
    } catch (error) {
      console.error('Error fetching payment stats:', error);
    }
  };

  const calculateVendorSpending = (requestsData: any[]) => {
    const vendorTotals: { [key: string]: { name: string; total: number; approved: number; pending: number; rejected: number; count: number } } = {};
    
    requestsData.forEach((request: any) => {
      const vendorName = request.vendor_name;
      if (!vendorTotals[vendorName]) {
        vendorTotals[vendorName] = {
          name: vendorName,
          total: 0,
          approved: 0,
          pending: 0,
          rejected: 0,
          count: 0
        };
      }
      
      vendorTotals[vendorName].total += request.amount;
      vendorTotals[vendorName].count += 1;
      
      if (request.status === 'approved') {
        vendorTotals[vendorName].approved += request.amount;
      } else if (request.status === 'pending') {
        vendorTotals[vendorName].pending += request.amount;
      } else if (request.status === 'rejected') {
        vendorTotals[vendorName].rejected += request.amount;
      }
    });
    
    const sortedVendors = Object.values(vendorTotals).sort((a, b) => b.total - a.total);
    setVendorSpending(sortedVendors);
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

  const getStatusStats = () => {
    const stats = {
      all: requests.length,
      pending: requests.filter((r: any) => r.status === 'pending').length,
      approved: requests.filter((r: any) => r.status === 'approved').length,
      rejected: requests.filter((r: any) => r.status === 'rejected').length,
    };
    return stats;
  };

  const getFilteredRequests = () => {
    if (filter === 'all') return requests;
    return requests.filter((request: any) => request.status === filter);
  };

  const getTotalValue = () => {
    return requests
      .filter((r: any) => r.status === 'approved')
      .reduce((sum: number, r: any) => sum + r.amount, 0);
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

  const stats = getStatusStats();
  const filteredRequests = getFilteredRequests();

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Admin Dashboard
        </h2>
        <p className="text-gray-600">
          Welcome back, {user.name}! Monitor all procurement requests and system activity.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">Total Requests</p>
              <p className="text-2xl font-bold text-gray-900">{stats.all}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">Approved</p>
              <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">Total Value</p>
              <p className="text-2xl font-bold text-gray-900">${getTotalValue().toLocaleString()}</p>
            </div>
            <div className="p-3 bg-gray-100 rounded-lg">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">Pending Payments</p>
              <p className="text-2xl font-bold text-yellow-600">{paymentStats.pending}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">Completed Payments</p>
              <p className="text-2xl font-bold text-green-600">{paymentStats.completed}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">Failed Payments</p>
              <p className="text-2xl font-bold text-red-600">{paymentStats.failed}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">Total Payment Value</p>
              <p className="text-2xl font-bold text-blue-600">${paymentStats.totalAmount.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Vendor Spending Analysis */}
      <div className="bg-white rounded-lg shadow-sm border mb-6">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Vendor Spending Analysis</h3>
          <p className="text-sm text-gray-600 mt-1">Total spending per vendor across all requests</p>
        </div>
        <div className="p-6">
          {vendorSpending.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No vendor data available
            </div>
          ) : (
            <div className="space-y-4">
              {vendorSpending.map((vendor: any, index: number) => (
                <div key={vendor.name} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                      <h4 className="text-lg font-semibold text-gray-900">{vendor.name}</h4>
                      <span className="text-sm text-gray-500">({vendor.count} requests)</span>
                    </div>
                    <div className="mt-2 flex space-x-6 text-sm">
                      <span className="text-green-600">
                        Approved: ${vendor.approved.toLocaleString()}
                      </span>
                      <span className="text-yellow-600">
                        Pending: ${vendor.pending.toLocaleString()}
                      </span>
                      <span className="text-red-600">
                        Rejected: ${vendor.rejected.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">
                      ${vendor.total.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500">Total</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border mb-6">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">All Requests</h3>
          <div className="mt-4 flex space-x-2">
            {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  filter === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)} ({stats[status]})
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="text-lg text-gray-600">Loading requests...</div>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No requests found</h3>
            <p className="text-gray-500">
              {filter === 'all' 
                ? 'No requests have been submitted yet.' 
                : `No ${filter} requests found.`}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredRequests.map((request: any) => (
              <div
                key={request.id}
                className="p-6 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => setSelectedRequest(request.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <h4 className="text-lg font-medium text-gray-900 mr-3">
                        {request.title}
                      </h4>
                      <span className="text-sm text-gray-500">#{request.id}</span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {request.description}
                    </p>
                    
                    <div className="flex items-center space-x-6 text-sm text-gray-500">
                      <span>
                        Amount: <span className="font-medium text-gray-900">${request.amount.toLocaleString()}</span>
                      </span>
                      <span>
                        Requester: <span className="font-medium">{request.requester_name}</span>
                      </span>
                      <span>
                        Vendor: <span className="font-medium">{request.vendor_name}</span>
                      </span>
                      <span>
                        Department: <span className="font-medium">{request.department_name}</span>
                      </span>
                      <span>
                        {new Date(request.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="ml-6">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                        request.status
                      )}`}
                    >
                      {request.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Auto-refresh indicator */}
      <div className="text-center text-xs text-gray-400">
        Auto-refreshing every 10 seconds for new requests
      </div>
    </div>
  );
}
