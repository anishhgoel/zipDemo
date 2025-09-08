'use client';

import { useState, useEffect } from 'react';

interface User {
  id: number;
  name: string;
  department_id: number;
}

interface RequestFormProps {
  user: User;
  onSubmitSuccess: () => void;
}

interface Vendor {
  id: number;
  name: string;
  is_new_vendor: boolean;
}

interface Department {
  id: number;
  name: string;
}

export default function RequestForm({ user, onSubmitSuccess }: RequestFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    amount: '',
    vendor_id: '',
  });
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchVendorsAndDepartments();
  }, []);

  const fetchVendorsAndDepartments = async () => {
    try {
      const [vendorsRes, departmentsRes] = await Promise.all([
        fetch('https://zipdemo.onrender.com/vendors'),
        fetch('https://zipdemo.onrender.com/departments')
      ]);
      
      setVendors((await vendorsRes.json()).vendors);
      setDepartments((await departmentsRes.json()).departments);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const requestData = {
        title: formData.title,
        description: formData.description,
        amount: parseFloat(formData.amount),
        vendor_id: parseInt(formData.vendor_id),
        department_id: user.department_id,
        requester_id: user.id,
      };

      const response = await fetch('https://zipdemo.onrender.com/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error('Failed to submit request');
      }

      const result = await response.json();

      // Reset form
      setFormData({
        title: '',
        description: '',
        amount: '',
        vendor_id: '',
      });

      // Show success and switch to tracking tab
      alert('Request submitted successfully!');
      onSubmitSuccess();

    } catch (error) {
      setError('Failed to submit request. Please try again.');
      console.error('Error submitting request:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedVendor = vendors.find(v => v.id === parseInt(formData.vendor_id));
  const userDepartment = departments.find(d => d.id === user.department_id);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
          Request Title *
        </label>
        <input
          type="text"
          id="title"
          required
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
          placeholder="e.g., Snyk Security Tool License"
        />
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
          Description *
        </label>
        <textarea
          id="description"
          required
          rows={3}
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
          placeholder="Describe what you need and why..."
        />
      </div>

      {/* Amount */}
      <div>
        <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
          Amount ($) *
        </label>
        <input
          type="number"
          id="amount"
          required
          min="0"
          step="0.01"
          value={formData.amount}
          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
          placeholder="0.00"
        />
      </div>

      {/* Vendor */}
      <div>
        <label htmlFor="vendor" className="block text-sm font-medium text-gray-700 mb-2">
          Vendor *
        </label>
        <select
          id="vendor"
          required
          value={formData.vendor_id}
          onChange={(e) => setFormData({ ...formData, vendor_id: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
        >
          <option value="">Select a vendor...</option>
          {vendors.map((vendor) => (
            <option key={vendor.id} value={vendor.id}>
              {vendor.name} {vendor.is_new_vendor ? '(New Vendor)' : ''}
            </option>
          ))}
        </select>
        {selectedVendor?.is_new_vendor && (
          <p className="mt-1 text-sm text-orange-600">
            This is a new vendor - Legal approval will be required
          </p>
        )}
      </div>

      {/* Department (read-only) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Department
        </label>
        <input
          type="text"
          readOnly
          value={userDepartment?.name || 'Unknown'}
          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
        />
      </div>

      {/* Approval Preview */}
      {formData.amount && formData.vendor_id && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <h4 className="text-sm font-medium text-blue-900 mb-2">
            Approval Route Preview:
          </h4>
          <div className="space-y-1 text-sm text-blue-800">
            <div>1. Department Manager (always required)</div>
            {parseFloat(formData.amount) > 10000 && (
              <div>2. Finance Team (amount {'>'} $10,000)</div>
            )}
            {selectedVendor?.is_new_vendor && (
              <div>
                {parseFloat(formData.amount) > 10000 ? '3' : '2'}. Legal Team (new vendor)
              </div>
            )}
          </div>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-500 text-white font-bold py-4 px-10 rounded-lg text-xl border-2 border-green-700 disabled:border-gray-600 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200 disabled:cursor-not-allowed disabled:transform-none disabled:hover:scale-100"
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
              <span className="font-bold">SUBMITTING...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <span className="font-bold">SUBMIT REQUEST</span>
            </div>
          )}
        </button>
      </div>
    </form>
  );
}
