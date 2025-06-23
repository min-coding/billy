export interface ChatMessage {
  id: string;
  billId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  type: 'text' | 'image' | 'payment_slip' | 'system';
  content: string;
  imageUrl?: string;
  isPaymentSlip?: boolean;
  paymentAmount?: number;
  paymentStatus?: 'pending' | 'verified' | 'rejected';
  timestamp: Date;
  readBy: string[];
}

export interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  error?: string;
}