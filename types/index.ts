export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface BillItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  selectedBy: string[]; // Array of user IDs who selected this item
}

export interface BankDetails {
  bankName: string;
  accountName: string;
  accountNumber: string;
}

export interface Bill {
  id: string;
  title: string;
  description?: string;
  totalAmount: number;
  bankAccountNumber: string;
  created_by: string;
  createdAt: Date;
  dueDate?: Date; // Optional due date for the bill
  participants: User[];
  items: BillItem[];
  bankDetails: BankDetails;
  status: 'select' | 'pay' | 'closed';
  total: number;
  tag?: string; // Optional tag/label for grouping bills
}

export interface UserCost {
  userId: string;
  userName: string;
  items: BillItem[];
  total: number;
}

export interface Friend {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  addedAt: Date;
  status: 'active' | 'pending';
}

export interface FriendRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  fromUser: User;
  toUser: User;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: Date;
}