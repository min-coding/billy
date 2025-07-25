import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Image, Alert, Modal, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Send, Camera, Image as ImageIcon, Check, X, Clock, Shield, MessageCircle, Upload } from 'lucide-react-native';
import { useChat } from '@/contexts/ChatContext';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency } from '@/utils/billUtils';
import { supabase } from '@/lib/supabase';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import { decode } from 'base64-arraybuffer';

export default function BillChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { sendMessage, markAsRead, verifyPayment, isLoading, setBillSubscription, filterMessagesForBill, fetchMessagesForBill } = useChat();
  
  const [messageText, setMessageText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedMessageImage, setSelectedMessageImage] = useState<string | null>(null);
  const [bill, setBill] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPickingImage, setIsPickingImage] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  
  const scrollViewRef = useRef<ScrollView>(null);
  
  useEffect(() => {
    const fetchBill = async () => {
      setLoading(true);
      setError(null);
      // Fetch bill
      const { data: billData, error: billError } = await supabase
        .from('bills')
        .select('*')
        .eq('id', id)
        .single();
      if (billError) {
        setError('Bill not found');
        setBill(null);
        setLoading(false);
        return;
      }
      // Fetch participants
      const { data: participantsData, error: participantsError } = await supabase
        .from('bill_participants')
        .select('user_id, payment_status, users(name)')
        .eq('bill_id', id);
      if (participantsError) {
        setError('Failed to fetch participants');
        setBill(null);
        setLoading(false);
        return;
      }
      // Attach participants to bill
      billData.participants = participantsData.map((p) => ({
        ...p,
        name: (p.users && typeof p.users === 'object' && 'name' in p.users) ? p.users.name : '',
      }));
      setBill(billData);
      setLoading(false);
    };
    if (id) fetchBill();
  }, [id]);

  const messages = filterMessagesForBill(bill?.id || '');
  const isHost = bill?.created_by === user?.id;

  useEffect(() => {
    // Mark messages as read when viewing chat
    messages.forEach(msg => {
      if (!msg.readBy.includes(user?.id || '')) {
        markAsRead(msg.id);
      }
    });
  }, [messages, user?.id]);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages.length]);

  useEffect(() => {
    if (bill?.id) {
      setBillSubscription(bill.id);
      fetchMessagesForBill(bill.id);
    }
  }, [bill?.id]);

  // Upload image to Supabase Storage
  const uploadImageToSupabase = async (imageUri: string): Promise<string | null> => {
    if (!user || !bill) return null;

    try {
      setIsUploadingImage(true);

      // Manipulate image to reduce size
      const manipResult = await ImageManipulator.manipulateAsync(
        imageUri,
        [{ resize: { width: 1024 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );

      // Read image as base64
      const base64 = await FileSystem.readAsStringAsync(manipResult.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Convert to ArrayBuffer
      const arrayBuffer = decode(base64);

      // Generate unique filename
      const timestamp = Date.now();
      const fileExt = 'jpg'; // We're converting to JPEG
      const fileName = `${bill.id}/message_${timestamp}.${fileExt}`;
      const contentType = 'image/jpeg';

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('chat-images')
        .upload(fileName, arrayBuffer, {
          contentType,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error('Failed to upload image');
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('chat-images')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Image upload failed:', error);
      if (Platform.OS === 'web') {
        window.alert('Failed to upload image. Please try again. ❗️');
      } else {
        Alert.alert('Error', 'Failed to upload image. Please try again. ❗️');
      }
      return null;
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() && !selectedImage) return;

    try {
      let imageUrl: string | undefined;

      // Upload image if selected
      if (selectedImage) {
        imageUrl = await uploadImageToSupabase(selectedImage);
        if (!imageUrl) {
          // Upload failed, don't send message
          return;
        }
      }

      // Determine message type and content
      const messageContent = messageText.trim() || (selectedImage ? 'Image' : '');
      const messageType = selectedImage 
        ? (paymentAmount ? 'payment_slip' : 'image')
        : 'text';
      const amount = paymentAmount ? parseFloat(paymentAmount) : undefined;

      // Send message
      await sendMessage(
        bill.id,
        messageContent,
        messageType,
        imageUrl,
        amount
      );
      
      // Reset form
      setMessageText('');
      setSelectedImage(null);
      setPaymentAmount('');
    } catch (error) {
      console.error('Send message error:', error);
      if (Platform.OS === 'web') {
        window.alert('Failed to send message. Please retry ❗️');
      } else {
        Alert.alert('Error', 'Failed to send message. Please retry ❗️');
      }
    }
  };

  const handleImagePicker = async () => {
    try {
      setIsPickingImage(true);

      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        if (Platform.OS === 'web') {
          window.alert('Camera roll permission is needed to select images. 📷');
        } else {
          Alert.alert('Permission Required', 'Camera roll permission is needed to select images. 📷');
        }
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
      });

      if (result.canceled || !result.assets?.length) {
        return;
      }

      // Set selected image
      setSelectedImage(result.assets[0].uri);
    } catch (error) {
      console.error('Error picking image:', error);
      if (Platform.OS === 'web') {
        window.alert('Unable to select image. Please try again. ❗️');
      } else {
        Alert.alert('Error', 'Unable to select image. Please try again. ❗️');
      }
    } finally {
      setIsPickingImage(false);
    }
  };

  const handleVerifyPayment = (messageId: string, status: 'verified' | 'rejected') => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(
        `Are you sure you want to ${status === 'verified' ? 'verify' : 'reject'} this payment? 📩`
      );
      if (confirmed) verifyPayment(messageId, status);
    } else {
      Alert.alert(
        status === 'verified' ? 'Verify Payment' : 'Reject Payment',
        `Are you sure you want to ${status === 'verified' ? 'verify' : 'reject'} this payment? 📩`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: status === 'verified' ? 'Verify' : 'Reject',
            style: status === 'verified' ? 'default' : 'destructive',
            onPress: () => verifyPayment(messageId, status)
          }
        ]
      );
    }
  };

  const openImageModal = (imageUrl: string) => {
    setSelectedMessageImage(imageUrl);
    setShowImageModal(true);
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'verified': return <Check size={14} color="#10B981" strokeWidth={2} />;
      case 'rejected': return <X size={14} color="#EF4444" strokeWidth={2} />;
      case 'pending': return <Clock size={14} color="#F59E0B" strokeWidth={2} />;
      default: return null;
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'verified': return '#10B981';
      case 'rejected': return '#EF4444';
      case 'pending': return '#F59E0B';
      default: return '#64748B';
    }
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const messageDate = new Date(date);
    
    if (messageDate.toDateString() === today.toDateString()) {
      return 'Today';
    }
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    
    return messageDate.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Helper to get participant payment status (copied from bill detail)
  const getParticipantStatus = (participantId: string) => {
    if (!bill || !bill.participants) return 'unpaid';
    if (bill.status?.toString() === 'select') return 'pending';
    if (bill.status?.toString() === 'pay') {
      const participant = bill.participants?.find((p: any) => p.user_id === participantId);
      return participant?.payment_status ?? 'unpaid';
    }
    return 'completed';
  };

  const handlePaidInCash = async () => {
    if (!user || !bill) return;

    const confirmPaidInCash = () => {
      if (Platform.OS === 'web') {
        const confirmed = window.confirm(
          `Are you sure you want to mark your payment as "Paid in Cash"?\n\nThis will notify the bill host that you have paid your share in cash and they will need to verify this payment. 💰`
        );
        if (confirmed) {
          processPaidInCash();
        }
      } else {
        Alert.alert(
          'Mark as Paid in Cash',
          'Are you sure you want to mark your payment as "Paid in Cash"?\n\nThis will notify the bill host that you have paid your share in cash and they will need to verify this payment. 💰',
          [
            {
              text: 'Cancel',
              style: 'cancel',
            },
            {
              text: 'Confirm',
              style: 'default',
              onPress: processPaidInCash,
            },
          ]
        );
      }
    };

    const processPaidInCash = async () => {
      try {
        await supabase
          .from('bill_participants')
          .update({ payment_status: 'paid' })
          .eq('bill_id', bill.id)
          .eq('user_id', user.id);
        
        // Send a system message to chat
        await sendMessage(bill.id, `${user.name || 'A member'} marked as paid (cash).`, 'text');
        
        if (Platform.OS === 'web') {
          window.alert('Marked as paid (cash) ✅');
        } else {
          Alert.alert('Success', 'Marked as paid (cash) ✅');
        }
      } catch (err) {
        if (Platform.OS === 'web') {
          window.alert('Failed to mark as paid (cash). Please retry ❗️');
        } else {
          Alert.alert('Error', 'Failed to mark as paid (cash). Please retry ❗️');
        }
      }
    };

    confirmPaidInCash();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#F59E0B" style={{ marginTop: 50 }} />
      </SafeAreaView>
    );
  }

  if (error || !bill || !user) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={20} color="#F8FAFC" strokeWidth={2} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <View style={styles.headerIcon}>
            <MessageCircle size={20} color="#F59E0B" strokeWidth={2} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Bill Chat</Text>
            <Text style={styles.headerSubtitle}>{bill.title}</Text>
          </View>
        </View>
        {/* Paid in Cash button for members who are not paid/verified */}
        {bill.status === 'pay' && getParticipantStatus(user.id) !== 'paid' && getParticipantStatus(user.id) !== 'verified' && (
          <TouchableOpacity
            style={{
              backgroundColor: '#F59E0B',
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 8,
              marginLeft: 8,
              alignItems: 'center',
              justifyContent: 'center',
              height: 40,
              alignSelf: 'center',
            }}
            onPress={handlePaidInCash}
          >
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>Paid in Cash</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Messages */}
      <ScrollView 
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.length === 0 ? (
          // Empty State
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Upload size={32} color="#F59E0B" strokeWidth={2} />
            </View>
            <Text style={styles.emptyTitle}>No messages yet</Text>
            <Text style={styles.emptyDescription}>
              Send your payment slip for the host to verify your payment here! 📩 💸
            </Text>
            <TouchableOpacity style={styles.emptyButton} onPress={handleImagePicker}>
              <Camera size={16} color="#F59E0B" strokeWidth={2} />
              <Text style={styles.emptyButtonText}>Upload Payment Slip</Text>
            </TouchableOpacity>
          </View>
        ) : (
          messages.map((message, index) => {
            const isOwnMessage = message?.senderId === user.id;
            const showDate = index === 0 || 
              formatDate(message?.timestamp ?? '') !== formatDate(messages[index - 1]?.timestamp ?? '');

            return (
              <View key={message.id}>
                {/* Date Separator */}
                {showDate && (
                  <View style={styles.dateSeparator}>
                    <Text style={styles.dateText}>{formatDate(message?.timestamp ?? '')}</Text>
                  </View>
                )}

                {/* Message */}
                <View style={[
                  styles.messageContainer,
                  isOwnMessage ? styles.ownMessage : styles.otherMessage
                ]}>
                  {/* Avatar for other messages */}
                  {!isOwnMessage && (
                    <View style={styles.avatarContainer}>
                      {message?.senderAvatar ? (
                        <Image source={{ uri: message.senderAvatar }} style={styles.avatar} />
                      ) : (
                        <View style={styles.avatarPlaceholder}>
                          <Text style={styles.avatarText}>
                            {((message?.senderName || '?')[0]).toUpperCase()}
                          </Text>
                        </View>
                      )}
                    </View>
                  )}

                  <View style={[
                    styles.messageBubble,
                    isOwnMessage ? styles.ownBubble : styles.otherBubble,
                    message?.type === 'system' && styles.systemBubble
                  ]}>
                    {/* Sender name for other messages */}
                    {!isOwnMessage && message?.type !== 'system' && (
                      <Text style={styles.senderName}>{message?.senderName}</Text>
                    )}

                    {/* System message */}
                    {message?.type === 'system' && (
                      <View style={styles.systemMessage}>
                        <Shield size={14} color="#64748B" strokeWidth={2} />
                        <Text style={styles.systemText}>{message?.content}</Text>
                      </View>
                    )}

                    {/* Regular message */}
                    {message?.type === 'text' && (
                      <Text style={[
                        styles.messageText,
                        isOwnMessage ? styles.ownMessageText : styles.otherMessageText
                      ]}>
                        {message?.content}
                      </Text>
                    )}

                    {/* Image/Payment slip message */}
                    {(message?.type === 'image' || message?.type === 'payment_slip') && (
                      <View style={styles.imageMessage}>
                        {message?.content && message.content !== 'Image' && (
                          <Text style={[
                            styles.messageText,
                            isOwnMessage ? styles.ownMessageText : styles.otherMessageText,
                            styles.imageMessageText
                          ]}>
                            {message?.content}
                          </Text>
                        )}
                        
                        <TouchableOpacity 
                          style={styles.imageContainer}
                          onPress={() => message?.imageUrl && openImageModal(message.imageUrl)}
                        >
                          <Image source={{ uri: message?.imageUrl }} style={styles.messageImage} />
                          
                          {/* Payment slip overlay */}
                          {message?.isPaymentSlip && (
                            <View style={styles.paymentOverlay}>
                              <View style={styles.paymentInfo}>
                                <Text style={styles.paymentLabel}>Payment Slip</Text>
                                {message?.paymentAmount && (
                                  <Text style={styles.paymentAmount}>
                                    {formatCurrency(message.paymentAmount)}
                                  </Text>
                                )}
                              </View>
                              
                              <View style={[
                                styles.paymentStatus,
                                { backgroundColor: getStatusColor(message.paymentStatus) }
                              ]}>
                                {getStatusIcon(message.paymentStatus)}
                                <Text style={styles.paymentStatusText}>
                                  {message.paymentStatus?.charAt(0).toUpperCase() + 
                                   message.paymentStatus?.slice(1) || 'Pending'}
                                </Text>
                              </View>
                            </View>
                          )}
                        </TouchableOpacity>

                        {/* Host verification buttons */}
                        {message?.isPaymentSlip && 
                         message.paymentStatus === 'pending' && 
                         isHost && 
                         !isOwnMessage && (
                          <View style={styles.verificationButtons}>
                            <TouchableOpacity 
                              style={styles.rejectButton}
                              onPress={() => handleVerifyPayment(message.id, 'rejected')}
                              disabled={isLoading}
                            >
                              <X size={16} color="#FFFFFF" strokeWidth={2} />
                              <Text style={styles.rejectButtonText}>Reject</Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity 
                              style={styles.verifyButton}
                              onPress={() => handleVerifyPayment(message.id, 'verified')}
                              disabled={isLoading}
                            >
                              <Check size={16} color="#FFFFFF" strokeWidth={2} />
                              <Text style={styles.verifyButtonText}>Verify</Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    )}

                    {/* Timestamp */}
                    {message?.type !== 'system' && (
                      <Text style={[
                        styles.timestamp,
                        isOwnMessage ? styles.ownTimestamp : styles.otherTimestamp
                      ]}>
                        {formatTime(message?.timestamp ?? new Date())}
                      </Text>
                    )}

                    {/* Verify button for cash payment system message */}
                    {message?.type === 'text' &&
                     message?.content?.includes('marked as paid (cash)') &&
                     isHost &&
                     bill &&
                     bill.participants && (() => {
                        const paidParticipant = bill.participants.find(
                          (p: any) =>
                            p.payment_status === 'paid' &&
                            message.content.toLowerCase().includes(p.name.toLowerCase())
                        );
                        if (paidParticipant && paidParticipant.user_id && paidParticipant.name) {
                          return (
                            <View style={[styles.verificationButtons, { marginTop: 12 }]}>
                              <TouchableOpacity
                                style={styles.rejectButton}
                                onPress={() => handleVerifyPayment(message.id, 'rejected')}
                                disabled={isLoading}
                              >
                                <X size={16} color="#FFFFFF" strokeWidth={2} />
                                <Text style={styles.rejectButtonText}>Reject</Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={styles.verifyButton}
                                onPress={() => handleVerifyPayment(message.id, 'verified')}
                                disabled={isLoading}
                              >
                                <Check size={16} color="#FFFFFF" strokeWidth={2} />
                                <Text style={styles.verifyButtonText}>Verify</Text>
                              </TouchableOpacity>
                            </View>
                          );
                        }
                        return null;
                      })()}
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Image Preview */}
      {selectedImage && (
        <View style={styles.imagePreview}>
          <Image source={{ uri: selectedImage }} style={styles.previewImage} />
          <TouchableOpacity 
            style={styles.removeImageButton}
            onPress={() => {
              setSelectedImage(null);
              setPaymentAmount('');
            }}
          >
            <X size={16} color="#FFFFFF" strokeWidth={2} />
          </TouchableOpacity>
          
          {/* Payment amount input for payment slips */}
          <View style={styles.paymentAmountContainer}>
            <Text style={styles.paymentAmountLabel}>Payment Amount (optional)</Text>
            <TextInput
              style={styles.paymentAmountInput}
              value={paymentAmount}
              onChangeText={setPaymentAmount}
              placeholder="0.00"
              placeholderTextColor="#64748B"
              keyboardType="decimal-pad"
            />
          </View>
        </View>
      )}

      {/* Input Area */}
      <View style={styles.inputContainer}>
        <View style={styles.inputRow}>
          <TouchableOpacity 
            style={[styles.imageButton, isPickingImage && styles.disabledButton]} 
            onPress={handleImagePicker}
            disabled={isPickingImage || isUploadingImage}
          >
            {isPickingImage ? (
              <ActivityIndicator size={16} color="#64748B" />
            ) : (
              <Camera size={20} color="#64748B" strokeWidth={2} />
            )}
          </TouchableOpacity>
          
          <TextInput
            style={styles.textInput}
            value={messageText}
            onChangeText={setMessageText}
            placeholder="Type a message..."
            placeholderTextColor="#64748B"
            multiline
            maxLength={500}
            editable={!isUploadingImage}
          />
          
          <TouchableOpacity 
            style={[
              styles.sendButton,
              (messageText.trim() || selectedImage) && styles.sendButtonActive,
              isUploadingImage && styles.disabledButton
            ]}
            onPress={handleSendMessage}
            disabled={(!messageText.trim() && !selectedImage) || isLoading || isUploadingImage}
          >
            {isUploadingImage ? (
              <ActivityIndicator size={16} color="#FFFFFF" />
            ) : (
              <Send size={18} color="#FFFFFF" strokeWidth={2} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Image Modal */}
      <Modal
        visible={showImageModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowImageModal(false)}
      >
        <View style={styles.imageModalOverlay}>
          <TouchableOpacity 
            style={styles.imageModalBackground}
            activeOpacity={1}
            onPress={() => setShowImageModal(false)}
          >
            <View style={styles.imageModalContent}>
              <TouchableOpacity 
                style={styles.imageModalClose}
                onPress={() => setShowImageModal(false)}
              >
                <X size={24} color="#FFFFFF" strokeWidth={2} />
              </TouchableOpacity>
              
              {selectedMessageImage && (
                <Image 
                  source={{ uri: selectedMessageImage }} 
                  style={styles.fullScreenImage}
                  resizeMode="contain"
                />
              )}
            </View>
          </TouchableOpacity>
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
    paddingVertical: 16,
    backgroundColor: '#1E293B',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F8FAFC',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '500',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    flexGrow: 1,
    paddingVertical: 16,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 80,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#334155',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#F8FAFC',
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  emptyDescription: {
    fontSize: 16,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
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
    borderColor: '#F59E0B',
    gap: 8,
  },
  emptyButtonText: {
    color: '#F59E0B',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  dateSeparator: {
    alignItems: 'center',
    marginVertical: 16,
  },
  dateText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  messageContainer: {
    flexDirection: 'row',
    marginVertical: 4,
    paddingHorizontal: 16,
  },
  ownMessage: {
    justifyContent: 'flex-end',
  },
  otherMessage: {
    justifyContent: 'flex-start',
  },
  avatarContainer: {
    marginRight: 8,
    marginTop: 4,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  messageBubble: {
    maxWidth: '75%',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  ownBubble: {
    backgroundColor: '#F59E0B',
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: '#1E293B',
    borderBottomLeftRadius: 4,
  },
  systemBubble: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    alignSelf: 'center',
    maxWidth: '90%',
  },
  senderName: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
    marginBottom: 4,
  },
  systemMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  systemText: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '500',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '500',
  },
  ownMessageText: {
    color: '#FFFFFF',
  },
  otherMessageText: {
    color: '#F8FAFC',
  },
  imageMessage: {
    gap: 8,
  },
  imageMessageText: {
    marginBottom: 4,
  },
  imageContainer: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  messageImage: {
    width: 200,
    height: 150,
    borderRadius: 12,
  },
  paymentOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentInfo: {
    flex: 1,
  },
  paymentLabel: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
    marginBottom: 2,
  },
  paymentAmount: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '700',
  },
  paymentStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  paymentStatusText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  verificationButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  rejectButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  verifyButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  verifyButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  timestamp: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 4,
  },
  ownTimestamp: {
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'right',
  },
  otherTimestamp: {
    color: '#64748B',
  },
  imagePreview: {
    backgroundColor: '#1E293B',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  previewImage: {
    width: 100,
    height: 75,
    borderRadius: 8,
    marginBottom: 12,
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentAmountContainer: {
    gap: 8,
  },
  paymentAmountLabel: {
    fontSize: 14,
    color: '#CBD5E1',
    fontWeight: '600',
  },
  paymentAmountInput: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    color: '#F8FAFC',
    fontWeight: '500',
  },
  inputContainer: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  imageButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  disabledButton: {
    opacity: 0.5,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#F8FAFC',
    fontWeight: '500',
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#475569',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonActive: {
    backgroundColor: '#F59E0B',
  },
  imageModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  imageModalBackground: {
    flex: 1,
  },
  imageModalContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  imageModalClose: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  fullScreenImage: {
    width: '100%',
    height: '100%',
  },
});