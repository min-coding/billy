import { Bill } from '@/types';

export const mockBills: Bill[] = [
  {
    id: 'bill1',
    title: 'Dinner at Italian Restaurant',
    description: 'Team dinner after project completion',
    totalAmount: 240.00,
    createdBy: 'user1',
    status: 'pay',
    dueDate: new Date('2024-01-15'),
    tag: 'Food',
    bankName: 'Chase Bank',
    accountName: 'John Doe',
    accountNumber: '****1234',
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-10'),
    participants: [
      { id: 'user1', name: 'John Doe', email: 'john@example.com', avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2' },
      { id: 'user2', name: 'Jane Smith', email: 'jane@example.com', avatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2' },
      { id: 'user3', name: 'Mike Johnson', email: 'mike@example.com', avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2' },
    ],
    items: [
      { id: 'item1', name: 'Pasta Carbonara', price: 18.50, quantity: 2, selectedBy: ['user1', 'user2'] },
      { id: 'item2', name: 'Margherita Pizza', price: 16.00, quantity: 1, selectedBy: ['user3'] },
      { id: 'item3', name: 'Caesar Salad', price: 12.00, quantity: 2, selectedBy: ['user1', 'user3'] },
      { id: 'item4', name: 'Tiramisu', price: 8.50, quantity: 3, selectedBy: ['user1', 'user2', 'user3'] },
      { id: 'item5', name: 'Wine Bottle', price: 45.00, quantity: 2, selectedBy: ['user1', 'user2', 'user3'] },
    ],
    bankDetails: {
      bankName: 'Chase Bank',
      accountName: 'John Doe',
      accountNumber: '****1234'
    },
    testSubmittedSelections: ['user1', 'user2'],
    testPaymentStatus: {
      'user2': 'verified',
      'user3': 'unpaid'
    }
  },
  {
    id: 'bill2',
    title: 'Weekend Grocery Shopping',
    description: 'Shared groceries for the house',
    totalAmount: 156.75,
    createdBy: 'user2',
    status: 'pay',
    dueDate: new Date('2024-01-20'),
    tag: 'Groceries',
    bankName: 'Bank of America',
    accountName: 'Jane Smith',
    accountNumber: '****5678',
    createdAt: new Date('2024-01-12'),
    updatedAt: new Date('2024-01-12'),
    participants: [
      { id: 'user1', name: 'John Doe', email: 'john@example.com', avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2' },
      { id: 'user2', name: 'Jane Smith', email: 'jane@example.com', avatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2' },
      { id: 'user4', name: 'Sarah Wilson', email: 'sarah@example.com', avatar: 'https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2' },
    ],
    items: [
      { id: 'item6', name: 'Organic Vegetables', price: 24.50, quantity: 1, selectedBy: ['user1', 'user2', 'user4'] },
      { id: 'item7', name: 'Fresh Fruits', price: 18.25, quantity: 1, selectedBy: ['user2', 'user4'] },
      { id: 'item8', name: 'Dairy Products', price: 32.00, quantity: 1, selectedBy: ['user1', 'user2'] },
      { id: 'item9', name: 'Bread & Bakery', price: 15.75, quantity: 1, selectedBy: ['user1', 'user4'] },
      { id: 'item10', name: 'Cleaning Supplies', price: 28.50, quantity: 1, selectedBy: ['user1', 'user2', 'user4'] },
    ],
    bankDetails: {
      bankName: 'Bank of America',
      accountName: 'Jane Smith',
      accountNumber: '****5678'
    },
    testSubmittedSelections: ['user1', 'user2', 'user4'],
    testPaymentStatus: {
      'user1': 'verified',
      'user4': 'unpaid'
    }
  },
  {
    id: 'bill3',
    title: 'Movie Night Snacks',
    description: 'Snacks and drinks for movie marathon',
    totalAmount: 67.30,
    createdBy: 'user3',
    status: 'select',
    dueDate: new Date('2024-01-25'),
    tag: 'Entertainment',
    bankName: 'Wells Fargo',
    accountName: 'Mike Johnson',
    accountNumber: '****9012',
    createdAt: new Date('2024-01-14'),
    updatedAt: new Date('2024-01-14'),
    participants: [
      { id: 'user1', name: 'John Doe', email: 'john@example.com', avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2' },
      { id: 'user3', name: 'Mike Johnson', email: 'mike@example.com', avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2' },
      { id: 'user4', name: 'Sarah Wilson', email: 'sarah@example.com', avatar: 'https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2' },
    ],
    items: [
      { id: 'item11', name: 'Popcorn', price: 8.99, quantity: 3, selectedBy: [] },
      { id: 'item12', name: 'Soda Bottles', price: 12.50, quantity: 2, selectedBy: [] },
      { id: 'item13', name: 'Candy Mix', price: 15.75, quantity: 1, selectedBy: [] },
      { id: 'item14', name: 'Chips Variety Pack', price: 18.99, quantity: 1, selectedBy: [] },
      { id: 'item15', name: 'Ice Cream', price: 11.07, quantity: 1, selectedBy: [] },
    ],
    bankDetails: {
      bankName: 'Wells Fargo',
      accountName: 'Mike Johnson',
      accountNumber: '****9012'
    },
    testSubmittedSelections: [],
    testPaymentStatus: {}
  }
];