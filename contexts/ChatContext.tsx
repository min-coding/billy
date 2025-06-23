import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import type { Database } from '@/types/database';

type ChatMessage = {
  id: string;
  billId: string;
  senderId: string | null;
  senderName: string;
  senderAvatar?: string;
  type: 'text' | 'image' | 'payment_slip' | 'system';
  content: string;
  imageUrl?: string;
  isPaymentSlip: boolean;
  paymentAmount?: number;
  paymentStatus?: 'pending' | 'verified' | 'rejected';
  timestamp: Date;
  readBy: string[];
};

interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  error?: string;
}

interface ChatContextType extends ChatState {
  sendMessage: (billId: string, content: string, type?: 'text' | 'image' | 'payment_slip', imageUrl?: string, paymentAmount?: number) => Promise<void>;
  markAsRead: (messageId: string) => Promise<void>;
  verifyPayment: (messageId: string, status: 'verified' | 'rejected') => Promise<void>;
  getMessagesForBill: (billId: string) => ChatMessage[];
  getUnreadCount: (billId: string) => number;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [chatState, setChatState] = useState<ChatState>({
    messages: [],
    isLoading: false,
  });

  const fetchMessages = async (billId: string) => {
    if (!user) return [];

    try {
      // Fetch messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('chat_messages')
        .select(`
          *,
          users(name, avatar)
        `)
        .eq('bill_id', billId)
        .order('created_at', { ascending: true });

      if (messagesError) throw messagesError;

      // Fetch read status for each message
      const messageIds = messagesData.map(m => m.id);
      const { data: readsData } = await supabase
        .from('message_reads')
        .select('message_id, user_id')
        .in('message_id', messageIds);

      const readsByMessage = readsData?.reduce((acc, read) => {
        if (!acc[read.message_id]) acc[read.message_id] = [];
        acc[read.message_id].push(read.user_id);
        return acc;
      }, {} as Record<string, string[]>) || {};

      const messages: ChatMessage[] = messagesData.map(msg => ({
        id: msg.id,
        billId: msg.bill_id,
        senderId: msg.sender_id,
        senderName: msg.users?.name || 'System',
        senderAvatar: msg.users?.avatar,
        type: msg.type,
        content: msg.content,
        imageUrl: msg.image_url,
        isPaymentSlip: msg.is_payment_slip,
        paymentAmount: msg.payment_amount,
        paymentStatus: msg.payment_status,
        timestamp: new Date(msg.created_at),
        readBy: readsByMessage[msg.id] || [],
      }));

      return messages;
    } catch (err) {
      console.error('Error fetching messages:', err);
      return [];
    }
  };

  const sendMessage = async (
    billId: string, 
    content: string, 
    type: 'text' | 'image' | 'payment_slip' = 'text',
    imageUrl?: string,
    paymentAmount?: number
  ) => {
    if (!user) return;

    setChatState(prev => ({ ...prev, isLoading: true }));

    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          bill_id: billId,
          sender_id: user.id,
          type,
          content,
          image_url: imageUrl,
          is_payment_slip: type === 'payment_slip',
          payment_amount: paymentAmount,
          payment_status: type === 'payment_slip' ? 'pending' : null,
        });

      if (error) throw error;

      // Refresh messages for this bill
      const updatedMessages = await fetchMessages(billId);
      setChatState(prev => ({
        ...prev,
        messages: prev.messages.filter(m => m.billId !== billId).concat(updatedMessages),
        isLoading: false,
      }));
    } catch (error) {
      setChatState(prev => ({ 
        ...prev, 
        isLoading: false,
        error: 'Failed to send message'
      }));
      throw error;
    }
  };

  const markAsRead = async (messageId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('message_reads')
        .upsert({
          message_id: messageId,
          user_id: user.id,
        });

      if (error) throw error;

      // Update local state
      setChatState(prev => ({
        ...prev,
        messages: prev.messages.map(msg => 
          msg.id === messageId && !msg.readBy.includes(user.id)
            ? { ...msg, readBy: [...msg.readBy, user.id] }
            : msg
        ),
      }));
    } catch (err) {
      console.error('Error marking message as read:', err);
    }
  };

  const verifyPayment = async (messageId: string, status: 'verified' | 'rejected') => {
    setChatState(prev => ({ ...prev, isLoading: true }));

    try {
      const { error } = await supabase
        .from('chat_messages')
        .update({ payment_status: status })
        .eq('id', messageId);

      if (error) throw error;

      // Update local state
      setChatState(prev => ({
        ...prev,
        messages: prev.messages.map(msg => 
          msg.id === messageId 
            ? { ...msg, paymentStatus: status }
            : msg
        ),
        isLoading: false,
      }));
    } catch (error) {
      setChatState(prev => ({ 
        ...prev, 
        isLoading: false,
        error: 'Failed to update payment status'
      }));
      throw error;
    }
  };

  const getMessagesForBill = (billId: string) => {
    return chatState.messages
      .filter(msg => msg.billId === billId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  };

  const getUnreadCount = (billId: string) => {
    if (!user) return 0;
    
    return chatState.messages
      .filter(msg => msg.billId === billId && !msg.readBy.includes(user.id))
      .length;
  };

  // Load messages for bills when user changes
  useEffect(() => {
    if (user) {
      // This will be called when bills are loaded to fetch their messages
      setChatState({ messages: [], isLoading: false });
    }
  }, [user]);

  return (
    <ChatContext.Provider
      value={{
        ...chatState,
        sendMessage,
        markAsRead,
        verifyPayment,
        getMessagesForBill,
        getUnreadCount,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}