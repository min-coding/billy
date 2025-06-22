import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, X, Users, Share2, ArrowLeft, DollarSign, CreditCard, Building2 } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { BillItem, User, BankDetails } from '@/types';
import { generateBillCode, formatCurrency } from '@/utils/billUtils';

export default function CreateBillScreen() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [items, setItems] = useState<BillItem[]>([]);
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('1');
  const [participants, setParticipants] = useState<User[]>([
    { id: 'creator', name: 'You', email: 'you@example.com' }
  ]);
  const [newParticipantName, setNewParticipantName] = useState('');
  const [newParticipantEmail, setNewParticipantEmail] = useState('');
  const [bankDetails, setBankDetails] = useState<BankDetails>({
    bankName: '',
    accountName: '',
    accountNumber: ''
  });

  const addItem = () => {
    if (!newItemName.trim() || !newItemPrice.trim() || !newItemQuantity.trim()) {
      Alert.alert('Error', 'Please enter item name, price, and quantity');
      return;
    }

    const price = parseFloat(newItemPrice);
    const quantity = parseInt(newItemQuantity);
    
    if (isNaN(price) || price <= 0) {
      Alert.alert('Error', 'Please enter a valid price');
      return;
    }

    if (isNaN(quantity) || quantity <= 0) {
      Alert.alert('Error', 'Please enter a valid quantity');
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

  const addParticipant = () => {
    if (!newParticipantName.trim() || !newParticipantEmail.trim()) {
      Alert.alert('Error', 'Please enter both name and email');
      return;
    }

    const newParticipant: User = {
      id: Date.now().toString(),
      name: newParticipantName.trim(),
      email: newParticipantEmail.trim(),
    };

    setParticipants([...participants, newParticipant]);
    setNewParticipantName('');
    setNewParticipantEmail('');
  };

  const removeParticipant = (participantId: string) => {
    if (participantId === 'creator') return;
    setParticipants(participants.filter(p => p.id !== participantId));
  };

  const calculateItemsTotal = () => {
    return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const createBill = () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a bill title');
      return;
    }

    if (!totalAmount.trim() || isNaN(parseFloat(totalAmount)) || parseFloat(totalAmount) <= 0) {
      Alert.alert('Error', 'Please enter a valid total amount');
      return;
    }

    if (items.length === 0) {
      Alert.alert('Error', 'Please add at least one item');
      return;
    }

    if (!bankDetails.bankName.trim() || !bankDetails.accountName.trim() || !bankDetails.accountNumber.trim()) {
      Alert.alert('Error', 'Please fill in all bank details');
      return;
    }

    const billCode = generateBillCode();
    Alert.alert(
      'Bill Created!',
      `Your bill "${title}" has been created with code: ${billCode}`,
      [
        {
          text: 'Share Code',
          onPress: () => {
            console.log('Share bill code:', billCode);
          }
        },
        {
          text: 'Done',
          onPress: () => router.push('/(tabs)/'),
          style: 'default'
        }
      ]
    );
  };

  const isFormValid = () => {
    return title.trim() && 
           totalAmount.trim() && 
           !isNaN(parseFloat(totalAmount)) && 
           parseFloat(totalAmount) > 0 &&
           items.length > 0 &&
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
            <Text style={styles.label}>Total Amount *</Text>
            <View style={styles.inputWithIcon}>
              <DollarSign size={18} color="#64748B" strokeWidth={2} />
              <TextInput
                style={[styles.input, styles.inputWithIconText]}
                value={totalAmount}
                onChangeText={setTotalAmount}
                placeholder="0.00"
                placeholderTextColor="#64748B"
                keyboardType="decimal-pad"
              />
            </View>
          </View>
        </View>

        {/* Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Items</Text>
          
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
          <Text style={styles.sectionTitle}>Members</Text>
          
          <View style={styles.addParticipantContainer}>
            <View style={styles.inputGroup}>
              <TextInput
                style={styles.input}
                value={newParticipantName}
                onChangeText={setNewParticipantName}
                placeholder="Member name"
                placeholderTextColor="#64748B"
              />
            </View>
            <View style={styles.inputGroup}>
              <TextInput
                style={styles.input}
                value={newParticipantEmail}
                onChangeText={setNewParticipantEmail}
                placeholder="Email address"
                placeholderTextColor="#64748B"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            <TouchableOpacity style={styles.addParticipantButton} onPress={addParticipant}>
              <Users size={16} color="#3B82F6" strokeWidth={2} />
              <Text style={styles.addParticipantText}>Add Member</Text>
            </TouchableOpacity>
          </View>

          {participants.map((participant) => (
            <View key={participant.id} style={styles.participantCard}>
              <View style={styles.participantInfo}>
                <Text style={styles.participantName}>{participant.name}</Text>
                <Text style={styles.participantEmail}>{participant.email}</Text>
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
      </ScrollView>

      {/* Create Button */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.createBillButton, !isFormValid() && styles.disabledButton]} 
          onPress={createBill}
          disabled={!isFormValid()}
        >
          <Share2 size={18} color="#FFFFFF" strokeWidth={2} />
          <Text style={styles.createBillText}>Create & Share Bill</Text>
        </TouchableOpacity>
      </View>
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
  addParticipantContainer: {
    marginBottom: 20,
  },
  addParticipantButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3B82F6',
    gap: 8,
  },
  addParticipantText: {
    color: '#3B82F6',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
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
});