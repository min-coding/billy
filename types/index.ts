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
  selectedBy: string[]; // Array of user IDs who selected this item
}

export interface Bill {
  id: string;
  title: string;
  description?: string;
  createdBy: string;
  createdAt: Date;
  participants: User[];
  items: BillItem[];
  status: 'select' | 'pay' | 'closed';
  total: number;
}

export interface UserCost {
  userId: string;
  userName: string;
  items: BillItem[];
  total: number;
}