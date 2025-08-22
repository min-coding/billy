import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image, ActivityIndicator, Platform, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Users, Calendar, DollarSign, Check, Clock, Share2, MessageCircle, Bell, SquarePen, Trash2, X, Search, Plus, Tag, Receipt } from 'lucide-react-native';
import { calculateUserCosts, formatCurrency } from '@/utils/billUtils';
import ItemCard from '@/components/ItemCard';
import { useAuth } from '@/contexts/AuthContext';
import { useChat } from '@/contexts/ChatContext';
import { useFriends } from '@/hooks/useFriends';
import { supabase } from '@/lib/supabase';
import * as Clipboard from 'expo-clipboard';
import { Copy } from 'lucide-react-native';
import DatePicker from '@/components/DatePicker';

export default function BillDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { getUnreadCount } = useChat();
  const { friends } = useFriends();

  const [bill, setBill] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Friends modal state
  const [friendSearchQuery, setFriendSearchQuery] = useState('');

  // Edit modals state
  const [showEditBillInfoModal, setShowEditBillInfoModal] = useState(false);
  const [showEditMembersModal, setShowEditMembersModal] = useState(false);
  const [showEditItemsModal, setShowEditItemsModal] = useState(false);

  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editTag, setEditTag] = useState('');
  const [editDueDate, setEditDueDate] = useState('');

  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [savingMembers, setSavingMembers] = useState(false);

  const [editItems, setEditItems] = useState<any[]>([]);
  const [newItemName, setNewItemName] = useState('');
  const [newItemTotalPrice, setNewItemTotalPrice] = useState(''); 
  const [newItemQuantity, setNewItemQuantity] = useState('1');
  const [savingItems, setSavingItems] = useState(false);

  const [receiptImages, setReceiptImages] = useState<{ id: string, url: string }[]>([]);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [modalImageUrl, setModalImageUrl] = useState<string | null>(null);

  const unreadCount = getUnreadCount(id || '');

  // Filter friends based on search query
  const filteredFriends = friends.filter(friend =>
    friend.name.toLowerCase().includes(friendSearchQuery.toLowerCase()) ||
    friend.email.toLowerCase().includes(friendSearchQuery.toLowerCase())
  );

  const fetchBill = async (id: string) => {
    setLoading(true);
    setError(null);
    const billId: string = id as string;
    const { data: billData, error: billError } = await supabase.from('bills').select('*').eq('id', billId).single();
    if (billError) {
      setError('Bill not found');
      setBill(null);
    } else {
      // Fetch items for this bill
      const { data: itemsData } = await supabase
        .from('bill_items')
        .select('*, bill_item_selections(user_id)')
        .eq('bill_id', billId);
      const items = itemsData?.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        selectedBy: item.bill_item_selections?.map((s: any) => s.user_id) || [],
      })) || [];
      // Fetch participants with payment status
      const { data: participantsData } = await supabase
        .from('bill_participants')
        .select('user_id, has_submitted, payment_status, users:user_id(id, name, email, avatar)')
        .eq('bill_id', billId);
      const participants = (participantsData || [])
        .map((p: any) => p.users ? { 
          ...p.users, 
          hasSubmitted: p.has_submitted,
          paymentStatus: p.payment_status || 'unpaid'
        } : null)
        .filter(Boolean);
      // Fetch receipt images (up to 3)
      const { data: receiptsData } = await supabase
        .from('bill_receipts')
        .select('id, url')
        .eq('bill_id', billId)
        .limit(3);
      setReceiptImages(receiptsData || []);
      
      setBill({ 
        ...billData, 
        dueDate: billData.due_date ? billData.due_date.slice(0, 10) : '',
        totalAmount: typeof billData.total_amount === 'number' && !isNaN(billData.total_amount) ? billData.total_amount : 0,
        items, 
        participants,
        bankDetails: {
          bankName: billData.bank_name,
          accountName: billData.account_name,
          accountNumber: billData.account_number,
        }
      });
      
      // Update hasSubmitted for the current user
      const currentUserParticipant = participants.find(p => p.id === user?.id);
      setHasSubmitted(!!currentUserParticipant?.hasSubmitted);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (id) fetchBill(id);
  }, [id]);

  useEffect(() => {
    if (showEditBillInfoModal && bill) {
      setEditTitle(bill.title || '');
      setEditDescription(bill.description || '');
      setEditTag(bill.tag || '');
      setEditDueDate(bill.dueDate || '');
    }
  }, [showEditBillInfoModal, bill]);

  useEffect(() => {
    if (showEditMembersModal && bill) {
      setSelectedMembers(bill.participants.map((p: any) => p.id));
      setFriendSearchQuery('');
    }
  }, [showEditMembersModal, bill]);

  useEffect(() => {
    if (showEditItemsModal && bill) {
      setEditItems(bill.items.map((item: any) => ({ ...item })));
      setNewItemName('');
      setNewItemTotalPrice('');
      setNewItemQuantity('1');
    }
  }, [showEditItemsModal, bill]);

  const isHost = bill?.created_by === user?.id;
  const isParticipant = bill?.participants?.some((p: any) => p.id === user?.id);
  const userCosts = bill && bill.participants && bill.participants.length > 0 && bill.status !== 'select'
    ? calculateUserCosts(bill)
    : [];
  const currentUserCost = userCosts.find(uc => uc.userId === (user?.id || ''));

  // Check if all members have submitted their selections
  const allMembersSubmitted = useMemo(() => {
    if (!bill) return false;
    return bill.participants?.every((p: any) => p.hasSubmitted);
  }, [bill]);

  // Check if all payments are verified
  const allPaymentsVerified = useMemo(() => {
    if (!bill || bill.status !== 'pay') return false;
    return bill.participants?.every((p: any) => p.paymentStatus === 'verified');
  }, [bill]);

  // Initialize selected items based on bill data
  useEffect(() => {
    if (bill && Array.isArray(bill.items) && !hasSubmitted && !loading && user?.id) {
      const userSelectedItems = (bill.items || [])
        .filter((item: any) => Array.isArray(item.selectedBy) && item.selectedBy.includes(user.id))
        .map((item: any) => item.id);
      setSelectedItems(userSelectedItems);
    }
  }, [bill, hasSubmitted, loading, user?.id]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#3B82F6" style={{ marginTop: 50 }} />
      </SafeAreaView>
    );
  }

  if (error || !bill) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>{error || 'Bill not found'}</Text>
      </SafeAreaView>
    );
  }

  const toggleItemSelection = (itemId: string) => {
    if (hasSubmitted && bill.status === 'pay') return;
    setSelectedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const submitSelections = async () => {
    if (!user || !user.id) {
      Alert.alert('Error', 'You must be logged in to submit selections.');
      return;
    }
    if (selectedItems.length === 0) {
      Alert.alert('No Items Selected', 'Please select at least one item before submitting. 🔍');
      return;
    }

    const handleSubmitSelections = async () => {
      setSubmitting(true);
      try {
        // 1. Remove all previous selections for this user and bill
        await supabase
          .from('bill_item_selections')
          .delete()
          .eq('user_id', user.id)
          .in('bill_item_id', bill.items.map((item: any) => item.id));

        // 2. Insert new selections
        if (selectedItems.length > 0) {
          const inserts = selectedItems.map(itemId => ({
            bill_item_id: itemId,
            user_id: user.id,
          }));
          await supabase.from('bill_item_selections').insert(inserts);
        }

        // 3. Update has_submitted in bill_participants
        await supabase
          .from('bill_participants')
          .update({ has_submitted: true })
          .eq('bill_id', bill.id)
          .eq('user_id', user.id);

        // 4. Refetch bill data to update UI
        await fetchBill(id);

        if (Platform.OS === 'web') {
          alert('Your selections have been submitted!');
        } else {
          Alert.alert('Success', 'Your selections have been submitted! ✅');
        }
        setSubmitting(false);
      } catch (err) {
        setSubmitting(false);
        if (Platform.OS === 'web') {
          alert('Failed to submit selections. Please try again.');
        } else {
          Alert.alert('Error', 'Failed to submit selections. Please try again ❗️');
        }
      }
    };

    if (Platform.OS === 'web') {
      handleSubmitSelections();
    } else {
      Alert.alert(
        'Submit Selections',
        '📩 Are you sure you want to submit your item selections? You can still edit them until the host finalizes the bill.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Submit',
            onPress: handleSubmitSelections
          }
        ]
      );
    }
  };

  const finalizeBill = async () => {
    if (!allMembersSubmitted) {
      if (Platform.OS === 'web') {
        window.alert('Not all members have submitted their selections yet. Please wait for all participants to make their choices.');
      } else {
        Alert.alert(
          'Cannot Finalize',
          '❌ Not all members have submitted their selections yet. Please wait for all participants to make their choices.'
        );
      }
      return;
    }

    if (Platform.OS === 'web') {
      const confirmed = window.confirm(
        'This will lock all selections and move the bill to payment phase. This action cannot be undone. Continue?'
      );
      if (!confirmed) return;
      
      try {
        await supabase
          .from('bills')
          .update({ status: 'pay' })
          .eq('id', bill.id);
        window.alert('🧮 The bill has been finalized and participants can now make payments.');
        await fetchBill(id);
      } catch (err) {
        window.alert('Failed to finalize bill. Please try again.');
      }
    } else {
      Alert.alert(
        'Finalize Bill',
        '📌 This will lock all selections and move the bill to payment phase. This action cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Finalize', 
            style: 'destructive',
            onPress: async () => {
              try {
                await supabase
                  .from('bills')
                  .update({ status: 'pay' })
                  .eq('id', bill.id);
                Alert.alert('Bill Finalized 🧮', 'The bill has been finalized and participants can now make payments.');
                
                await fetchBill(id);
              } catch (err) {
                Alert.alert('Error', 'Failed to finalize bill. Please try again.');
              }
            }
          }
        ]
      );
    }
  };

  const deleteBill = async () => {
    const confirmDelete = Platform.OS === 'web'
      ? window.confirm('Are you sure you want to delete this bill? This action cannot be undone and will remove the bill for all participants.')
      : null;

    if (Platform.OS === 'web' && !confirmDelete) return;

    if (Platform.OS !== 'web') {
      Alert.alert(
        'Delete Bill 🗑️',
        'Are you sure you want to delete this bill? This action cannot be undone and will remove the bill for all participants.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                await supabase.from('bills').delete().eq('id', bill.id);
                Alert.alert('Bill Deleted', 'The bill has been deleted successfully ✅', [
                  {
                    text: 'OK',
                    onPress: () => router.back()
                  }
                ]);
              } catch (err) {
                Alert.alert('Error', 'Failed to delete bill. Please try again.');
              }
            }
          }
        ]
      );
      return;
    }

    try {
      await supabase.from('bills').delete().eq('id', bill.id);
      window.alert('The bill has been deleted successfully. ✅');
      router.back();
    } catch (err) {
      window.alert('Failed to delete bill. Please try again.');
    }
  };

  const getParticipantStatus = (participantId: string) => {
    if (bill.status === 'select') {
      const participant = bill.participants.find((p: any) => p.id === participantId);
      return participant?.hasSubmitted ? 'submitted' : 'pending';
    } else if (bill.status === 'pay') {
      const participant = bill.participants.find((p: any) => p.id === participantId);
      return participant?.paymentStatus || 'unpaid';
    }
    return 'verified';
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

  const togglePaymentStatus = async (participantId: string) => {
    if (!user || !bill) return;
    
    const participant = bill.participants.find((p: any) => p.id === participantId);
    if (!participant) return;

    const currentStatus = participant.paymentStatus || 'unpaid';
    const newStatus = currentStatus === 'unpaid' ? 'paid' : 'unpaid';

    try {
      await supabase
        .from('bill_participants')
        .update({ payment_status: newStatus })
        .eq('bill_id', bill.id)
        .eq('user_id', participantId);

      await fetchBill(id);

      if (newStatus === 'paid') {
        // Redirect to chat first
        router.push(`/bill/${bill.id}/chat`);
        // Show alert/message in chat after navigation
        setTimeout(() => {
          if (Platform.OS === 'web') {
            window.alert('Please send a payment slip in the chat for verification!');
          } else {
            Alert.alert('Action Required', 'Please send a payment slip in the chat for verification! 📩');
          }
        }, 500); // Delay to ensure navigation
      } else {
        if (Platform.OS === 'web') {
          window.alert(`Payment status updated to ${newStatus} ✅`);
        } else {
          Alert.alert('Success', `Payment status updated to ${newStatus} ✅`);
        }
      }
    } catch (err) {
      if (Platform.OS === 'web') {
        window.alert('Failed to update payment status');
      } else {
        Alert.alert('Error', 'Failed to update payment status. Please retry ❗️');
      }
    }
  };

  const verifyPayment = async (participantId: string) => {
    if (!user || !bill || !isHost) return;

    try {
      await supabase
        .from('bill_participants')
        .update({ payment_status: 'verified' })
        .eq('bill_id', bill.id)
        .eq('user_id', participantId);

      const updatedParticipants = bill.participants.map((p: any) => 
        p.id === participantId ? { ...p, paymentStatus: 'verified' } : p
      );
      
      const allVerified = updatedParticipants.every((p: any) => p.paymentStatus === 'verified');
      
      if (allVerified) {
        await supabase
          .from('bills')
          .update({ status: 'closed' })
          .eq('id', bill.id);
      }

      await fetchBill(id);

      if (Platform.OS === 'web') {
        window.alert(allVerified ? 'Payment verified! Bill is now closed. ✅' : 'Payment verified! ✅');
      } else {
        Alert.alert('Success', allVerified ? 'Payment verified! Bill is now closed. ✅' : 'Payment verified! ✅');
      }
    } catch (err) {
      if (Platform.OS === 'web') {
        window.alert('Failed to verify payment. Please retry ❗️');
      } else {
        Alert.alert('Error', 'Failed to verify payment. Please retry ❗️');
      }
    }
  };

  const handleSaveBillInfo = async () => {
    if (!bill) return;

    try {
      await supabase
        .from('bills')
        .update({
          title: editTitle,
          description: editDescription,
          tag: editTag,
          due_date: editDueDate || null,
        })
        .eq('id', bill.id);

      await fetchBill(id);
      setShowEditBillInfoModal(false);
      Alert.alert('Success', 'Bill info updated successfully ✅');
    } catch (err) {
      Alert.alert('Error', 'Failed to update bill info. Please retry ❗️');
    }
  };

  const toggleMemberSelection = (userId: string) => {
    setSelectedMembers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSaveMembers = async () => {
    if (!bill) return;
    setSavingMembers(true);
    try {
      const currentIds = bill.participants.map((p: any) => p.id);
      const toAdd = selectedMembers.filter(id => !currentIds.includes(id));
      const toRemove = currentIds.filter(id => !selectedMembers.includes(id));

      if (toAdd.length > 0) {
        await supabase.from('bill_participants').insert(
          toAdd.map(user_id => ({ bill_id: bill.id, user_id }))
        );
        let billOwnerName = bill.ownerName || bill.owner || bill.created_by_name || (user && user.name) || 'Someone';
        for (const user_id of toAdd) {
          await supabase.from('notifications').insert({
            user_id,
            type: 'bill_invite',
            title: `You receive an invitation 🎉`,
            body: `${billOwnerName} invites you to ${bill.title} bill`,
            data: {
              bill_id: bill.id,
              bill_title: bill.title,
              inviter_id: bill.created_by,
              target: `/bill/${bill.id}`
            },
            is_read: false
          });
        }
      }

      for (const user_id of toRemove) {
        await supabase.from('bill_participants')
          .delete()
          .eq('bill_id', bill.id)
          .eq('user_id', user_id);
        const { data: items } = await supabase
          .from('bill_items')
          .select('id')
          .eq('bill_id', bill.id);
        if (items && items.length > 0) {
          await supabase
            .from('bill_item_selections')
            .delete()
            .eq('user_id', user_id)
            .in('bill_item_id', items.map((item: any) => item.id));
        }
      }

      await fetchBill(id);
      setShowEditMembersModal(false);
      Alert.alert('Success', 'Members updated! ✅');
    } catch (err) {
      Alert.alert('Error', 'Failed to update members. Please retry ❗️');
    }
    setSavingMembers(false);
  };

  const handleAddEditItem = () => {
    if (!newItemName.trim() || !newItemTotalPrice.trim() || !newItemQuantity.trim()) {
      Alert.alert('Error', 'Please enter item name, total price, and quantity. 🔍');
      return;
    }
    const totalPrice = parseFloat(newItemTotalPrice);
    const quantity = parseInt(newItemQuantity);
    if (isNaN(totalPrice) || totalPrice <= 0) {
      Alert.alert('Error', 'Please enter a valid total price. 🔍');
      return;
    }
    if (isNaN(quantity) || quantity <= 0) {
      Alert.alert('Error', 'Please enter a valid quantity. 🔍');
      return;
    }
    const pricePerItem = totalPrice / quantity;
    const newItem = {
      id: `new-${Date.now()}`,
      name: newItemName.trim(),
      price: pricePerItem,
      quantity,
    };

    setEditItems([...editItems, newItem]);
    setNewItemName('');
    setNewItemTotalPrice('');
    setNewItemQuantity('1');
};

const handleRemoveEditItem = (id: string) => {
    setEditItems(editItems.filter(item => item.id !== id));
};

const handleSaveEditItems = async () => {
    if (!bill) return;

    const performSave = async () => {
      setSavingItems(true);
      try {
        const currentIds = bill.items.map((item: any) => item.id);
        const newIds = editItems.filter(item => !item.id.startsWith('new-')).map(item => item.id);
        const toDelete = currentIds.filter(id => !newIds.includes(id));
        if (toDelete.length > 0) {
          const { error: deleteError } = await supabase
            .from('bill_items')
            .delete()
            .in('id', toDelete);

          if (deleteError) {
            console.error('Error deleting bill items:', deleteError);
          }
        }

        const toAdd = editItems.filter(item => item.id.startsWith('new-'));
        console.log('Items to add:', toAdd);

        if (toAdd.length > 0) {
          const { data: insertedItems, error: insertError } = await supabase.from('bill_items').insert(
            toAdd.map(item => ({
              bill_id: bill.id,
              name: item.name,
              price: item.price,
              quantity: item.quantity,
            }))
          );

          if (insertError) {
            console.error('Error inserting new bill items:', insertError);
          } else {
            console.log('Successfully inserted items:', insertedItems);
          }
        }

        const { data: participants, error: participantsError } = await supabase
          .from('bill_participants')
          .select('user_id')
          .eq('bill_id', bill.id);

        if (participantsError) {
          console.error('Error fetching participants:', participantsError);
        } else if (participants) {
          console.log('Participants fetched:', participants);
          for (const p of participants) {
            const { error: updateParticipantError } = await supabase
              .from('bill_participants')
              .update({ has_submitted: false })
              .eq('bill_id', bill.id)
              .eq('user_id', p.user_id);

            if (updateParticipantError) {
              console.error(`Error updating participant ${p.user_id}:`, updateParticipantError);
            }
          }
        }

        const { data: allItems, error: allItemsError } = await supabase
          .from('bill_items')
          .select('id')
          .eq('bill_id', bill.id);

        if (allItemsError) {
          console.error('Error fetching all bill items:', allItemsError);
        } else if (allItems && allItems.length > 0) {
          console.log('All bill items:', allItems);

          const { error: deleteSelectionsError } = await supabase
            .from('bill_item_selections')
            .delete()
            .in('bill_item_id', allItems.map((item: any) => item.id));

          if (deleteSelectionsError) {
            console.error('Error deleting item selections:', deleteSelectionsError);
          }
        }

        await fetchBill(id);
        setShowEditItemsModal(false);

        if (Platform.OS === 'web') {
          window.alert('Items updated and selections reset! ✅');
        } else {
          Alert.alert('Success', 'Items updated and selections reset! ✅');
        }
      } catch (err) {
        console.error('Unexpected error during performSave:', err);

        if (Platform.OS === 'web') {
          window.alert('Failed to update items');
        } else {
          Alert.alert('Error', 'Failed to update items');
        }
      }
      setSavingItems(false);
    };

    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Editing items will reset all participants selections. Continue?');
      if (confirmed) {
        performSave();
      }
    } else {
      Alert.alert(
        'Reset Selections? 🔁',
        'Editing items will reset all participants selections. Continue?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Continue',
            style: 'destructive',
            onPress: performSave
          }
        ]
      );
    }
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

        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Bill Info</Text>
            {isHost && bill.status === 'select' && (
              <TouchableOpacity style={styles.addFromFriendsButton} onPress={() => setShowEditBillInfoModal(true)}   disabled={!bill}
>
                <Text style={styles.addFromFriendsText}>Edit info</Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.billInfo}>
            <View style={styles.infoRow}>
              <Users size={16} color="#64748B" strokeWidth={2} />
              <Text style={styles.infoText}>{bill.participants.length} people</Text>
            </View>
            
            <View style={styles.infoRow}>
              <DollarSign size={16} color="#10B981" strokeWidth={2} />
              <Text style={styles.infoText}>{formatCurrency(bill.totalAmount)}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Calendar size={16} color="#64748B" strokeWidth={2} />
              <Text style={styles.infoText}>
                {bill.due_date 
                  ? `Due ${new Date(bill.due_date).toLocaleDateString()}`
                  : `Created ${new Date(bill.created_at).toLocaleDateString()}`
                }
              </Text>
            </View>
          </View>

          {bill.description && (
            <Text style={styles.description}>{bill.description}</Text>
          )}
        </View>
        
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
            
            {bill.status === 'pay' && (
              <TouchableOpacity
                style={[
                  styles.paymentButton,
                  getParticipantStatus(user?.id || '') === 'paid' && styles.paymentButtonPaid,
                  getParticipantStatus(user?.id || '') === 'verified' && { opacity: 0.5 }
                ]}
                onPress={() => togglePaymentStatus(user?.id || '')}
                disabled={getParticipantStatus(user?.id || '') === 'verified'}
              >
                <Text style={styles.paymentButtonText}>
                  {getParticipantStatus(user?.id || '') === 'paid' ? 'Mark as Unpaid' : 'Mark as Paid'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Members</Text>
            {isHost && bill.status === 'select' && (
              <TouchableOpacity style={styles.addFromFriendsButton} onPress={() => setShowEditMembersModal(true)}>
                <Text style={styles.addFromFriendsText}>Edit members</Text>
              </TouchableOpacity>
            )}
          </View>
          
          {bill.participants.map((participant: any) => {
            const participantCost = userCosts.find(uc => uc.userId === participant.id);
            const status = getParticipantStatus(participant.id);
            const StatusIcon = getStatusIcon(status);
            const canVerifyPayment = bill.status === 'pay' && status === 'paid';
            
            return (
              <View key={participant.id} style={styles.participantCard}>
                <View style={styles.participantLeft}>
                  {participant.id === bill.created_by && (
                    <View style={styles.hostBadge}>
                      <Text style={styles.hostBadgeText}>HOST</Text>
                    </View>
                  )}
                  {participant.avatar && (
                    <Image 
                      source={{ uri: participant.avatar }} 
                      style={styles.participantAvatar}
                    />
                  )}
                  <View style={styles.participantInfo}>
                    <Text style={styles.participantName}>{participant.name}</Text>
                  </View>
                </View>
              
                <View style={styles.participantRight}>
                  {bill.status !== 'select' && (
                    <Text style={styles.participantAmount}>
                      {participantCost ? formatCurrency(participantCost.total) : '$0.00'}
                    </Text>
                  )}
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(status) }]}> 
                    <StatusIcon size={12} color="#FFFFFF" strokeWidth={2} />
                    <Text style={styles.statusText}>{getStatusText(status)}</Text>
                  </View>

                  {canVerifyPayment && isHost && (
                    <TouchableOpacity
                      style={styles.verifyButton}
                      onPress={() => verifyPayment(participant.id)}
                    >
                      <Text style={styles.verifyButtonText}>Verify</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}

          {bill.participants.length === 0 && (
            <View style={styles.noMembersContainer}>
              <Text style={styles.noMembersText}>No members added yet</Text>
              <Text style={styles.noMembersSubtext}>
                Add friends from your friends list to split this bill
              </Text>
            </View>
          )}
        </View>

        {bill.status === 'pay' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Details</Text>
            <View style={styles.bankCard}>
              <Text style={styles.bankTitle}>Send payment to:</Text>
              <Text style={styles.bankName}>{bill.bankDetails.bankName}</Text>
              <Text style={styles.accountName}>{bill.bankDetails.accountName}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.accountNumber}>
                  Account: {bill.bankDetails.accountNumber}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    Clipboard.setStringAsync(bill.bankDetails.accountNumber);
                    Alert.alert('Copied!', 'Bank account number copied to clipboard.');
                  }}
                  activeOpacity={0.7}
                  style={{ marginLeft: 8 }}
                >
                  <Copy size={18} color="#3B82F6" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {allPaymentsVerified && bill.status === 'pay' && (
          <View style={styles.section}>
            <View style={styles.successCard}>
              <Check size={16} color="#10B981" strokeWidth={2} />
              <Text style={styles.successText}>All payments verified! Bill is now closed.</Text>
            </View>
          </View>
        )}

{/* Items Section */}
<View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Items</Text>
            {isHost && bill.status === 'select' && (
              <TouchableOpacity style={styles.addFromFriendsButton} onPress={() => setShowEditItemsModal(true)}>
                <Text style={styles.addFromFriendsText}>Edit items</Text>
              </TouchableOpacity>
            )}
          </View>
          {Array.isArray(bill.items) && bill.items.length > 0 ? (
            bill.items.map((item: any) => (
              <ItemCard
                key={item.id}
                item={item}
                isSelected={selectedItems.includes(item.id)}
                onToggle={() => toggleItemSelection(item.id)}
                participantCount={item.selectedBy.length}
                editable={bill.status === 'select'}
              />
            ))
          ) : (
            <Text style={{ color: '#64748B', marginTop: 8 }}>No items yet.</Text>
          )}
        </View>

        {/* Receipt Images Section (modern grid) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Receipt Images</Text>
          {receiptImages.length === 0 ? (
            <View style={styles.noReceiptContainer}>
              <Text style={styles.noReceiptText}>No receipts uploaded</Text>
            </View>
          ) : (
            <View style={styles.receiptGrid}>
              {receiptImages.map((img, idx) => (
                <View key={img.id} style={styles.receiptCard}>
                  <TouchableOpacity
                    onPress={() => { setModalImageUrl(img.url); setShowReceiptModal(true); }}
                    style={{ width: '100%', height: '100%' }}
                    activeOpacity={0.85}
                  >
                    <Image
                      source={{ uri: img.url }}
                      style={styles.receiptImage}
                      resizeMode="cover"
                      accessibilityLabel={`Receipt image ${idx + 1}`}
                    />
                    {isHost && (
                      <TouchableOpacity
                        style={styles.removeIcon}
                        onPress={async (e) => {
                          e.stopPropagation && e.stopPropagation();
                          const { error } = await supabase.from('bill_receipts').delete().eq('id', img.id);
                          if (!error) setReceiptImages(receiptImages.filter(r => r.id !== img.id));
                        }}
                      >
                        <X size={18} color="#fff" />
                      </TouchableOpacity>
                    )}
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
          <Modal visible={showReceiptModal} transparent onRequestClose={() => setShowReceiptModal(false)}>
            <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowReceiptModal(false)}>
              {modalImageUrl && (
                <Image
                  source={{ uri: modalImageUrl }}
                  style={styles.fullScreenReceipt}
                  resizeMode="contain"
                />
              )}
            </TouchableOpacity>
          </Modal>
        </View>

        {isHost && (
          <View style={styles.section}>
            <TouchableOpacity
              style={[styles.finalizeButton, { backgroundColor: '#EF4444' }]}
              onPress={deleteBill}
            >
              <Trash2 size={18} color='white' strokeWidth={2} />
              <Text style={[styles.finalizeButtonText, { color: 'white' }]}>Delete Bill</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {isParticipant && bill.status === 'select' && (
        <View style={styles.footer}>
          <TouchableOpacity 
            style={[
              styles.submitButton,
              (selectedItems.length === 0 || submitting) && styles.disabledButton
            ]}
            onPress={submitSelections}
            disabled={selectedItems.length === 0 || submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
            ) : (
              <Check size={18} color="#FFFFFF" strokeWidth={2} />
            )}
            <Text style={styles.submitButtonText}>
              {hasSubmitted ? 'Update Selections' : 'Submit Selections'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

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


      {/* Edit Bill Info Modal */}
      <Modal
        visible={showEditBillInfoModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowEditBillInfoModal(false)}
      >
        <View style={styles.friendsModalOverlay}>
          <View style={[styles.friendsModal, { maxHeight: '80%' }]}>
            <View style={styles.friendsModalHeader}>
              <Text style={styles.friendsModalTitle}>Edit Bill Info</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowEditBillInfoModal(false)}
              >
                <X size={20} color="#64748B" strokeWidth={2} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Bill Title *</Text>
                <TextInput
                  style={styles.input}
                  value={editTitle}
                  onChangeText={setEditTitle}
                  placeholder="Enter bill title"
                  placeholderTextColor="#64748B"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={editDescription}
                  onChangeText={setEditDescription}
                  placeholder="Add a description (optional)"
                  placeholderTextColor="#64748B"
                  multiline
                  numberOfLines={3}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Tag/Label</Text>
                <View style={styles.inputWithIcon}>
                  <Tag size={18} color="#64748B" strokeWidth={2} />
                  <TextInput
                    style={[styles.input, styles.inputWithIconText]}
                    value={editTag}
                    onChangeText={setEditTag}
                    placeholder="e.g., Food & Dining, Work, Groceries"
                    placeholderTextColor="#64748B"
                  />
                </View>
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Due Datezzz</Text>
                <Text style={styles.labelSubtext}>When should participants complete their selections and payments?</Text>
                <View style={styles.inputWithIcon}>
                  <DatePicker
            label="Due Date"
            value={editDueDate}
            onDateChange={setEditDueDate}
            placeholder="Select due date (optional)"
            minimumDate={new Date()}
          />
                </View>
              </View>
            </ScrollView>
            {/* Sticky footer for buttons */}
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12, position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#1E293B', padding: 20, borderTopWidth: 1, borderTopColor: '#334155' }}>
              <TouchableOpacity style={[styles.addSelectedButton, { backgroundColor: '#64748B', paddingHorizontal: 20 }]} onPress={() => setShowEditBillInfoModal(false)}>
                <Text style={styles.addSelectedText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.addSelectedButton, { paddingHorizontal: 20 }]} onPress={handleSaveBillInfo}>
                <Text style={styles.addSelectedText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Members Modal */}
      <Modal
        visible={showEditMembersModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowEditMembersModal(false)}
      >
        <View style={styles.friendsModalOverlay}>
          <View style={styles.friendsModal}>
            <View style={styles.friendsModalHeader}>
              <Text style={styles.friendsModalTitle}>Edit Members</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowEditMembersModal(false)}
              >
                <X size={20} color="#64748B" strokeWidth={2} />
              </TouchableOpacity>
            </View>
            {/* Search */}
            <View style={styles.friendsSearchContainer}>
              <Search size={18} color="#64748B" strokeWidth={2} />
              <TextInput
                style={styles.friendsSearchInput}
                value={friendSearchQuery}
                onChangeText={setFriendSearchQuery}
                placeholder="Search friends..."
                placeholderTextColor="#64748B"
              />
            </View>
            <ScrollView style={styles.friendsModalContent} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
              {filteredFriends.length === 0 ? (
                <View style={styles.noFriendsContainer}>
                  <Text style={styles.noFriendsText}>
                    {friendSearchQuery ? 'No friends found' : 'No friends available'}
                  </Text>
                  <Text style={styles.noFriendsSubtext}>
                    {friendSearchQuery ? 'Try adjusting your search' : 'Add friends from the Friends tab first'}
                  </Text>
                </View>
              ) : (
                filteredFriends.map((friend) => {
                  const isChecked = selectedMembers.includes(friend.id);
                  return (
                    <TouchableOpacity
                      key={friend.id}
                      style={[
                        styles.friendItem,
                        isChecked && styles.selectedFriendItem,
                      ]}
                      onPress={() => toggleMemberSelection(friend.id)}
                    >
                      <View style={styles.friendItemLeft}>
                        <Image
                          source={{ uri: friend.avatar }}
                          style={styles.friendItemAvatar}
                        />
                        <View style={styles.friendItemInfo}>
                          <Text style={styles.friendItemName}>{friend.name}</Text>
                          <Text style={styles.friendItemEmail}>{friend.email}</Text>
                        </View>
                      </View>
                      <View style={[styles.friendCheckbox, isChecked && styles.checkedFriendBox]}>
                        {isChecked && <Check size={14} color="#FFFFFF" strokeWidth={2.5} />}
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
            {/* Sticky footer for buttons */}
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12, position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#1E293B', padding: 20, borderTopWidth: 1, borderTopColor: '#334155' }}>
              <TouchableOpacity style={[styles.addSelectedButton, { backgroundColor: '#64748B', paddingHorizontal: 20 }]} onPress={() => setShowEditMembersModal(false)}>
                <Text style={styles.addSelectedText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.addSelectedButton, { paddingHorizontal: 20 }]} onPress={handleSaveMembers} disabled={savingMembers}>
                <Text style={styles.addSelectedText}>{savingMembers ? 'Saving...' : 'Save'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Items Modal */}
      <Modal
        visible={showEditItemsModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowEditItemsModal(false)}
      >
        <View style={styles.friendsModalOverlay}>
          <View style={styles.friendsModal}>
            <View style={styles.friendsModalHeader}>
              <Text style={styles.friendsModalTitle}>Edit Items</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowEditItemsModal(false)}
              >
                <X size={20} color="#64748B" strokeWidth={2} />
              </TouchableOpacity>
            </View>
            <ScrollView
              style={styles.friendsModalContent}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 100 }}
            >
              {/* Add item row */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <TextInput
                  style={[styles.input, { flex: 3, minWidth: 0 }]}
                  value={newItemName}
                  onChangeText={setNewItemName}
                  placeholder="Item name"
                  placeholderTextColor="#64748B"
                />
                <TextInput
                  style={[styles.input, { flex: 1, minWidth: 0 }]}
                  value={newItemQuantity}
                  onChangeText={setNewItemQuantity}
                  placeholder="Qty"
                  placeholderTextColor="#64748B"
                  keyboardType="numeric"
                />
                <TextInput
                  style={[styles.input, { flex: 3, minWidth: 0 }]}
                  value={newItemTotalPrice}
                  onChangeText={setNewItemTotalPrice}
                  placeholder="Total price"
                  placeholderTextColor="#64748B"
                  keyboardType="decimal-pad"
                />
                <TouchableOpacity style={styles.addButton} onPress={handleAddEditItem}>
                  <Plus size={18} color="#FFFFFF" strokeWidth={2.5} />
                </TouchableOpacity>
              </View>
              {/* Show calculated price per item for reference */}
              {newItemTotalPrice && newItemQuantity && parseFloat(newItemQuantity) > 0 && (
                <Text style={{ color: '#10B981', marginTop: 4, marginLeft: 4 }}>
                  Per item: {formatCurrency(parseFloat(newItemTotalPrice) / parseInt(newItemQuantity))}
                </Text>
              )}
              {/* Item list */}
              {editItems.map((item) => (
                <View key={item.id} style={[styles.itemCard, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemPrice}>
                      {formatCurrency(item.price)} × {item.quantity}
                    </Text>
                  </View>
                  <Text style={styles.itemTotal}>{formatCurrency(item.price * item.quantity)}</Text>
                  <TouchableOpacity
                    style={[styles.pillButton, styles.pillButtonRedOutline, { marginLeft: 8, opacity: 0.8 }]}
                    onPress={() => handleRemoveEditItem(item.id)}
                  >
                    <Trash2 size={16} color="#EF4444" strokeWidth={2} />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
            {/* Sticky footer for buttons */}
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12, position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#1E293B', padding: 20, borderTopWidth: 1, borderTopColor: '#334155' }}>
              <TouchableOpacity style={[styles.addSelectedButton, { backgroundColor: '#64748B', paddingHorizontal: 20 }]} onPress={() => setShowEditItemsModal(false)}>
                <Text style={styles.addSelectedText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.addSelectedButton, { paddingHorizontal: 20 }]} onPress={handleSaveEditItems} disabled={savingItems}>
                <Text style={styles.addSelectedText}>{savingItems ? 'Saving...' : 'Save'}</Text>
              </TouchableOpacity>
            </View>
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
    paddingTop:20,
    paddingBottom:20,
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
    letterSpacing: -0.3,
    paddingBottom: 16,
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
  participantAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  participantInfo: {
    flex: 1,
  },
  participantName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F8FAFC',
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  participantEmail: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '500',
  },
  participantRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  participantAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
    marginRight: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
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
  paymentButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 8,
  },
  paymentButtonPaid: {
    backgroundColor: '#F59E0B',
  },
  paymentButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    paddingVertical: 6,
  },
  verifyButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  verifyButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  successCard: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  successText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
  },
  membersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addFromFriendsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3B82F6',
    gap: 6,
  },
  addFromFriendsText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  noMembersContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    padding: 20,
  },
  noMembersText: {
    color: '#CBD5E1',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  noMembersSubtext: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  friendsModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  friendsModal: {
    backgroundColor: '#1E293B',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#334155',
  },
  friendsModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  friendsModalTitle: {
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
  friendsSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginHorizontal: 20,
    marginVertical: 16,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 12,
  },
  friendsSearchInput: {
    flex: 1,
    fontSize: 16,
    color: '#F8FAFC',
    fontWeight: '500',
  },
  friendsModalContent: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  noFriendsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noFriendsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F8FAFC',
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  noFriendsSubtext: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    fontWeight: '500',
  },
  friendItem: {
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
  selectedFriendItem: {
    borderColor: '#3B82F6',
    backgroundColor: '#1E293B',
  },
  disabledFriendItem: {
    opacity: 0.5,
  },
  friendItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  friendItemAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  disabledAvatar: {
    opacity: 0.6,
  },
  friendItemInfo: {
    flex: 1,
  },
  friendItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F8FAFC',
    marginBottom: 2,
    letterSpacing: -0.2,
  },
  friendItemEmail: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '500',
  },
  disabledText: {
    opacity: 0.6,
  },
  addedText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
    backgroundColor: '#0F172A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  friendCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#475569',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
  },
  checkedFriendBox: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  friendsModalFooter: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  addSelectedButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  addSelectedText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#CBD5E1',
    marginBottom: 8,
    letterSpacing: -0.1,
  },
  input: {
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#F8FAFC',
    backgroundColor: '#0F172A',
    fontWeight: '500',
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    backgroundColor: '#0F172A',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  inputWithIconText: {
    flex: 1,
    borderWidth: 0,
    paddingHorizontal: 0,
    paddingVertical: 0,
    backgroundColor: 'transparent',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  labelSubtext: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
    marginBottom: 8,
  },
  itemCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#334155',
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
  itemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemPrice: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
  },
  itemTotal: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
  },
  pillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 6,
    borderWidth: 1,
  },
  pillButtonRedOutline: {
    borderColor: '#EF4444',
    backgroundColor: 'transparent',
  },
  pillButtonBlue: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  pillButtonTextRed: {
    color: '#EF4444',
    fontWeight: '600',
    fontSize: 15,
  },
  pillButtonTextBlue: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 15,
  },
  addButton: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  receiptThumbnail: {
    width: 120,
    height: 120,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    marginTop: 8,
  },
  removeReceiptButton: {
    marginTop: 4,
    backgroundColor: '#1E293B',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: 'center',
  },
  removeReceiptText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '600',
  },
  noReceiptContainer: {
    alignItems: 'center',
    padding: 16,
    opacity: 0.6,
  },
  noReceiptText: {
    color: '#94A3B8',
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenReceipt: {
    width: '90%',
    height: '80%',
    borderRadius: 16,
  },
  receiptGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
  },
  receiptCard: {
    width: 96,
    height: 96,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    marginBottom: 8,
    marginRight: 8,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  receiptImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    resizeMode: 'cover',
  },
  removeIcon: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#EF4444',
    borderRadius: 12,
    padding: 2,
    zIndex: 2,
  },
});