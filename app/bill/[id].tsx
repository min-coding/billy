import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Users, Calendar, DollarSign, Check, X, CreditCard as Edit3, Trash2, Plus, CreditCard, Building2, CircleCheck as CheckCircle, Clock, CircleAlert as AlertCircle } from 'lucide-react-native';
import { Bill, BillItem, User, UserCost } from '@/types';
import { formatCurrency, calculateUserCosts } from '@/utils/billUtils';

// Mock data - in real app, this would come from API/database
const mockBill: Bill = {
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
};

const currentUserId = 'user1'; // Mock current user ID

export default function BillDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [bill, setBill] = useState<Bill>(mockBill);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [userCosts, setUserCosts] = useState<UserCost[]>([]);
  const [paymentVerifications, setPaymentVerifications] = useState<{[userId: string]: boolean}>({});

  const isHost = bill.createdBy === currentUserId;
  const currentUser = bill.participants.find(p => p.id === currentUserId);

  useEffect(() => {
    // Initialize selected items for current user
    const userSelectedItems = bill.items
      .filter(item => item.selectedBy.includes(currentUserId))
      .map(item => item.id);
    setSelectedItems(userSelectedItems);

    // Calculate user costs
    setUserCosts(calculateUserCosts(bill));
  }, [bill]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'select': return '#F59E0B';
      case 'pay': return '#3B82F6';
      case 'closed': return '#10B981';
      default: return '#64748B';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'select': return Clock;
      case 'pay': return CreditCard;
      case 'closed': return CheckCircle;
      default: return AlertCircle;
    }
  };

  const toggleItemSelection = (itemId: string) => {
    if (bill.status !== 'select') return;
    
    setSelectedItems(prev => {
      const newSelection = prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId];
      
      // Update bill items
      const updatedItems = bill.items.map(item => {
        if (item.id === itemId) {
          const updatedSelectedBy = newSelection.includes(itemId)
            ? [...item.selectedBy.filter(id => id !== currentUserId), currentUserId]
            : item.selectedBy.filter(id => id !== currentUserId);
          return { ...item, selectedBy: updatedSelectedBy };
        }
        return item;
      });

      setBill(prev => ({ ...prev, items: updatedItems }));
      return newSelection;
    });
  };

  const submitSelections = () => {
    Alert.alert(
      'Submit Selections',
      'Are you sure you want to submit your item selections? You won\'t be able to change them later.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Submit', 
          onPress: () => {
            Alert.alert('Success', 'Your selections have been submitted!');
          }
        }
      ]
    );
  };

  const finalizeBill = () => {
    Alert.alert(
      'Finalize Bill',
      'This will calculate everyone\'s share and move the bill to payment stage. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Finalize', 
          onPress: () => {
            setBill(prev => ({ ...prev, status: 'pay' }));
            Alert.alert('Success', 'Bill has been finalized! Members can now see their payment amounts.');
          }
        }
      ]
    );
  };

  const verifyPayment = (userId: string) => {
    setPaymentVerifications(prev => ({ ...prev, [userId]: true }));
    
    // Check if all payments are verified
    const allVerified = bill.participants.every(p => 
      p.id === currentUserId || paymentVerifications[p.id] || p.id === userId
    );
    
    if (allVerified) {
      Alert.alert(
        'All Payments Verified',
        'All members have paid. Close this bill?',
        [
          { text: 'Not Yet', style: 'cancel' },
          { 
            text: 'Close Bill', 
            onPress: () => {
              setBill(prev => ({ ...prev, status: 'closed' }));
              Alert.alert('Success', 'Bill has been closed!');
            }
          }
        ]
      );
    } else {
      Alert.alert('Success', 'Payment verified!');
    }
  };

  const deleteBill = () => {
    Alert.alert(
      'Delete Bill',
      'Are you sure you want to delete this bill? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            router.back();
            Alert.alert('Success', 'Bill has been deleted.');
          }
        }
      ]
    );
  };

  const renderSelectStatus = () => (
    <>
      {/* Items Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select Your Items</Text>
        <Text style={styles.sectionSubtitle}>
          Choose which items you want to split the cost for
        </Text>
        
        {bill.items.map((item) => {
          const isSelected = selectedItems.includes(item.id);
          const itemTotal = item.price * item.quantity;
          const splitCount = item.selectedBy.length;
          const splitAmount = splitCount > 0 ? itemTotal / splitCount : itemTotal;
          
          return (
            <TouchableOpacity
              key={item.id}
              style={[styles.itemCard, isSelected && styles.selectedItemCard]}
              onPress={() => toggleItemSelection(item.id)}
              activeOpacity={0.8}
            >
              <View style={styles.itemContent}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemPrice}>
                    {formatCurrency(item.price)} × {item.quantity} = {formatCurrency(itemTotal)}
                  </Text>
                  {splitCount > 1 && (
                    <Text style={styles.splitInfo}>
                      Split {splitCount} ways: {formatCurrency(splitAmount)} each
                    </Text>
                  )}
                  {item.selectedBy.length > 0 && (
                    <Text style={styles.selectedByInfo}>
                      Selected by: {item.selectedBy.map(id => 
                        bill.participants.find(p => p.id === id)?.name || 'Unknown'
                      ).join(', ')}
                    </Text>
                  )}
                </View>
                
                <View style={[styles.checkbox, isSelected && styles.checkedBox]}>
                  {isSelected && <Check size={14} color="#FFFFFF" strokeWidth={2.5} />}
                </View>
              </View>
            </TouchableOpacity>
          );
        })}

        {/* Submit Button */}
        <TouchableOpacity 
          style={[styles.submitButton, selectedItems.length === 0 && styles.disabledButton]}
          onPress={submitSelections}
          disabled={selectedItems.length === 0}
        >
          <Check size={18} color="#FFFFFF" strokeWidth={2} />
          <Text style={styles.submitButtonText}>Submit My Selections</Text>
        </TouchableOpacity>
      </View>

      {/* Host Actions */}
      {isHost && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Host Actions</Text>
          
          <View style={styles.hostActions}>
            <TouchableOpacity style={styles.hostActionButton} onPress={() => setIsEditing(true)}>
              <Edit3 size={16} color="#3B82F6" strokeWidth={2} />
              <Text style={styles.hostActionText}>Edit Bill</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.hostActionButton} onPress={finalizeBill}>
              <CheckCircle size={16} color="#10B981" strokeWidth={2} />
              <Text style={[styles.hostActionText, { color: '#10B981' }]}>Finalize Bill</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.hostActionButton} onPress={deleteBill}>
              <Trash2 size={16} color="#EF4444" strokeWidth={2} />
              <Text style={[styles.hostActionText, { color: '#EF4444' }]}>Delete Bill</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </>
  );

  const renderPayStatus = () => (
    <>
      {/* Payment Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment Summary</Text>
        
        {userCosts.map((userCost) => {
          const isCurrentUser = userCost.userId === currentUserId;
          const isVerified = paymentVerifications[userCost.userId];
          
          return (
            <View key={userCost.userId} style={styles.paymentCard}>
              <View style={styles.paymentHeader}>
                <Text style={styles.paymentUserName}>
                  {isCurrentUser ? 'You' : userCost.userName}
                </Text>
                <View style={styles.paymentAmount}>
                  <Text style={styles.paymentTotal}>{formatCurrency(userCost.total)}</Text>
                  {isHost && !isCurrentUser && (
                    <TouchableOpacity
                      style={[styles.verifyButton, isVerified && styles.verifiedButton]}
                      onPress={() => verifyPayment(userCost.userId)}
                      disabled={isVerified}
                    >
                      <Check size={14} color={isVerified ? "#10B981" : "#FFFFFF"} strokeWidth={2} />
                      <Text style={[styles.verifyButtonText, isVerified && styles.verifiedButtonText]}>
                        {isVerified ? 'Verified' : 'Verify'}
                      </Text>
                    </TouchableOpacity>
                  )}
                  {isVerified && !isHost && (
                    <View style={styles.verifiedBadge}>
                      <Check size={12} color="#10B981" strokeWidth={2} />
                      <Text style={styles.verifiedBadgeText}>Verified</Text>
                    </View>
                  )}
                </View>
              </View>
              
              <View style={styles.paymentItems}>
                {userCost.items.map((item) => (
                  <Text key={item.id} style={styles.paymentItemText}>
                    • {item.name}: {formatCurrency(item.price)}
                  </Text>
                ))}
              </View>
            </View>
          );
        })}
      </View>

      {/* Bank Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment Details</Text>
        <Text style={styles.sectionSubtitle}>Send your payment to:</Text>
        
        <View style={styles.bankDetailsCard}>
          <View style={styles.bankDetailRow}>
            <Building2 size={16} color="#64748B" strokeWidth={2} />
            <Text style={styles.bankDetailLabel}>Bank:</Text>
            <Text style={styles.bankDetailValue}>{bill.bankDetails.bankName}</Text>
          </View>
          
          <View style={styles.bankDetailRow}>
            <Users size={16} color="#64748B" strokeWidth={2} />
            <Text style={styles.bankDetailLabel}>Account Name:</Text>
            <Text style={styles.bankDetailValue}>{bill.bankDetails.accountName}</Text>
          </View>
          
          <View style={styles.bankDetailRow}>
            <CreditCard size={16} color="#64748B" strokeWidth={2} />
            <Text style={styles.bankDetailLabel}>Account Number:</Text>
            <Text style={styles.bankDetailValue}>{bill.bankDetails.accountNumber}</Text>
          </View>
        </View>
      </View>
    </>
  );

  const renderClosedStatus = () => (
    <View style={styles.section}>
      <View style={styles.closedHeader}>
        <CheckCircle size={32} color="#10B981" strokeWidth={2} />
        <Text style={styles.closedTitle}>Bill Completed</Text>
        <Text style={styles.closedSubtitle}>All payments have been verified and the bill is now closed.</Text>
      </View>
      
      {/* Final Summary */}
      <Text style={styles.sectionTitle}>Final Summary</Text>
      
      {userCosts.map((userCost) => (
        <View key={userCost.userId} style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryUserName}>
              {userCost.userId === currentUserId ? 'You' : userCost.userName}
            </Text>
            <Text style={styles.summaryTotal}>{formatCurrency(userCost.total)}</Text>
          </View>
          
          <View style={styles.summaryItems}>
            {userCost.items.map((item) => (
              <Text key={item.id} style={styles.summaryItemText}>
                • {item.name}: {formatCurrency(item.price)}
              </Text>
            ))}
          </View>
        </View>
      ))}
    </View>
  );

  const StatusIcon = getStatusIcon(bill.status);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={20} color="#F8FAFC" strokeWidth={2} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>{bill.title}</Text>
          <View style={styles.statusContainer}>
            <StatusIcon size={14} color={getStatusColor(bill.status)} strokeWidth={2} />
            <Text style={[styles.statusText, { color: getStatusColor(bill.status) }]}>
              {bill.status.charAt(0).toUpperCase() + bill.status.slice(1)}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Bill Info */}
        <View style={styles.section}>
          <View style={styles.billInfo}>
            {bill.description && (
              <Text style={styles.description}>{bill.description}</Text>
            )}
            
            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <DollarSign size={16} color="#10B981" strokeWidth={2} />
                <Text style={styles.infoLabel}>Total Amount</Text>
                <Text style={styles.infoValue}>{formatCurrency(bill.totalAmount)}</Text>
              </View>
              
              <View style={styles.infoItem}>
                <Users size={16} color="#3B82F6" strokeWidth={2} />
                <Text style={styles.infoLabel}>Members</Text>
                <Text style={styles.infoValue}>{bill.participants.length}</Text>
              </View>
              
              <View style={styles.infoItem}>
                <Calendar size={16} color="#64748B" strokeWidth={2} />
                <Text style={styles.infoLabel}>Created</Text>
                <Text style={styles.infoValue}>
                  {new Date(bill.createdAt).toLocaleDateString()}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Status-specific content */}
        {bill.status === 'select' && renderSelectStatus()}
        {bill.status === 'pay' && renderPayStatus()}
        {bill.status === 'closed' && renderClosedStatus()}
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#0F172A',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#F8FAFC',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: '#1E293B',
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#334155',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F8FAFC',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 20,
    fontWeight: '500',
  },
  billInfo: {
    gap: 16,
  },
  description: {
    fontSize: 16,
    color: '#CBD5E1',
    lineHeight: 22,
    fontWeight: '500',
  },
  infoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  infoItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#0F172A',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  infoLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
  },
  infoValue: {
    fontSize: 16,
    color: '#F8FAFC',
    fontWeight: '700',
    textAlign: 'center',
  },
  itemCard: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  selectedItemCard: {
    borderColor: '#3B82F6',
    backgroundColor: '#1E293B',
  },
  itemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F8FAFC',
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  itemPrice: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '500',
    marginBottom: 4,
  },
  splitInfo: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '500',
    marginBottom: 4,
  },
  selectedByInfo: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#475569',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
  },
  checkedBox: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  submitButton: {
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
  },
  disabledButton: {
    backgroundColor: '#475569',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  hostActions: {
    gap: 12,
  },
  hostActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 12,
  },
  hostActionText: {
    color: '#3B82F6',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  paymentCard: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  paymentUserName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F8FAFC',
    letterSpacing: -0.2,
  },
  paymentAmount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  paymentTotal: {
    fontSize: 18,
    fontWeight: '700',
    color: '#10B981',
    letterSpacing: -0.3,
  },
  verifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  verifiedButton: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#10B981',
  },
  verifyButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  verifiedButtonText: {
    color: '#10B981',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#10B981',
    gap: 4,
  },
  verifiedBadgeText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '600',
  },
  paymentItems: {
    gap: 4,
  },
  paymentItemText: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '500',
  },
  bankDetailsCard: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 12,
  },
  bankDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bankDetailLabel: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
    minWidth: 100,
  },
  bankDetailValue: {
    fontSize: 14,
    color: '#F8FAFC',
    fontWeight: '600',
    flex: 1,
  },
  closedHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  closedTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#10B981',
    marginTop: 12,
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  closedSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    fontWeight: '500',
  },
  summaryCard: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryUserName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F8FAFC',
    letterSpacing: -0.2,
  },
  summaryTotal: {
    fontSize: 18,
    fontWeight: '700',
    color: '#10B981',
    letterSpacing: -0.3,
  },
  summaryItems: {
    gap: 4,
  },
  summaryItemText: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '500',
  },
});