import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Users, Calendar, DollarSign, Check, Clock, User, Share2, MessageCircle, Bell, SquarePen, Trash2 } from 'lucide-react-native';
import { mockBills } from '../mockBills';
import { calculateUserCosts, formatCurrency } from '@/utils/billUtils';
import ItemCard from '@/components/ItemCard';
import { useAuth } from '@/contexts/AuthContext';
import { useChat } from '@/contexts/ChatContext';

const currentUserId = 'user1'; // This should come from auth context

export default function BillDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { getUnreadCount } = useChat();
  
  const bill = mockBills.find(b => b.id === id);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const unreadCount = getUnreadCount(id || '');

  // Mock data for testing different states
  const mockSubmittedSelections = bill?.testSubmittedSelections || [];
  const mockPaymentStatus = bill?.testPaymentStatus || {};

  const isHost = bill?.createdBy === currentUserId;
  const isParticipant = bill?.participants.some(p => p.id === currentUserId);
  const userCosts = bill ? calculateUserCosts(bill) : [];
  const currentUserCost = userCosts.find(uc => uc.userId === currentUserId);

  // Check if all members have submitted their selections
  const allMembersSubmitted = useMemo(() => {
    if (!bill) return false;
    return bill.participants.every(p => mockSubmittedSelections.includes(p.id));
  }, [bill, mockSubmittedSelections]);

  // Initialize selected items based on bill data
  React.useEffect(() => {
    if (bill && !hasSubmitted) {
      const userSelectedItems = bill.items
        .filter(item => item.selectedBy.includes(currentUserId))
        .map(item => item.id);
      setSelectedItems(userSelectedItems);
    }
  }, [bill, hasSubmitted]);

  if (!bill) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Bill not found</Text>
      </SafeAreaView>
    );
  }

  const toggleItemSelection = (itemId: string) => {
    if (hasSubmitted && bill.status === 'pay') return; // Can't change after submission in pay status
    
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const submitSelections = () => {
    if (selectedItems.length === 0) {
      Alert.alert('No Items Selected', 'Please select at least one item before submitting.');
      return;
    }

    Alert.alert(
      'Submit Selections',
      'Are you sure you want to submit your item selections? You can still edit them until the host finalizes the bill.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          onPress: () => {
            setHasSubmitted(true);
            Alert.alert('Success', 'Your selections have been submitted!');
          }
        }
      ]
    );
  };

  const finalizeBill = () => {
    if (!allMembersSubmitted) {
      Alert.alert(
        'Cannot Finalize',
        'Not all members have submitted their selections yet. Please wait for all participants to make their choices.'
      );
      return;
    }

    Alert.alert(
      'Finalize Bill',
      'This will lock all selections and move the bill to payment phase. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Finalize',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Bill Finalized', 'The bill has been finalized and participants can now make payments.');
          }
        }
      ]
    );
  };

  const editBill = () => {
    Alert.alert(
      'Edit Bill',
      'Editing the bill will reset all member selections and submissions. All participants will need to reselect their items. Do you want to continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          style: 'destructive',
          onPress: () => {
            // Reset all selections and submissions
            resetBillSelections();
            
            // Navigate to edit screen (placeholder for now)
            Alert.alert(
              'Bill Reset Complete',
              'All member selections have been cleared. You can now edit the bill details. All participants will be notified to reselect their items.',
              [
                {
                  text: 'OK',
                  onPress: () => {
                    // In a real app, this would navigate to edit screen
                    // router.push(`/bill/${bill.id}/edit`);
                    Alert.alert('Coming Soon', 'Bill editing functionality will be available soon.');
                  }
                }
              ]
            );
          }
        }
      ]
    );
  };

  const resetBillSelections = () => {
    // Clear all item selections for all participants
    if (bill) {
      bill.items.forEach(item => {
        item.selectedBy = [];
      });
    }
    
    // Reset current user's local state
    setSelectedItems([]);
    setHasSubmitted(false);
    
    // In a real app, this would:
    // 1. Send API request to clear all selections in database
    // 2. Send notifications to all participants about the reset
    // 3. Update bill status if needed
    // 4. Clear any cached submission data
    
    console.log('Bill selections reset for bill:', bill?.id);
    console.log('All participants will need to reselect items');
  };

  const deleteBill = () => {
    Alert.alert(
      'Delete Bill',
      'Are you sure you want to delete this bill? This action cannot be undone and will remove the bill for all participants.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Bill Deleted', 'The bill has been deleted successfully.', [
              {
                text: 'OK',
                onPress: () => router.back()
              }
            ]);
          }
        }
      ]
    );
  };

  const getParticipantStatus = (participantId: string) => {
    if (bill.status === 'select') {
      return mockSubmittedSelections.includes(participantId) ? 'submitted' : 'pending';
    } else if (bill.status === 'pay') {
      return mockPaymentStatus[participantId] || 'unpaid';
    }
    return 'completed';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return '#10B981';
      case 'verified': return '#10B981';
      case 'paid': return '#3B82F6';
      case 'unpaid': return '#F59E0B';
      case 'pending': return '#64748B';
      default: return '#64748B';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'submitted': return Check;
      case 'verified': return Check;
      case 'paid': return Check;
      case 'unpaid': return Clock;
      case 'pending': return Clock;
      default: return Clock;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'submitted': return 'Submitted';
      case 'verified': return 'Verified';
      case 'paid': return 'Paid';
      case 'unpaid': return 'Unpaid';
      case 'pending': return 'Pending';
      default: return 'Unknown';
    }
  };

  const openChat = () => {
    router.push(`/bill/${bill.id}/chat`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={20} color="#F8FAFC" strokeWidth={2} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>{bill.title}</Text>
          <Text style={styles.subtitle}>
            {bill.status === 'select' ? 'Select Items' : 
             bill.status === 'pay' ? 'Payment Phase' : 'Completed'}
          </Text>
        </View>
        
        {/* Host Actions */}
        {isHost && bill.status === 'select' && (
          <View style={styles.hostActions}>
            <TouchableOpacity style={styles.editButton} onPress={editBill}>
              <SquarePen size={16} color="#3B82F6" strokeWidth={2} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteButton} onPress={deleteBill}>
              <Trash2 size={16} color="#EF4444" strokeWidth={2} />
            </TouchableOpacity>
          </View>
        )}
        
        {/* Chat Button */}
        <TouchableOpacity style={styles.chatButton} onPress={openChat}>
          <MessageCircle size={18} color="#3B82F6" strokeWidth={2} />
          {unreadCount > 0 && (
            <View style={styles.chatBadge}>
              <Text style={styles.chatBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Bill Info */}
        <View style={styles.section}>
          <View style={styles.billInfo}>
            <View style={styles.infoRow}>
              <Users size={16} color="#64748B" strokeWidth={2} />
              <Text style={styles.infoText}>{bill.participants.length} participants</Text>
            </View>
            
            <View style={styles.infoRow}>
              <DollarSign size={16} color="#10B981" strokeWidth={2} />
              <Text style={styles.infoText}>{formatCurrency(bill.totalAmount)}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Calendar size={16} color="#64748B" strokeWidth={2} />
              <Text style={styles.infoText}>
                {bill.dueDate 
                  ? `Due ${new Date(bill.dueDate).toLocaleDateString()}`
                  : `Created ${new Date(bill.createdAt).toLocaleDateString()}`
                }
              </Text>
            </View>
          </View>

          {bill.description && (
            <Text style={styles.description}>{bill.description}</Text>
          )}
        </View>

        {/* Reset Warning - Show when host has made changes */}
        {isHost && bill.status === 'select' && (
          <View style={styles.section}>
            <View style={styles.warningCard}>
              <View style={styles.warningHeader}>
                <Bell size={16} color="#F59E0B" strokeWidth={2} />
                <Text style={styles.warningTitle}>Edit Bill Impact</Text>
              </View>
              <Text style={styles.warningText}>
                Editing bill details will reset all member selections and submissions. 
                All participants will need to reselect their items after you make changes.
              </Text>
            </View>
          </View>
        )}

        {/* Items Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Items</Text>
          {bill.items.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              isSelected={selectedItems.includes(item.id)}
              onToggle={() => toggleItemSelection(item.id)}
              participantCount={item.selectedBy.length}
            />
          ))}
        </View>

        {/* Your Cost - Only show in pay/closed status when shares are finalized */}
        {currentUserCost && bill.status !== 'select' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Share</Text>
            <View style={styles.costCard}>
              <View style={styles.costHeader}>
                <Text style={styles.costAmount}>{formatCurrency(currentUserCost.total)}</Text>
                <Text style={styles.costLabel}>Total Amount</Text>
              </View>
              
              <View style={styles.costItems}>
                {currentUserCost.items.map((item) => (
                  <View key={item.id} style={styles.costItem}>
                    <Text style={styles.costItemName}>{item.name}</Text>
                    <Text style={styles.costItemPrice}>{formatCurrency(item.price)}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Participants */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Participants</Text>
          {bill.participants.map((participant) => {
            const participantCost = userCosts.find(uc => uc.userId === participant.id);
            const status = getParticipantStatus(participant.id);
            const StatusIcon = getStatusIcon(status);
            
            return (
              <View key={participant.id} style={styles.participantCard}>
                <View style={styles.participantLeft}>
                  {participant.id === bill.createdBy && (
                    <View style={styles.hostBadge}>
                      <Text style={styles.hostBadgeText}>HOST</Text>
                    </View>
                  )}
                  <View style={styles.participantInfo}>
                    <Text style={styles.participantName}>{participant.name}</Text>
                    <Text style={styles.participantEmail}>{participant.email}</Text>
                  </View>
                </View>
                
                <View style={styles.participantRight}>
                  {/* Only show amounts when bill is not in select status */}
                  {bill.status !== 'select' && (
                    <Text style={styles.participantAmount}>
                      {participantCost ? formatCurrency(participantCost.total) : '$0.00'}
                    </Text>
                  )}
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(status) }]}>
                    <StatusIcon size={12} color="#FFFFFF" strokeWidth={2} />
                    <Text style={styles.statusText}>{getStatusText(status)}</Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        {/* Bank Details */}
        {bill.status === 'pay' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Details</Text>
            <View style={styles.bankCard}>
              <Text style={styles.bankTitle}>Send payment to:</Text>
              <Text style={styles.bankName}>{bill.bankDetails.bankName}</Text>
              <Text style={styles.accountName}>{bill.bankDetails.accountName}</Text>
              <Text style={styles.accountNumber}>Account: {bill.bankDetails.accountNumber}</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Action Buttons */}
      {isParticipant && bill.status === 'select' && (
        <View style={styles.footer}>
          <TouchableOpacity 
            style={[
              styles.submitButton,
              selectedItems.length === 0 && styles.disabledButton
            ]}
            onPress={submitSelections}
            disabled={selectedItems.length === 0}
          >
            <Check size={18} color="#FFFFFF" strokeWidth={2} />
            <Text style={styles.submitButtonText}>
              {hasSubmitted ? 'Update Selections' : 'Submit Selections'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Host Finalize Button */}
      {isHost && bill.status === 'select' && (
        <View style={styles.footer}>
          <TouchableOpacity 
            style={[
              styles.finalizeButton,
              !allMembersSubmitted && styles.disabledButton
            ]}
            onPress={finalizeBill}
            disabled={!allMembersSubmitted}
          >
            <Share2 size={18} color="#FFFFFF" strokeWidth={2} />
            <Text style={styles.finalizeButtonText}>
              {allMembersSubmitted ? 'Finalize Bill' : 'Waiting for Submissions'}
            </Text>
          </TouchableOpacity>
          
          {!allMembersSubmitted && (
            <Text style={styles.waitingText}>
              Waiting for all members to submit their selections
            </Text>
          )}
        </View>
      )}
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
  },
  subtitle: {
    fontSize: 15,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 2,
  },
  hostActions: {
    flexDirection: 'row',
    gap: 8,
    marginRight: 12,
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  chatButton: {
    position: 'relative',
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  chatBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#0F172A',
  },
  chatBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
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
  billInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    fontSize: 14,
    color: '#CBD5E1',
    fontWeight: '500',
  },
  description: {
    fontSize: 16,
    color: '#94A3B8',
    lineHeight: 24,
    fontWeight: '500',
  },
  warningCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400E',
    letterSpacing: -0.2,
  },
  warningText: {
    fontSize: 14,
    color: '#92400E',
    lineHeight: 20,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F8FAFC',
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  costCard: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  costHeader: {
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  costAmount: {
    fontSize: 28,
    fontWeight: '700',
    color: '#10B981',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  costLabel: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
  },
  costItems: {
    gap: 12,
  },
  costItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  costItemName: {
    fontSize: 16,
    color: '#F8FAFC',
    fontWeight: '500',
    flex: 1,
  },
  costItemPrice: {
    fontSize: 16,
    color: '#10B981',
    fontWeight: '600',
  },
  participantCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  participantLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  hostBadge: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 12,
  },
  hostBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  participantInfo: {
    flex: 1,
  },
  participantName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F8FAFC',
    marginBottom: 2,
    letterSpacing: -0.2,
  },
  participantEmail: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '500',
  },
  participantRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  participantAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#10B981',
    letterSpacing: -0.2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bankCard: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  bankTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#CBD5E1',
    marginBottom: 12,
  },
  bankName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  accountName: {
    fontSize: 16,
    color: '#94A3B8',
    fontWeight: '500',
    marginBottom: 4,
  },
  accountNumber: {
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: '600',
    letterSpacing: 1,
  },
  footer: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  submitButton: {
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#3B82F6',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  finalizeButton: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#10B981',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  disabledButton: {
    backgroundColor: '#475569',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  finalizeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  waitingText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 12,
    fontWeight: '500',
    fontStyle: 'italic',
  },
  errorText: {
    fontSize: 18,
    color: '#EF4444',
    textAlign: 'center',
    marginTop: 50,
  },
});