import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ChatMessage, ChatState } from '@/types/chat';
import { useAuth } from './AuthContext';

interface ChatContextType extends ChatState {
  sendMessage: (billId: string, content: string, type?: 'text' | 'image' | 'payment_slip', imageUrl?: string, paymentAmount?: number) => Promise<void>;
  markAsRead: (messageId: string) => Promise<void>;
  verifyPayment: (messageId: string, status: 'verified' | 'rejected') => Promise<void>;
  getMessagesForBill: (billId: string) => ChatMessage[];
  getUnreadCount: (billId: string) => number;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

// Mock chat data
const mockMessages: ChatMessage[] = [
  {
    id: 'msg1',
    billId: '1',
    senderId: 'user1',
    senderName: 'John Doe',
    senderAvatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
    type: 'system',
    content: 'Bill created and shared with participants',
    timestamp: new Date('2024-01-15T10:00:00'),
    readBy: ['user1', 'user2', 'user3'],
  },
  {
    id: 'msg2',
    billId: '1',
    senderId: 'user2',
    senderName: 'Jane Smith',
    senderAvatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
    type: 'text',
    content: 'Thanks for organizing this! I\'ll send my payment shortly.',
    timestamp: new Date('2024-01-15T14:30:00'),
    readBy: ['user1', 'user2'],
  },
  {
    id: 'msg3',
    billId: '1',
    senderId: 'user2',
    senderName: 'Jane Smith',
    senderAvatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
    type: 'payment_slip',
    content: 'Payment sent! Here\'s my payment confirmation.',
    imageUrl: 'https://images.pexels.com/photos/4386431/pexels-photo-4386431.jpeg?auto=compress&cs=tinysrgb&w=400&h=600&dpr=2',
    isPaymentSlip: true,
    paymentAmount: 25.50,
    paymentStatus: 'pending',
    timestamp: new Date('2024-01-15T16:45:00'),
    readBy: ['user2'],
  },
];

export function ChatProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [chatState, setChatState] = useState<ChatState>({
    messages: mockMessages,
    isLoading: false,
  });

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
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));

      const newMessage: ChatMessage = {
        id: `msg_${Date.now()}`,
        billId,
        senderId: user.id,
        senderName: user.name,
        senderAvatar: user.avatar,
        type,
        content,
        imageUrl,
        isPaymentSlip: type === 'payment_slip',
        paymentAmount,
        paymentStatus: type === 'payment_slip' ? 'pending' : undefined,
        timestamp: new Date(),
        readBy: [user.id],
      };

      setChatState(prev => ({
        ...prev,
        messages: [...prev.messages, newMessage],
        isLoading: false,
      }));
    } catch (error) {
      setChatState(prev => ({ 
        ...prev, 
        isLoading: false,
        error: 'Failed to send message'
      }));
    }
  };

  const markAsRead = async (messageId: string) => {
    if (!user) return;

    setChatState(prev => ({
      ...prev,
      messages: prev.messages.map(msg => 
        msg.id === messageId && !msg.readBy.includes(user.id)
          ? { ...msg, readBy: [...msg.readBy, user.id] }
          : msg
      ),
    }));
  };

  const verifyPayment = async (messageId: string, status: 'verified' | 'rejected') => {
    setChatState(prev => ({ ...prev, isLoading: true }));

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

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