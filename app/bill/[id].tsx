import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, Image, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Users, Calendar, DollarSign, Check, X, EllipsisVertical, UserPen, Trash2, CreditCard, Building2, CircleCheck as CheckCircle, Clock, CircleAlert as AlertCircle, Camera, MessageCircle } from 'lucide-react-native';
import { Bill, BillItem, User, UserCost } from '@/types';
import { formatCurrency, calculateUserCosts } from '@/utils/billUtils';
import { mockBills } from '../mockBills';

const currentUserId = 'user1'; // Mock current user ID

// Mock submitted selections - in real app, this would come from API
const mockSubmittedSelections = ['user2']; // Only user2 has submitted, user1 and others haven't

// Mock user avatars - in real app, these would come from user profiles
const userAvatars: {[key: string]: string} = {
  'user1': 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
  'user2': 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
  'user3': 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
  'user4': 'https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
};

// Add support for initial submitted selections and payment status from bill mock data
// Extend Bill type for test cases (in real app, use a separate test config)
type BillWithTest = Bill & {
  testSubmittedSelections?: string[];
  testPaymentStatus?: { [userId: string]: 'unpaid' | 'paid' | 'verified' };
};

export default function BillDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const foundBill = mockBills.find(b => b.id === id) as BillWithTest | undefined;
  const [bill, setBill] = useState<Bill>(foundBill!);
  const [selectedItems, setSelectedItems] = useState<string[]>(() => {
    if (foundBill) {
      return foundBill.items.filter(item => item.selectedBy.includes(currentUserId)).map(item => item.id);
    }
    return [];
  });
  const [userCosts, setUserCosts] = useState<UserCost[]>([]);
  const [paymentVerifications, setPaymentVerifications] = useState<{[userId: string]: boolean}>({});
  const [showHostMenu, setShowHostMenu] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [submittedSelections, setSubmittedSelections] = useState<string[]>(
    foundBill?.testSubmittedSelections || []
  );
  const [paymentStatus, setPaymentStatus] = useState<{[userId: string]: 'unpaid' | 'paid' | 'verified'}>(
    foundBill?.testPaymentStatus || (() => {
      const initialStatus: {[userId: string]: 'unpaid' | 'paid' | 'verified'} = {};
      foundBill?.participants.forEach(participant => {
        initialStatus[participant.id] = 'unpaid';
      });
      return initialStatus;
    })()
  );
  const [showItemDetails, setShowItemDetails] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  const isHost = bill?.createdBy === currentUserId;
  const currentUser = bill?.participants.find(p => p.id === currentUserId);

  // Check if current user has submitted their selections
  const hasCurrentUserSubmitted = submittedSelections.includes(currentUserId);

  // Check if all members have submitted their selections
  const allMembersSubmitted = bill?.participants.every(p => submittedSelections.includes(p.id));
  const canFinalizeBill = isHost && allMembersSubmitted && bill?.status === 'select';

  // Get submitted and pending users
  const submittedUsers = bill?.participants.filter(p => submittedSelections.includes(p.id));
  const pendingUsers = bill?.participants.filter(p => !submittedSelections.includes(p.id));

  useEffect(() => {
    // Calculate user costs
    setUserCosts(calculateUserCosts(bill));

    // Initialize payment verifications
    const initialVerifications: {[userId: string]: boolean} = {};
    bill?.participants.forEach(participant => {
      initialVerifications[participant.id] = false;
    });
    setPaymentVerifications(initialVerifications);
  }, [bill, submittedSelections]);

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
    if (bill?.status !== 'select') {
      Alert.alert('Selection Locked', 'Item selections cannot be changed after the bill has been finalized.');
      return;
    }
    
    setSelectedItems(prev => {
      const newSelection = prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId];
      
      // Update bill items
      const updatedItems = bill?.items.map(item => {
        if (item.id === itemId) {
          const updatedSelectedBy = newSelection.includes(itemId)
            ? [...item.selectedBy.filter(id => id !== currentUserId), currentUserId]
            : item.selectedBy.filter(id => id !== currentUserId);
          return { ...item, selectedBy: updatedSelectedBy };
        }
        return item;
      });

      setBill(prev => prev ? { ...prev, items: updatedItems } : prev);
      return newSelection;
    });
  };

  const submitSelections = () => {
    if (selectedItems.length === 0) {
      Alert.alert('No Items Selected', 'Please select at least one item before submitting.');
      return;
    }

    const isUpdate = hasCurrentUserSubmitted;
    const message = isUpdate 
      ? 'Your selections have been updated!' 
      : 'Your selections have been submitted!';
    
    Alert.alert('Success', message);
    
    // Add current user to submitted list if not already there
    if (!hasCurrentUserSubmitted) {
      setSubmittedSelections(prev => [...prev, currentUserId]);
    }
  };

  const finalizeBill = () => {
    if (!allMembersSubmitted) {
      Alert.alert('Cannot Finalize', 'Please wait for all members to submit their selections before finalizing the bill.');
      return;
    }

    Alert.alert(
      'Finalize Bill',
      'This will calculate everyone\'s share and move the bill to payment stage. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Finalize', 
          onPress: () => {
            setBill(prev => prev ? { ...prev, status: 'pay' } : prev);
            setShowHostMenu(false);
            Alert.alert('Success', 'Bill has been finalized! Members can now see their payment amounts.');
          }
        }
      ]
    );
  };

  const editBill = () => {
    setShowHostMenu(false);
    // Navigate to edit screen or show edit modal
    Alert.alert('Edit Bill', 'Edit functionality would be implemented here');
  };

  const deleteBill = () => {
    setShowHostMenu(false);
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

  // Handler for member to mark/unmark as paid
  const togglePaid = (userId: string) => {
    setPaymentStatus(prev => ({
      ...prev,
      [userId]: prev[userId] === 'paid' ? 'unpaid' : 'paid',
    }));
  };

  // Handler for host to verify payment
  const verifyPayment = (userId: string) => {
    setPaymentStatus(prev => ({
      ...prev,
      [userId]: 'verified',
    }));
  };

  const openPaymentChat = () => {
    // Simulate opening a chat application
    const message = `Hi! I've paid my share for "${bill?.title}". Please verify my payment. Thanks!`;
    const phoneNumber = ''; // In real app, this would be the host's phone number
    
    // For web, we'll just show an alert. On mobile, this would open SMS or WhatsApp
    if (phoneNumber) {
      const url = `sms:${phoneNumber}?body=${encodeURIComponent(message)}`;
      Linking.openURL(url).catch(() => {
        Alert.alert('Chat Unavailable', 'Please contact the host directly to verify your payment.');
      });
    } else {
      Alert.alert(
        'Payment Verification',
        'Please contact the host to verify your payment:\n\n' + message,
        [
          { text: 'Copy Message', onPress: () => {
            // In real app, copy to clipboard
            Alert.alert('Message Copied', 'Message copied to clipboard');
          }},
          { text: 'OK' }
        ]
      );
    }
  };

  const showItemParticipants = (item: BillItem) => {
    const participantNames = item.selectedBy
      .map(userId => bill?.participants.find(p => p.id === userId)?.name || 'Unknown')
      .join(', ');
    
    Alert.alert(
      `${item.name}`,
      `Selected by: ${participantNames || 'No one'}`,
      [{ text: 'OK' }]
    );
  };

  const renderSelectStatus = () => {
    const hasCurrentUserSubmitted = submittedSelections.includes(currentUserId);
    const allMembersSubmitted = bill.participants.every(p => submittedSelections.includes(p.id));
    return (
      <>
        {/* Items Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Your Items</Text>
          <Text style={styles.sectionSubtitle}>
            Choose which items you want to split the cost for. You can change your selections until the host finalizes the bill.
          </Text>
          
          {bill?.items.map((item) => {
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
                          bill?.participants.find(p => p.id === id)?.name || 'Unknown'
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

          {/* Action Buttons Container */}
          <View style={styles.actionButtonsContainer}>
            {/* Submit/Update Button - Always show for current user */}
            <TouchableOpacity 
              style={[styles.submitButton, selectedItems.length === 0 && styles.disabledButton]}
              onPress={submitSelections}
              disabled={selectedItems.length === 0}
            >
              <Check size={18} color="#FFFFFF" strokeWidth={2} />
              <Text style={styles.submitButtonText}>
                {hasCurrentUserSubmitted ? 'Update Your Selections' : 'Submit Your Selections'}
              </Text>
            </TouchableOpacity>

            {/* Status indicator for current user */}
            {hasCurrentUserSubmitted && (
              <View style={styles.submissionStatusContainer}>
                <Check size={16} color="#10B981" strokeWidth={2} />
                <Text style={styles.submissionStatusText}>
                  You have submitted your selections. You can still make changes until the host finalizes the bill.
                </Text>
              </View>
            )}

            {/* Finalize Button - Only show for host */}
            {isHost && (
              <TouchableOpacity 
                style={[styles.finalizeButton, !allMembersSubmitted && styles.disabledFinalizeButton]}
                onPress={finalizeBill}
                disabled={!allMembersSubmitted}
              >
                <CheckCircle size={18} color="#FFFFFF" strokeWidth={2} />
                <Text style={styles.finalizeButtonText}>Finalize Bill</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Selection Progress */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Selection Progress</Text>
          
          <TouchableOpacity 
            style={styles.progressContainer}
            onPress={() => setShowMembersModal(true)}
            activeOpacity={0.8}
          >
            <View style={styles.progressHeader}>
              <Text style={styles.progressTitle}>
                {submittedUsers?.length} of {bill?.participants?.length} submitted
              </Text>
              <Text style={styles.progressSubtitle}>Tap to view details</Text>
            </View>
            
            <View style={styles.avatarSection}>
              {/* Submitted Avatars */}
              {submittedUsers?.length > 0 && (
                <View style={styles.avatarGroup}>
                  <Text style={styles.avatarGroupLabel}>Submitted</Text>
                  <View style={styles.avatarStack}>
                    {submittedUsers.slice(0, 4).map((user, index) => (
                      <View key={user.id} style={[styles.avatarContainer, { marginLeft: index > 0 ? -8 : 0 }]}>
                        <Image 
                          source={{ uri: userAvatars[user.id] }} 
                          style={styles.avatar}
                        />
                        <View style={styles.submittedBadge}>
                          <Check size={8} color="#FFFFFF" strokeWidth={2} />
                        </View>
                      </View>
                    ))}
                    {submittedUsers.length > 4 && (
                      <View style={[styles.avatarContainer, { marginLeft: -8 }]}>
                        <View style={styles.moreAvatar}>
                          <Text style={styles.moreAvatarText}>+{submittedUsers.length - 4}</Text>
                        </View>
                      </View>
                    )}
                  </View>
                </View>
              )}
              
              {/* Pending Avatars */}
              {pendingUsers?.length > 0 && (
                <View style={styles.avatarGroup}>
                  <Text style={styles.avatarGroupLabel}>Pending</Text>
                  <View style={styles.avatarStack}>
                    {pendingUsers.slice(0, 4).map((user, index) => (
                      <View key={user.id} style={[styles.avatarContainer, { marginLeft: index > 0 ? -8 : 0 }]}>
                        <Image 
                          source={{ uri: userAvatars[user.id] }} 
                          style={[styles.avatar, styles.pendingAvatar]}
                        />
                        <View style={styles.pendingBadge}>
                          <Clock size={8} color="#F59E0B" strokeWidth={2} />
                        </View>
                      </View>
                    ))}
                    {pendingUsers.length > 4 && (
                      <View style={[styles.avatarContainer, { marginLeft: -8 }]}>
                        <View style={[styles.moreAvatar, styles.morePendingAvatar]}>
                          <Text style={styles.moreAvatarText}>+{pendingUsers.length - 4}</Text>
                        </View>
                      </View>
                    )}
                  </View>
                </View>
              )}
            </View>
          </TouchableOpacity>
        </View>
        {allMembersSubmitted && !isHost && (
          <View style={{ marginTop: 16, alignItems: 'center' }}>
            <Text style={{ color: '#F59E0B', fontWeight: '600' }}>Pending for bill finalization</Text>
          </View>
        )}
      </>
    );
  };

  const renderPayStatus = () => {
    const currentUserCost = userCosts.find(uc => uc.userId === currentUserId);
    const status = paymentStatus[currentUserId] || 'unpaid';
    const isCurrentUserPaid = status === 'paid';
    const isCurrentUserVerified = status === 'verified';

    // If all are verified, auto-close bill
    if (bill.status === 'pay' && bill.participants.every(p => paymentStatus[p.id] === 'verified')) {
      setBill(prev => prev ? { ...prev, status: 'closed' } : prev);
      return null;
    }

    return (
      <>
        {/* Payment Summary & Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Payment</Text>
          <Text style={styles.sectionSubtitle}>Amount you owe for this bill</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <Text style={styles.paymentTotal}>{formatCurrency(currentUserCost?.total ?? 0)}</Text>
            <TouchableOpacity style={{ marginLeft: 16 }} onPress={() => setShowReceiptModal(true)}>
              <Text style={{ color: '#3B82F6', fontWeight: '600' }}>View Receipt</Text>
            </TouchableOpacity>
          </View>
          {/* Member: show Mark as Paid/Unmark Paid and Verify via Chat as separate buttons */}
          {!isHost && status === 'unpaid' && (
            <TouchableOpacity style={styles.verifyButton} onPress={() => togglePaid(currentUserId)}>
              <Text style={styles.verifyButtonText}>Mark as Paid</Text>
            </TouchableOpacity>
          )}
          {!isHost && status === 'paid' && (
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity style={styles.verifyButton} onPress={() => togglePaid(currentUserId)}>
                <Text style={styles.verifyButtonText}>Unmark Paid</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.verifyButton} onPress={openPaymentChat}>
                <MessageCircle size={18} color="#FFFFFF" strokeWidth={2} />
                <Text style={styles.verifyButtonText}>Verify via Chat</Text>
              </TouchableOpacity>
            </View>
          )}
          {!isHost && isCurrentUserVerified && (
            <View style={styles.verifiedBadge}>
              <Check size={12} color="#10B981" strokeWidth={2} />
              <Text style={styles.verifiedBadgeText}>Payment Verified</Text>
            </View>
          )}
        </View>

        {/* Payment Progress for all participants */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Progress</Text>
          {userCosts.map((userCost) => {
            const isCurrentUser = userCost.userId === currentUserId;
            const status = paymentStatus[userCost.userId] || 'unpaid';
            return (
              <View key={userCost.userId} style={styles.paymentCard}>
                <View style={styles.paymentHeader}>
                  <Text style={styles.paymentUserName}>
                    {isCurrentUser ? 'You' : userCost.userName}
                  </Text>
                  <View style={styles.paymentAmount}>
                    <Text style={styles.paymentTotal}>{formatCurrency(userCost.total)}</Text>
                    {/* Host: Verify button for paid but not verified */}
                    {isHost && !isCurrentUser && status === 'paid' && (
                      <TouchableOpacity style={styles.verifyButton} onPress={() => verifyPayment(userCost.userId)}>
                        <Text style={styles.verifyButtonText}>Verify Payment</Text>
                      </TouchableOpacity>
                    )}
                    {/* Badges for status */}
                    {status === 'verified' && (
                      <View style={styles.verifiedBadge}>
                        <Check size={12} color="#10B981" strokeWidth={2} />
                        <Text style={styles.verifiedBadgeText}>Verified</Text>
                      </View>
                    )}
                    {status === 'paid' && (
                      <View style={styles.paidBadge}>
                        <Clock size={12} color="#F59E0B" strokeWidth={2} />
                        <Text style={styles.paidBadgeText}>Paid (Pending)</Text>
                      </View>
                    )}
                    {status === 'unpaid' && (
                      <View style={styles.unpaidBadge}>
                        <Clock size={12} color="#F59E0B" strokeWidth={2} />
                        <Text style={styles.unpaidBadgeText}>Unpaid</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        {/* Collapsible Item Details */}
        <View style={styles.section}>
          <TouchableOpacity onPress={() => setShowItemDetails(v => !v)} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <Text style={styles.sectionTitle}>Selected Items</Text>
            <Text style={{ color: '#3B82F6', marginLeft: 8 }}>{showItemDetails ? 'Hide' : 'Show'}</Text>
          </TouchableOpacity>
          {showItemDetails && (
            <>
              <Text style={styles.sectionSubtitle}>Tap on an item to see who selected it</Text>
              {bill?.items.map((item) => {
                const itemTotal = item.price * item.quantity;
                const splitCount = item.selectedBy.length;
                const splitAmount = splitCount > 0 ? itemTotal / splitCount : itemTotal;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.readOnlyItemCard}
                    onPress={() => showItemParticipants(item)}
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
                              bill?.participants.find(p => p.id === id)?.name || 'Unknown'
                            ).join(', ')}
                          </Text>
                        )}
                      </View>
                      <View style={styles.infoIcon}>
                        <Users size={16} color="#64748B" strokeWidth={2} />
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </>
          )}
        </View>

        {/* Receipt/Breakdown Modal */}
        <Modal
          visible={showReceiptModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowReceiptModal(false)}
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ backgroundColor: '#1E293B', borderRadius: 16, padding: 24, width: '85%' }}>
              <Text style={{ color: '#F8FAFC', fontSize: 18, fontWeight: '700', marginBottom: 12 }}>Receipt Breakdown</Text>
              {currentUserCost?.items.map((item) => (
                <Text key={item.id} style={{ color: '#CBD5E1', fontSize: 15, marginBottom: 4 }}>
                  • {item.name}: {formatCurrency(item.price)}
                </Text>
              ))}
              <TouchableOpacity style={{ marginTop: 20, alignSelf: 'flex-end' }} onPress={() => setShowReceiptModal(false)}>
                <Text style={{ color: '#3B82F6', fontWeight: '600', fontSize: 16 }}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Bank Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Details</Text>
          <Text style={styles.sectionSubtitle}>Send your payment to:</Text>
          <View style={styles.bankDetailsCard}>
            <View style={styles.bankDetailRow}>
              <Building2 size={16} color="#64748B" strokeWidth={2} />
              <Text style={styles.bankDetailLabel}>Bank:</Text>
              <Text style={styles.bankDetailValue}>{bill?.bankDetails.bankName}</Text>
            </View>
            <View style={styles.bankDetailRow}>
              <Users size={16} color="#64748B" strokeWidth={2} />
              <Text style={styles.bankDetailLabel}>Account Name:</Text>
              <Text style={styles.bankDetailValue}>{bill?.bankDetails.accountName}</Text>
            </View>
            <View style={styles.bankDetailRow}>
              <CreditCard size={16} color="#64748B" strokeWidth={2} />
              <Text style={styles.bankDetailLabel}>Account Number:</Text>
              <Text style={styles.bankDetailValue}>{bill?.bankDetails.accountNumber}</Text>
            </View>
          </View>
        </View>
      </>
    );
  };

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

  const StatusIcon = getStatusIcon(bill?.status);

  if (!bill) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F172A' }}>
        <Text style={{ color: '#F8FAFC', fontSize: 18 }}>Bill not found.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={20} color="#F8FAFC" strokeWidth={2} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>{bill?.title}</Text>
          <View style={styles.statusContainer}>
            <StatusIcon size={14} color={getStatusColor(bill?.status)} strokeWidth={2} />
            <Text style={[styles.statusText, { color: getStatusColor(bill?.status) }]}>
              {bill?.status.charAt(0).toUpperCase() + bill?.status.slice(1)}
            </Text>
          </View>
        </View>
        
        {/* Host Menu Button */}
        {isHost && bill?.status === 'select' && (
          <TouchableOpacity 
            style={styles.menuButton} 
            onPress={() => setShowHostMenu(true)}
          >
            <EllipsisVertical size={20} color="#F8FAFC" strokeWidth={2} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Bill Info - Redesigned */}
        <View style={styles.billInfoSection}>
          <View style={styles.billInfoHeader}>
            {bill?.description && (
              <Text style={styles.description}>{bill.description}</Text>
            )}
            <View style={styles.quickStats}>
              <View style={styles.quickStat}>
                <Text style={styles.quickStatValue}>{formatCurrency(bill?.totalAmount)}</Text>
                <Text style={styles.quickStatLabel}>Total</Text>
              </View>
              <View style={styles.quickStatDivider} />
              <View style={styles.quickStat}>
                <Text style={styles.quickStatValue}>{bill?.participants.length}</Text>
                <Text style={styles.quickStatLabel}>Members</Text>
              </View>
              <View style={styles.quickStatDivider} />
              <View style={styles.quickStat}>
                <Text style={styles.quickStatValue}>
                  {new Date(bill?.createdAt).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </Text>
                <Text style={styles.quickStatLabel}>Created</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Status-specific content */}
        {bill?.status === 'select' && renderSelectStatus()}
        {bill?.status === 'pay' && renderPayStatus()}
        {bill?.status === 'closed' && renderClosedStatus()}
      </ScrollView>

      {/* Host Menu Modal */}
      <Modal
        visible={showHostMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowHostMenu(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowHostMenu(false)}
        >
          <View style={styles.hostMenu}>
            <TouchableOpacity style={styles.hostMenuItem} onPress={editBill}>
              <UserPen size={18} color="#3B82F6" strokeWidth={2} />
              <Text style={styles.hostMenuText}>Edit Bill</Text>
            </TouchableOpacity>
            
            <View style={styles.hostMenuDivider} />
            
            <TouchableOpacity style={styles.hostMenuItem} onPress={deleteBill}>
              <Trash2 size={18} color="#EF4444" strokeWidth={2} />
              <Text style={[styles.hostMenuText, { color: '#EF4444' }]}>Delete Bill</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Members Modal */}
      <Modal
        visible={showMembersModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowMembersModal(false)}
      >
        <View style={styles.membersModalOverlay}>
          <View style={styles.membersModal}>
            <View style={styles.membersModalHeader}>
              <Text style={styles.membersModalTitle}>Selection Progress</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowMembersModal(false)}
              >
                <X size={20} color="#64748B" strokeWidth={2} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.membersModalContent} showsVerticalScrollIndicator={false}>
              {/* Submitted Members */}
              {submittedUsers?.length > 0 && (
                <View style={styles.memberGroup}>
                  <Text style={styles.memberGroupTitle}>
                    Submitted ({submittedUsers.length})
                  </Text>
                  {submittedUsers.map((user) => (
                    <View key={user.id} style={styles.memberItem}>
                      <View style={styles.memberLeft}>
                        <Image 
                          source={{ uri: userAvatars[user.id] }} 
                          style={styles.memberAvatar}
                        />
                        <View style={styles.memberInfo}>
                          <Text style={styles.memberName}>
                            {user.id === currentUserId ? 'You' : user.name}
                          </Text>
                          <Text style={styles.memberEmail}>{user.email}</Text>
                        </View>
                      </View>
                      <View style={styles.submittedStatus}>
                        <Check size={16} color="#10B981" strokeWidth={2} />
                        <Text style={styles.submittedStatusText}>Submitted</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
              
              {/* Pending Members */}
              {pendingUsers?.length > 0 && (
                <View style={styles.memberGroup}>
                  <Text style={styles.memberGroupTitle}>
                    Pending ({pendingUsers.length})
                  </Text>
                  {pendingUsers.map((user) => (
                    <View key={user.id} style={styles.memberItem}>
                      <View style={styles.memberLeft}>
                        <Image 
                          source={{ uri: userAvatars[user.id] }} 
                          style={[styles.memberAvatar, styles.pendingMemberAvatar]}
                        />
                        <View style={styles.memberInfo}>
                          <Text style={styles.memberName}>
                            {user.id === currentUserId ? 'You' : user.name}
                          </Text>
                          <Text style={styles.memberEmail}>{user.email}</Text>
                        </View>
                      </View>
                      <View style={styles.pendingStatus}>
                        <Clock size={16} color="#F59E0B" strokeWidth={2} />
                        <Text style={styles.pendingStatusText}>Pending</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
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
  // Redesigned Bill Info Section
  billInfoSection: {
    backgroundColor: '#1E293B',
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#334155',
  },
  billInfoHeader: {
    gap: 16,
  },
  description: {
    fontSize: 15,
    color: '#CBD5E1',
    lineHeight: 20,
    fontWeight: '500',
  },
  quickStats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  quickStat: {
    flex: 1,
    alignItems: 'center',
  },
  quickStatValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  quickStatLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  quickStatDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#334155',
    marginHorizontal: 16,
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
  readOnlyItemCard: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
    opacity: 0.8,
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
  infoIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // New Action Buttons Container
  actionButtonsContainer: {
    marginTop: 20,
    gap: 16,
  },
  submitButton: {
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
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
  submissionStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#10B981',
    gap: 8,
  },
  submissionStatusText: {
    flex: 1,
    fontSize: 14,
    color: '#10B981',
    fontWeight: '500',
    lineHeight: 18,
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
  disabledFinalizeButton: {
    backgroundColor: '#475569',
    shadowOpacity: 0,
    elevation: 0,
  },
  finalizeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  statusMessage: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    fontWeight: '500',
    fontStyle: 'italic',
  },
  readyToFinalizeMessage: {
    fontSize: 14,
    color: '#10B981',
    textAlign: 'center',
    fontWeight: '600',
    backgroundColor: '#0F172A',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  progressContainer: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  progressHeader: {
    marginBottom: 20,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F8FAFC',
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  progressSubtitle: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  avatarSection: {
    gap: 16,
  },
  avatarGroup: {
    gap: 12,
  },
  avatarGroupLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#CBD5E1',
    letterSpacing: -0.1,
  },
  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    borderWidth: 2,
    borderColor: '#1E293B',
    borderRadius: 20,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  pendingAvatar: {
    opacity: 0.6,
  },
  submittedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#1E293B',
  },
  pendingBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#F59E0B',
  },
  moreAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  morePendingAvatar: {
    opacity: 0.6,
  },
  moreAvatarText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#F8FAFC',
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
  unpaidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#F59E0B',
    gap: 4,
  },
  unpaidBadgeText: {
    color: '#F59E0B',
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
  chatButton: {
    backgroundColor: '#8B5CF6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
    shadowColor: '#8B5CF6',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  chatButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 100,
    paddingRight: 20,
  },
  hostMenu: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    minWidth: 160,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  hostMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  hostMenuText: {
    color: '#3B82F6',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  hostMenuDivider: {
    height: 1,
    backgroundColor: '#334155',
    marginHorizontal: 16,
  },
  membersModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  membersModal: {
    backgroundColor: '#1E293B',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#334155',
  },
  membersModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  membersModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F8FAFC',
    letterSpacing: -0.3,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  membersModalContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  memberGroup: {
    marginBottom: 24,
  },
  memberGroupTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#CBD5E1',
    marginBottom: 12,
    letterSpacing: -0.2,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0F172A',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  memberLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  pendingMemberAvatar: {
    opacity: 0.6,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F8FAFC',
    marginBottom: 2,
    letterSpacing: -0.2,
  },
  memberEmail: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '500',
  },
  submittedStatus: {
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
  submittedStatusText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '600',
  },
  pendingStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#F59E0B',
    gap: 4,
  },
  pendingStatusText: {
    color: '#F59E0B',
    fontSize: 12,
    fontWeight: '600',
  },
  paidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#F59E0B',
    gap: 4,
  },
  paidBadgeText: {
    color: '#F59E0B',
    fontSize: 11,
    fontWeight: '600',
  },
});