'use client';

import { useState } from 'react';
import UserSelector from '@/components/UserSelector';
import RequesterDashboard from '@/components/RequesterDashboard';
import ApproverDashboard from '@/components/ApproverDashboard';
import AdminDashboard from '@/components/AdminDashboard';
import PaymentDashboard from '@/components/PaymentDashboard';

export default function Home() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'approvals' | 'payments'>('approvals');

  const renderDashboard = () => {
    if (!currentUser) return null;

    // Special handling for finance users - show both approvals and payments
    if (currentUser.role === 'finance') {
      return (
        <div className="space-y-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('approvals')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'approvals'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Approval Requests
              </button>
              <button
                onClick={() => setActiveTab('payments')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'payments'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Payment Processing
              </button>
            </nav>
          </div>
          {activeTab === 'approvals' ? (
            <ApproverDashboard user={currentUser} />
          ) : (
            <PaymentDashboard user={currentUser} />
          )}
        </div>
      );
    }

    const dashboards = {
      requester: <RequesterDashboard user={currentUser} />,
      manager: <ApproverDashboard user={currentUser} />,
      legal: <ApproverDashboard user={currentUser} />,
      admin: <AdminDashboard user={currentUser} />
    };

    return dashboards[currentUser.role] || <div>Unknown role</div>;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">
              Zip Procurement System
            </h1>
            {currentUser && (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">
                  Logged in as: <span className="font-medium">{currentUser.name}</span> ({currentUser.role})
                </span>
                <button
                  onClick={() => setCurrentUser(null)}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-6 py-3 rounded-lg text-base border-2 border-purple-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                >
                  SWITCH USER
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!currentUser ? (
          <UserSelector onUserSelect={setCurrentUser} />
        ) : (
          renderDashboard()
        )}
      </main>
    </div>
  );
}