import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Modal, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, X, Users, Share2, ArrowLeft, DollarSign, CreditCard, Building2, Check, Search, Calendar, Tag, TestTube, Camera } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { BillItem, User, BankDetails, Friend } from '@/types';
import { formatCurrency } from '@/utils/billUtils';
import { useFriends } from '@/hooks/useFriends';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useBills } from '@/hooks/useBills';
import { decode } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

export default function CreateBillScreen() {
  const router = useRouter();
  const { friends } = useFriends();
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [tag, setTag] = useState('');
  const [items, setItems] = useState<BillItem[]>([]);
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('1');
  const [participants, setParticipants] = useState<User[]>([]);
  const [bankDetails, setBankDetails] = useState<BankDetails>({
    bankName: 'SCB',
    accountName: 'Winner Hackathon',
    accountNumber: '1234567890'
  });
  const [showFriendsModal, setShowFriendsModal] = useState(false);
  const [friendSearchQuery, setFriendSearchQuery] = useState('');
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const { refetch } = useBills();
  const [receiptImageUris, setReceiptImageUris] = useState<string[]>([]);
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);

  const filteredFriends = friends.filter(friend =>
    friend.name.toLowerCase().includes(friendSearchQuery.toLowerCase()) ||
    friend.email.toLowerCase().includes(friendSearchQuery.toLowerCase())
  );

  // Test bill data for quick testing
  const fillTestBill = () => {
    setTitle('Test Bill');
    setDescription('Quick test bill for app testing');
    setDueDate('2026-02-15');
    setTag('Test');
    
    // Add test items
    const testItems: BillItem[] = [
      {
        id: 'item1',
        name: 'Item 1',
        price: 100,
        quantity: 1,
        selectedBy: [],
      },
      {
        id: 'item2',
        name: 'Item 2',
        price: 200,
        quantity: 1,
        selectedBy: [],
      },
      {
        id: 'item3',
        name: 'Item 3',
        price: 500,
        quantity: 1,
        selectedBy: [],
      },
      {
        id: 'item4',
        name: 'Item user1&2 share',
        price: 400,
        quantity: 1,
        selectedBy: [],
      },
      {
        id: 'item5',
        name: 'ItemAllUser',
        price: 3000,
        quantity: 1,
        selectedBy: [],
      },
    ];
    setItems(testItems);
    
    // Do not set participants here; add them manually from real data

    Alert.alert('Test Data Loaded', 'Bill has been prefilled with test data for quick testing!');
  };

  // Helper function to format date for input
  const formatDateForInput = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toISOString().split('T')[0];
  };

  // Helper function to validate due date
  const validateDueDate = (dateString: string) => {
    if (!dateString) return false;
    const selectedDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return selectedDate >= today;
  };

  const addItem = () => {
    if (!newItemName.trim() || !newItemPrice.trim() || !newItemQuantity.trim()) {
      Alert.alert('Error', 'Please enter item name, price, and quantity 🔍');
      return;
    }

    const price = parseFloat(newItemPrice);
    const quantity = parseInt(newItemQuantity);
    
    if (isNaN(price) || price <= 0) {
      Alert.alert('Error', 'Please enter a valid price 🔍');
      return;
    }

    if (isNaN(quantity) || quantity <= 0) {
      Alert.alert('Error', 'Please enter a valid quantity 🔍');
      return;
    }

    const newItem: BillItem = {
      id: Date.now().toString(),
      name: newItemName.trim(),
      price: price,
      quantity: quantity,
      selectedBy: [],
    };

    setItems([...items, newItem]);
    setNewItemName('');
    setNewItemPrice('');
    setNewItemQuantity('1');
  };

  const removeItem = (itemId: string) => {
    setItems(items.filter(item => item.id !== itemId));
  };

  const removeParticipant = (participantId: string) => {
    if (participantId === 'creator') return;
    setParticipants(participants.filter(p => p.id !== participantId));
  };

  const toggleFriendSelection = (friendId: string) => {
    setSelectedFriends(prev => 
      prev.includes(friendId) 
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    );
  };

  const addSelectedFriends = () => {
    const friendsToAdd = friends
      .filter(friend => selectedFriends.includes(friend.id))
      .map(friend => ({
        id: friend.id,
        name: friend.name,
        email: friend.email,
        avatar: friend.avatar
      }));

    // Remove duplicates
    const existingIds = participants.map(p => p.id);
    const newFriends = friendsToAdd.filter(friend => !existingIds.includes(friend.id));

    setParticipants(prev => [...prev, ...newFriends]);
    setSelectedFriends([]);
    setShowFriendsModal(false);
    setFriendSearchQuery('');

    if (newFriends.length > 0) {
      Alert.alert('Friends Added', `${newFriends.length} friend${newFriends.length !== 1 ? 's' : ''} added to the bill ✅`);
    }
  };

  const calculateItemsTotal = () => {
    return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const pickReceiptImage = async () => {
    if (receiptImageUris.length >= 3) {
      Alert.alert('Limit Reached', 'You can only add up to 3 receipt images. 🔍');
      return;
    }
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera roll permission is needed. 📷');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
      });
      if (result.canceled || !result.assets?.length) return;
      const manipResult = await ImageManipulator.manipulateAsync(
        result.assets[0].uri,
        [{ resize: { width: 1024 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );
      setReceiptImageUris(prev => [...prev, manipResult.uri]);
    } catch (error) {
      console.error('Error picking receipt image:', error);
      Alert.alert('Error', 'Unable to select receipt image. Please retry ❗️');
    }
  };

  const removeReceiptImage = (index: number) => {
    setReceiptImageUris(prev => prev.filter((_, i) => i !== index));
  };

  const uploadReceiptImage = async (imageUri: string, billId: string, idx: number): Promise<string | null> => {
    if (!user) return null;
    try {
      setIsUploadingReceipt(true);
      const manipResult = await ImageManipulator.manipulateAsync(
        imageUri,
        [{ resize: { width: 1024 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );
      const base64 = await FileSystem.readAsStringAsync(manipResult.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const arrayBuffer = decode(base64);
      const fileExtMatch = manipResult.uri.match(/\.(\w+)$/);
      const fileExt = fileExtMatch ? fileExtMatch[1] : 'jpg';
      const fileName = `${billId}/receipt-${idx + 1}.${fileExt}`;
      const contentType = `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(fileName, arrayBuffer, {
          contentType,
          upsert: true,
        });
      if (uploadError) throw uploadError;
      const { publicUrl } = supabase.storage
        .from('receipts')
        .getPublicUrl(fileName).data;
      return publicUrl;
    } catch (error) {
      console.error('Receipt upload failed:', error);
      Alert.alert('Error', 'Failed to upload receipt image. Please retry ❗️');
      return null;
    } finally {
      setIsUploadingReceipt(false);
    }
  };

  const createBill = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a bill title 🔍');
      return;
    }
    if (items.length === 0) {
      Alert.alert('Error', 'Please add at least one item 🔍');
      return;
    }
    if (dueDate && !validateDueDate(dueDate)) {
      Alert.alert('Error', 'Due date must be today or in the future 🔍');
      return;
    }
    if (!bankDetails.bankName.trim() || !bankDetails.accountName.trim() || !bankDetails.accountNumber.trim()) {
      Alert.alert('Error', 'Please fill in all bank details 🔍');
      return;
    }
    if (!user) {
      Alert.alert('Error', 'You must be logged in to create a bill 🔍');
      return;
    }
    try {
      // 1. Insert bill
      const { data: bill, error: billError } = await supabase
        .from('bills')
        .insert({
          title,
          description,
          total_amount: calculateItemsTotal(),
          created_by: user.id,
          due_date: dueDate || null,
          tag: tag || null,
          bank_name: bankDetails.bankName,
          account_name: bankDetails.accountName,
          account_number: bankDetails.accountNumber,
        })
        .select()
        .single();
      if (billError) throw billError;
      // 2. Insert all participants (creator + selected members)
      const allParticipantIds = [user.id, ...participants.filter(p => p.id !== user.id).map(p => p.id)];
      const { error: participantsError } = await supabase
        .from('bill_participants')
        .insert(
          allParticipantIds.map(userId => ({
            bill_id: bill.id,
            user_id: userId,
          }))
        );
      if (participantsError) throw participantsError;
      // 3. Insert items
      const { data: itemsData, error: itemsError } = await supabase
        .from('bill_items')
        .insert(
          items.map(item => ({
            bill_id: bill.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
          }))
        );
      if (itemsError) throw itemsError;
      // 4. Upload up to 3 receipt images if present
      if (receiptImageUris.length > 0) {
        for (let i = 0; i < receiptImageUris.length; i++) {
          const url = await uploadReceiptImage(receiptImageUris[i], bill.id, i);
          if (url) {
            await supabase.from('bill_receipts').insert({ bill_id: bill.id, url });
          }
        }
      }
      Alert.alert('Bill Created!', 'Your bill has been saved. ✅');
      await refetch();
      router.replace('/(tabs)/' as any);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create bill. Please retry ❗️');
    }
  };

  const isFormValid = () => {
    return title.trim() && 
           items.length > 0 &&
           (!dueDate || validateDueDate(dueDate)) &&
           bankDetails.bankName.trim() &&
           bankDetails.accountName.trim() &&
           bankDetails.accountNumber.trim();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={20} color="#F8FAFC" strokeWidth={2} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Create Bill</Text>
          <Text style={styles.subtitle}>Split expenses with friends</Text>
        </View>
        
        {/* Test Bill Button */}
        <TouchableOpacity style={styles.testButton} onPress={fillTestBill}>
          <TestTube size={18} color="#F59E0B" strokeWidth={2} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Bill Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bill Details</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Bill Title *</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Enter bill title"
              placeholderTextColor="#64748B"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
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
                value={tag}
                onChangeText={setTag}
                placeholder="e.g., Food & Dining, Work, Groceries"
                placeholderTextColor="#64748B"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Due Date</Text>
            <Text style={styles.labelSubtext}>When should participants complete their selections and payments?</Text>
            <View style={styles.inputWithIcon}>
              <Calendar size={18} color="#64748B" strokeWidth={2} />
              <TextInput
                style={[styles.input, styles.inputWithIconText]}
                value={dueDate}
                onChangeText={setDueDate}
                placeholder="YYYY-MM-DD (optional)"
                placeholderTextColor="#64748B"
              />
            </View>
            {dueDate && !validateDueDate(dueDate)? (
              <Text style={styles.errorText}>Due date must be today or in the future</Text>
            ):null}
          </View>
        </View>

        {/* Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Item list</Text>
          
          <View style={styles.addItemContainer}>
            <View style={styles.addItemRow}>
              <TextInput
                style={[styles.input, styles.itemNameInput]}
                value={newItemName}
                onChangeText={setNewItemName}
                placeholder="Item name"
                placeholderTextColor="#64748B"
              />
              <TextInput
                style={[styles.input, styles.itemPriceInput]}
                value={newItemPrice}
                onChangeText={setNewItemPrice}
                placeholder="$0.00"
                placeholderTextColor="#64748B"
                keyboardType="decimal-pad"
              />
              <TextInput
                style={[styles.input, styles.itemQuantityInput]}
                value={newItemQuantity}
                onChangeText={setNewItemQuantity}
                placeholder="Qty"
                placeholderTextColor="#64748B"
                keyboardType="numeric"
              />
              <TouchableOpacity style={styles.addButton} onPress={addItem}>
                <Plus size={18} color="#FFFFFF" strokeWidth={2.5} />
              </TouchableOpacity>
            </View>
          </View>

          {items.map((item) => (
            <View key={item.id} style={styles.itemCard}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                <View style={styles.itemDetails}>
                  <Text style={styles.itemPrice}>{formatCurrency(item.price)} × {item.quantity}</Text>
                  <Text style={styles.itemTotal}>{formatCurrency(item.price * item.quantity)}</Text>
                </View>
              </View>
              <TouchableOpacity 
                style={styles.removeButton} 
                onPress={() => removeItem(item.id)}
              >
                <X size={16} color="#EF4444" strokeWidth={2} />
              </TouchableOpacity>
            </View>
          ))}

          {items.length > 0 && (
            <View style={styles.totalContainer}>
              <Text style={styles.totalLabel}>Items Total: {formatCurrency(calculateItemsTotal())}</Text>
            </View>
          )}
        </View>

        {/* Members */}
        <View style={styles.section}>
          <View style={styles.membersHeader}>
            <Text style={styles.sectionTitle}>Members</Text>
            <TouchableOpacity 
              style={styles.addFromFriendsButton}
              onPress={() => setShowFriendsModal(true)}
            >
              <Users size={16} color="#3B82F6" strokeWidth={2} />
              <Text style={styles.addFromFriendsText}>Invite Members</Text>
            </TouchableOpacity>
          </View>
          
          {participants.map((participant) => (
            <View key={participant.id} style={styles.participantCard}>
              <View style={styles.participantLeft}>
                {participant.avatar && (
                  <Image 
                    source={{ uri: participant.avatar }} 
                    style={styles.participantAvatar}
                  />
                )}
                <View style={styles.participantInfo}>
                  <Text style={styles.participantName}>{participant.name}</Text>
                  <Text style={styles.participantEmail}>{participant.email}</Text>
                </View>
              </View>
              {participant.id !== 'creator' && (
                <TouchableOpacity 
                  style={styles.removeButton} 
                  onPress={() => removeParticipant(participant.id)}
                >
                  <X size={16} color="#EF4444" strokeWidth={2} />
                </TouchableOpacity>
              )}
            </View>
          ))}

          {participants.length === 0 && (
            <View style={styles.noMembersContainer}>
              <Text style={styles.noMembersText}>No friends added yet</Text>
              <Text style={styles.noMembersSubtext}>
                Add friends from your friends list to split this bill
              </Text>
            </View>
          )}
        </View>

        {/* Bank Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bank Details</Text>
          <Text style={styles.sectionSubtitle}>Where members should send payments</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Bank Name *</Text>
            <View style={styles.inputWithIcon}>
              <Building2 size={18} color="#64748B" strokeWidth={2} />
              <TextInput
                style={[styles.input, styles.inputWithIconText]}
                value={bankDetails.bankName}
                onChangeText={(text) => setBankDetails({...bankDetails, bankName: text})}
                placeholder="e.g., Chase Bank, Wells Fargo"
                placeholderTextColor="#64748B"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Account Name *</Text>
            <TextInput
              style={styles.input}
              value={bankDetails.accountName}
              onChangeText={(text) => setBankDetails({...bankDetails, accountName: text})}
              placeholder="Account holder name"
              placeholderTextColor="#64748B"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Account Number *</Text>
            <View style={styles.inputWithIcon}>
              <CreditCard size={18} color="#64748B" strokeWidth={2} />
              <TextInput
                style={[styles.input, styles.inputWithIconText]}
                value={bankDetails.accountNumber}
                onChangeText={(text) => setBankDetails({...bankDetails, accountNumber: text})}
                placeholder="Bank account number"
                placeholderTextColor="#64748B"
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>

        {/* Receipt Images Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Receipt Images (up to 3, optional)</Text>
          <View style={styles.receiptGrid}>
            {receiptImageUris.map((uri, idx) => (
              <View key={uri} style={styles.receiptCard}>
                <Image source={{ uri }} style={styles.receiptImage} />
                <TouchableOpacity
                  style={styles.removeIcon}
                  onPress={() => removeReceiptImage(idx)}
                >
                  <X size={18} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
            {receiptImageUris.length < 3 && (
              <TouchableOpacity style={styles.receiptCard} onPress={pickReceiptImage}>
                <Camera size={32} color="#64748B" />
              </TouchableOpacity>
            )}
          </View>
          {isUploadingReceipt && <ActivityIndicator size="small" color="#3B82F6" style={{ marginTop: 8 }} />}
        </View>
      </ScrollView>

      {/* Create Button */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.createBillButton, !isFormValid() && styles.disabledButton]} 
          onPress={createBill}
          disabled={!isFormValid()}
        >
          <Plus size={18} color="#FFFFFF" strokeWidth={2} />
          <Text style={styles.createBillText}>Create Bill</Text>
        </TouchableOpacity>
      </View>

      {/* Friends Modal */}
      <Modal
        visible={showFriendsModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowFriendsModal(false)}
      >
        <View style={styles.friendsModalOverlay}>
          <View style={styles.friendsModal}>
            <View style={styles.friendsModalHeader}>
              <Text style={styles.friendsModalTitle}>Add Members</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowFriendsModal(false)}
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
            
            <ScrollView style={styles.friendsModalContent} showsVerticalScrollIndicator={false}>
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
                  const isSelected = selectedFriends.includes(friend.id);
                  const isAlreadyAdded = participants.some(p => p.id === friend.id);
                  
                  return (
                    <TouchableOpacity
                      key={friend.id}
                      style={[
                        styles.friendItem,
                        isSelected && styles.selectedFriendItem,
                        isAlreadyAdded && styles.disabledFriendItem
                      ]}
                      onPress={() => !isAlreadyAdded && toggleFriendSelection(friend.id)}
                      disabled={isAlreadyAdded}
                    >
                      <View style={styles.friendItemLeft}>
                        <Image 
                          source={{ uri: friend.avatar }} 
                          style={[styles.friendItemAvatar, isAlreadyAdded && styles.disabledAvatar]}
                        />
                        <View style={styles.friendItemInfo}>
                          <Text style={[styles.friendItemName, isAlreadyAdded && styles.disabledText]}>
                            {friend.name}
                          </Text>
                          <Text style={[styles.friendItemEmail, isAlreadyAdded && styles.disabledText]}>
                            {friend.email}
                          </Text>
                        </View>
                      </View>
                      
                      {isAlreadyAdded ? (
                        <Text style={styles.addedText}>Added</Text>
                      ) : (
                        <View style={[styles.friendCheckbox, isSelected && styles.checkedFriendBox]}>
                          {isSelected && <Check size={14} color="#FFFFFF" strokeWidth={2.5} />}
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
            
            {selectedFriends.length > 0 && (
              <View style={styles.friendsModalFooter}>
                <TouchableOpacity style={styles.addSelectedButton} onPress={addSelectedFriends}>
                  <Text style={styles.addSelectedText}>
                    Add {selectedFriends.length} Member{selectedFriends.length !== 1 ? 's' : ''}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
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
  },
  subtitle: {
    fontSize: 15,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 2,
  },
  testButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F59E0B',
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
  labelSubtext: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 8,
    fontWeight: '500',
    fontStyle: 'italic',
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
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
    fontWeight: '500',
  },
  addItemContainer: {
    marginBottom: 20,
  },
  addItemRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-end',
  },
  itemNameInput: {
    flex: 3,
  },
  itemPriceInput: {
    flex: 2,
  },
  itemQuantityInput: {
    flex: 1,
  },
  addButton: {
    backgroundColor: '#3B82F6',
    width: 48,
    height: 48,
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
  itemCard: {
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
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F8FAFC',
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  itemDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemPrice: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '500',
  },
  itemTotal: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
  },
  removeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#1E293B',
  },
  totalContainer: {
    backgroundColor: '#0F172A',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#10B981',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  membersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
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
  noMembersContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#0F172A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    borderStyle: 'dashed',
  },
  noMembersText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F8FAFC',
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  noMembersSubtext: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 20,
  },
  footer: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  createBillButton: {
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
  disabledButton: {
    backgroundColor: '#475569',
    shadowOpacity: 0,
    elevation: 0,
  },
  createBillText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
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
  receiptUploadBox: {
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    marginTop: 8,
    marginBottom: 8,
  },
  uploadBoxText: {
    color: '#64748B',
    marginTop: 8,
    fontSize: 15,
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
    backgroundColor: 'transparent',
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