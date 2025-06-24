export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          username: string;
          name: string;
          email: string;
          avatar: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username: string;
          name: string;
          email: string;
          avatar?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          name?: string;
          email?: string;
          avatar?: string | null;
          updated_at?: string;
        };
      };
      friend_requests: {
        Row: {
          id: string;
          from_user_id: string;
          to_user_id: string;
          status: 'pending' | 'accepted' | 'declined';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          from_user_id: string;
          to_user_id: string;
          status?: 'pending' | 'accepted' | 'declined';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          status?: 'pending' | 'accepted' | 'declined';
          updated_at?: string;
        };
      };
      friends: {
        Row: {
          id: string;
          user_id: string;
          friend_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          friend_id: string;
          created_at?: string;
        };
        Update: {};
      };
      bills: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          total_amount: number;
          created_by: string;
          status: 'select' | 'pay' | 'closed';
          due_date: string | null;
          tag: string | null;
          bank_name: string;
          account_name: string;
          account_number: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          total_amount: number;
          created_by: string;
          status?: 'select' | 'pay' | 'closed';
          due_date?: string | null;
          tag?: string | null;
          bank_name: string;
          account_name: string;
          account_number: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          description?: string | null;
          total_amount?: number;
          status?: 'select' | 'pay' | 'closed';
          due_date?: string | null;
          tag?: string | null;
          bank_name?: string;
          account_name?: string;
          account_number?: string;
          updated_at?: string;
        };
      };
      bill_participants: {
        Row: {
          id: string;
          bill_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          bill_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: {};
      };
      bill_items: {
        Row: {
          id: string;
          bill_id: string;
          name: string;
          price: number;
          quantity: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          bill_id: string;
          name: string;
          price: number;
          quantity?: number;
          created_at?: string;
        };
        Update: {
          name?: string;
          price?: number;
          quantity?: number;
        };
      };
      bill_item_selections: {
        Row: {
          id: string;
          bill_item_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          bill_item_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: {};
      };
      chat_messages: {
        Row: {
          id: string;
          bill_id: string;
          sender_id: string | null;
          type: 'text' | 'image' | 'payment_slip' | 'system';
          content: string;
          image_url: string | null;
          is_payment_slip: boolean;
          payment_amount: number | null;
          payment_status: 'pending' | 'verified' | 'rejected' | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          bill_id: string;
          sender_id?: string | null;
          type?: 'text' | 'image' | 'payment_slip' | 'system';
          content: string;
          image_url?: string | null;
          is_payment_slip?: boolean;
          payment_amount?: number | null;
          payment_status?: 'pending' | 'verified' | 'rejected' | null;
          created_at?: string;
        };
        Update: {
          payment_status?: 'pending' | 'verified' | 'rejected' | null;
        };
      };
      message_reads: {
        Row: {
          id: string;
          message_id: string;
          user_id: string;
          read_at: string;
        };
        Insert: {
          id?: string;
          message_id: string;
          user_id: string;
          read_at?: string;
        };
        Update: {};
      };
    };
  };
}