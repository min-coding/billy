import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Zap } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import BillCard from '@/components/BillCard';
import { Bill } from '@/types';

// Mock data with updated statuses
const mockBills: Bill[] = [
  {
    id: '1',
    title: 'Dinner at Tony\'s',
    description: 'Italian restaurant with the team',
    totalAmount: 120.00,
    bankAccountNumber: '1234567890',
    createdBy: 'user1',
    createdAt: new Date('2024-01-15'),
    participants: [
      { id: 'user1', name: 'John Doe', email: 'john@example.com' },
      { id: 'user2', name: 'Jane Smith', email: 'jane@example.com' },
      { id: 'user3', name: 'Mike Johnson', email: 'mike@example.com' },
    ],
    items: [
      { id: 'item1', name: 'Margherita Pizza', price: 18.99, quantity: 1, selectedBy: ['user1', 'user2'] },
      { id: 'item2', name: 'Caesar Salad', price: 12.50, quantity: 2, selectedBy: ['user2'] },
      { id: 'item3', name: 'Pasta Carbonara', price: 16.75, quantity: 1, selectedBy: ['user3'] },
      { id: 'item4', name: 'Tiramisu', price: 8.99, quantity: 3, selectedBy: ['user1', 'user2', 'user3'] },
    ],
    bankDetails: {
      bankName: 'Chase Bank',
      accountName: 'John Doe',
      accountNumber: '1234567890'
    },
    status: 'select',
    total: 83.22,
  },
  {
    id: '2',
    title: 'Weekend Groceries',
    description: 'Shared groceries for the house',
    totalAmount: 45.50,
    bankAccountNumber: '0987654321',
    createdBy: 'user1',
    createdAt: new Date('2024-01-12'),
    participants: [
      { id: 'user1', name: 'John Doe', email: 'john@example.com' },
      { id: 'user4', name: 'Sarah Wilson', email: 'sarah@example.com' },
    ],
    items: [
      { id: 'item5', name: 'Milk', price: 4.99, quantity: 2, selectedBy: ['user1', 'user4'] },
      { id: 'item6', name: 'Bread', price: 3.50, quantity: 1, selectedBy: ['user1', 'user4'] },
      { id: 'item7', name: 'Eggs', price: 5.99, quantity: 1, selectedBy: ['user1'] },
    ],
    bankDetails: {
      bankName: 'Bank of America',
      accountName: 'John Doe',
      accountNumber: '0987654321'
    },
    status: 'pay',
    total: 14.48,
  },
  {
    id: '3',
    title: 'Movie Night Snacks',
    totalAmount: 25.00,
    bankAccountNumber: '1122334455',
    createdBy: 'user2',
    createdAt: new Date('2024-01-10'),
    participants: [
      { id: 'user1', name: 'John Doe', email: 'john@example.com' },
      { id: 'user2', name: 'Jane Smith', email: 'jane@example.com' },
    ],
    items: [
      { id: 'item8', name: 'Popcorn', price: 6.99, quantity: 2, selectedBy: ['user1', 'user2'] },
      { id: 'item9', name: 'Soda Pack', price: 8.99, quantity: 1, selectedBy: ['user1', 'user2'] },
    ],
    bankDetails: {
      bankName: 'Wells Fargo',
      accountName: 'Jane Smith',
      accountNumber: '1122334455'
    },
    status: 'closed',
    total: 15.98,
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const [bills] = useState<Bill[]>(mockBills);

  const handleCreateBill = () => {
    router.push('/(tabs)/create');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.titleSection}>
            <Text style={styles.title}>Bills</Text>
            <Text style={styles.subtitle}>Split expenses with friends</Text>
          </View>
          <TouchableOpacity style={styles.createButton} onPress={handleCreateBill}>
            <Plus size={18} color="#FFFFFF" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {bills.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Zap size={32} color="#3B82F6" strokeWidth={2} />
            </View>
            <Text style={styles.emptyTitle}>No bills yet</Text>
            <Text style={styles.emptyDescription}>
              Create your first bill to start splitting expenses with friends
            </Text>
            <TouchableOpacity style={styles.emptyButton} onPress={handleCreateBill}>
              <Plus size={16} color="#3B82F6" strokeWidth={2.5} />
              <Text style={styles.emptyButtonText}>Create Bill</Text>
            </TouchableOpacity>
          </View>
        ) : (
          bills.map((bill) => (
            <BillCard key={bill.id} bill={bill} />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleSection: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: '#64748B',
    fontWeight: '500',
  },
  createButton: {
    backgroundColor: '#3B82F6',
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  scrollView: {
    flex: 1,
    paddingTop: 8,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 80,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#F8FAFC',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  emptyDescription: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
    fontWeight: '500',
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E293B',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 8,
  },
  emptyButtonText: {
    color: '#3B82F6',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
});