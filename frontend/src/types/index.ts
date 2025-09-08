// TypeScript interfaces for the Zip Procurement System

export interface User {
  id: number;
  name: string;
  role: string;
  department_id?: number;
}

export interface Department {
  id: number;
  name: string;
}

export interface Vendor {
  id: number;
  name: string;
  is_new_vendor: boolean;
}

export interface Request {
  id: number;
  title: string;
  description: string;
  amount: number;
  requester_id: number;
  vendor_id: number;
  department_id: number;
  status: string;
  created_at: string;
  requester_name?: string;
  vendor_name?: string;
  department_name?: string;
}

export interface Approval {
  id: number;
  request_id: number;
  approver_id: number;
  role: string;
  status: string;
  created_at: string;
  approved_at?: string;
  approver_name?: string;
}

export interface RequestDetails {
  request: Request;
  approvals: Approval[];
  vendor: Vendor;
  department: Department;
  requester: User;
}

export interface Payment {
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
  vendor_id: number;
  vendor_name: string;
  processed_by_name?: string;
}

export interface VendorSpending {
  [vendorName: string]: number;
}

export interface PaymentStats {
  pending: number;
  completed: number;
  failed: number;
  totalAmount: number;
}
