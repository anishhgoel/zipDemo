'use client';

import { useState, useEffect } from 'react';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  department_id: number;
}

interface UserSelectorProps {
  onUserSelect: (user: User) => void;
}

export default function UserSelector({ onUserSelect }: UserSelectorProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('https://zipdemo.onrender.com/users');
      const data = await response.json();
      setUsers(data.users);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'requester':
        return 'bg-blue-100 text-blue-800';
      case 'manager':
        return 'bg-green-100 text-green-800';
      case 'finance':
        return 'bg-purple-100 text-purple-800';
      case 'legal':
        return 'bg-orange-100 text-orange-800';
      case 'admin':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-600">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Select User to Login As
        </h2>
        <p className="text-gray-600">
          This is a demo system. Choose any user to see their dashboard.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map((user) => (
          <div
            key={user.id}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer border border-gray-200"
            onClick={() => onUserSelect(user)}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {user.name}
                </h3>
                <p className="text-sm text-gray-600">{user.email}</p>
              </div>
              <span
                className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(
                  user.role
                )}`}
              >
                {user.role}
              </span>
            </div>
            
            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors">
              Login as {user.name}
            </button>
          </div>
        ))}
      </div>

      <div className="mt-12 bg-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">
          Flow
        </h3>
        <div className="space-y-3 text-sm text-blue-800">
          <div className="bg-white rounded p-3">
            <p className="font-medium text-blue-900 mb-2">Approval Chain:</p>
            <div className="text-xs space-y-1">
              <p><strong>Alice Chen</strong> (Requester) → <strong>Bob Smith</strong> (Manager) → <strong>Fiona Davis</strong> (Finance) → <strong>Lily Johnson</strong> (Legal)</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <p><strong>1.</strong> Login as <strong>Alice Chen</strong> → Submit request ($12k + new vendor)</p>
            <p><strong>2.</strong> Login as <strong>Bob Smith</strong> → Approve as Engineering Manager</p>
            <p><strong>3.</strong> Login as <strong>Fiona Davis</strong> → Approve as Finance (amount &gt; $10k)</p>
            <p><strong>4.</strong> Login as <strong>Lily Johnson</strong> → Approve as Legal (new vendor)</p>
            <p><strong>5.</strong> Login as <strong>Admin User</strong> → View system overview</p>
          </div>
        </div>
        
        
      </div>
    </div>
  );
}
