import React, { createContext, useContext, useState, useEffect, ReactNode, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';

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
  setBillSubscription: (billId: string) => void;
  filterMessagesForBill: (billId: string) => ChatMessage[];
  getUnreadCount: (billId: string) => number;
  fetchMessagesForBill: (billId: string) => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [chatState, setChatState] = useState<ChatState>({
    messages: [],
    isLoading: false,
  });
  const currentBillIdRef = useRef<string | null>(null);
  const [subscribedBillId, setSubscribedBillId] = useState<string | null>(null);

  const fetchMessages = useCallback(async (billId: string) => {
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
  }, [user]);

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
        .upsert(
          {
            message_id: messageId,
            user_id: user.id,
          },
          { onConflict: 'message_id,user_id' }
        );

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
      // 1. Update the chat message status and get sender_id and bill_id
      const { data: messageData, error: messageError } = await supabase
        .from('chat_messages')
        .update({ payment_status: status })
        .eq('id', messageId)
        .select('sender_id, bill_id')
        .single();

      if (messageError) throw messageError;

      // 2. Update the participant's payment status
      if (messageData?.sender_id && messageData?.bill_id) {
        await supabase
          .from('bill_participants')
          .update({ payment_status: status === 'verified'?'verified':'unpaid'})
          .eq('bill_id', messageData.bill_id)
          .eq('user_id', messageData.sender_id);
      }

      // 3. Update local state as before
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

  const setBillSubscription = (billId: string) => {
    currentBillIdRef.current = billId;
    setSubscribedBillId(billId);
  };

  const filterMessagesForBill = (billId: string) => {
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

  const fetchMessagesForBill = async (billId: string) => {
    setChatState(prev => ({ ...prev, isLoading: true }));
    const updatedMessages = await fetchMessages(billId);
    setChatState(prev => ({
      ...prev,
      messages: prev.messages.filter(m => m.billId !== billId).concat(updatedMessages),
      isLoading: false,
    }));
  };

  // Load messages for bills when user changes
  useEffect(() => {
    if (user) {
      // This will be called when bills are loaded to fetch their messages
      setChatState({ messages: [], isLoading: false });
    }
  }, [user]);

  // Polling-based chat messages (reliable fallback)
  useEffect(() => {
    if (!user || !subscribedBillId) return;
    
    console.log(' Setting up polling for bill:', subscribedBillId);
    
    // Poll every 5 seconds for new messages
    const pollInterval = setInterval(async () => {
      console.log('⏰ Polling for new messages...');
      const updatedMessages = await fetchMessages(subscribedBillId);
      setChatState(prev => {
        const currentMessages = prev.messages.filter(m => m.billId === subscribedBillId);
        if (currentMessages.length !== updatedMessages.length) {
          console.log('🔄 Polling detected new messages!');
          return {
            ...prev,
            messages: prev.messages.filter(m => m.billId !== subscribedBillId).concat(updatedMessages),
          };
        }
        return prev;
      });
    }, 3000); // 5 seconds is a good balance between responsiveness and efficiency
      
    return () => {
      console.log('🧹 Cleaning up polling for bill:', subscribedBillId);
      clearInterval(pollInterval);
    };
  }, [user, subscribedBillId, fetchMessages]);

  return (
    <ChatContext.Provider
      value={{
        ...chatState,
        sendMessage,
        markAsRead,
        verifyPayment,
        setBillSubscription,
        filterMessagesForBill,
        getUnreadCount,
        fetchMessagesForBill,
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