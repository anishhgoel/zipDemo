'use client';

import { useState, useEffect } from 'react';

interface Payment {
  id: number;
  request_id: number;
  amount: number;
  payment_method: string;
  payment_status: string;
  transaction_id: string;
  processed_by?: number;
  processed_at?: string;
  created_at: string;
  title: string;
  description: string;
  vendor_name: string;
  processed_by_name?: string;
}

interface User {
  id: number;
  name: string;
  role: string;
}

interface PaymentDashboardProps {
  user: User;
}

export default function PaymentDashboard({ user }: PaymentDashboardProps) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);

  useEffect(() => {
    fetchPayments();
    // Poll for updates every 10 seconds
    const interval = setInterval(fetchPayments, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchPayments = async () => {
    try {
      const response = await fetch('https://zipdemo.onrender.com/payments');
      const data = await response.json();
      setPayments(data.payments);
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const processPayment = async (paymentId: number, status: 'completed' | 'failed') => {
    setProcessingId(paymentId);
    try {
      const response = await fetch(`https://zipdemo.onrender.com/payments/${paymentId}/process?processed_by=${user.id}&status=${status}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        fetchPayments(); // Refresh the list
      } else {
        console.error('Failed to process payment');
      }
    } catch (error) {
      console.error('Error processing payment:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-600">Loading payments...</div>
      </div>
    );
  }

  const pendingPayments = payments.filter(p => p.payment_status === 'pending');
  const processedPayments = payments.filter(p => p.payment_status !== 'pending');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Payment Processing</h1>
        <div className="text-sm text-gray-500">
          {pendingPayments.length} pending • {processedPayments.length} processed
        </div>
      </div>

      {/* Pending Payments */}
      {pendingPayments.length > 0 && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Pending Payments</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {pendingPayments.map((payment) => (
              <div key={payment.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-medium text-gray-900">{payment.title}</h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(payment.payment_status)}`}>
                        {payment.payment_status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{payment.description}</p>
                    <div className="mt-2 flex items-center space-x-6 text-sm text-gray-500">
                      <span>Vendor: <strong>{payment.vendor_name}</strong></span>
                      <span>Amount: <strong>${payment.amount.toLocaleString()}</strong></span>
                      <span>Transaction: <strong>{payment.transaction_id}</strong></span>
                      <span>Method: <strong>{payment.payment_method.replace('_', ' ').toUpperCase()}</strong></span>
                    </div>
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => processPayment(payment.id, 'completed')}
                      disabled={processingId === payment.id}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium uppercase border-2 border-green-700 shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                    >
                      {processingId === payment.id ? 'Processing...' : 'APPROVE PAYMENT'}
                    </button>
                    <button
                      onClick={() => processPayment(payment.id, 'failed')}
                      disabled={processingId === payment.id}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium uppercase border-2 border-red-700 shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                    >
                      {processingId === payment.id ? 'Processing...' : 'REJECT PAYMENT'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Payments History */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Payment History</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {payments.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No payments found. Payments are created automatically when requests are fully approved.
            </div>
          ) : (
            payments.map((payment) => (
              <div key={payment.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-medium text-gray-900">{payment.title}</h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(payment.payment_status)}`}>
                        {payment.payment_status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{payment.description}</p>
                    <div className="mt-2 flex items-center space-x-6 text-sm text-gray-500">
                      <span>Vendor: <strong>{payment.vendor_name}</strong></span>
                      <span>Amount: <strong>${payment.amount.toLocaleString()}</strong></span>
                      <span>Transaction: <strong>{payment.transaction_id}</strong></span>
                      <span>Created: <strong>{new Date(payment.created_at).toLocaleDateString()}</strong></span>
                      {payment.processed_by_name && (
                        <span>Processed by: <strong>{payment.processed_by_name}</strong></span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
