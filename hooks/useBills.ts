import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { Database } from '@/types/database';

type Bill = Database['public']['Tables']['bills']['Row'] & {
  participants: Array<{
    id: string;
    name: string;
    email: string;
    avatar?: string;
  }>;
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    selectedBy: string[];
  }>;
  bankDetails: {
    bankName: string;
    accountName: string;
    accountNumber: string;
  };
};

export function useBills() {
  const { user } = useAuth();
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBills = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch bills created by the user
      const { data: createdBills, error: createdBillsError } = await supabase
        .from('bills')
        .select(`
          *,
          users!bills_created_by_fkey(id, name, email, avatar)
        `)
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });

      if (createdBillsError) throw createdBillsError;

      // First, get bill IDs where user is a participant
      const { data: participantData, error: participantError } = await supabase
        .from('bill_participants')
        .select('bill_id')
        .eq('user_id', user.id);

      if (participantError) throw participantError;

      const participantBillIds = participantData?.map(p => p.bill_id) || [];

      // Then fetch the actual bills using the bill IDs
      let participantBills: any[] = [];
      if (participantBillIds.length > 0) {
        const { data: participantBillsData, error: participantBillsError } = await supabase
          .from('bills')
          .select(`
            *,
            users!bills_created_by_fkey(id, name, email, avatar)
          `)
          .in('id', participantBillIds)
          .order('created_at', { ascending: false });

        if (participantBillsError) throw participantBillsError;
        participantBills = participantBillsData || [];
      }

      // Combine and deduplicate bills
      const allBills = [...(createdBills || []), ...participantBills];
      const uniqueBills = allBills.filter((bill, index, self) => 
        index === self.findIndex(b => b.id === bill.id)
      );

      // Fetch detailed data for each bill
      const billsWithDetails = await Promise.all(
        uniqueBills.map(async (bill) => {
          // Fetch participants
          const { data: participantsData } = await supabase
            .from('bill_participants')
            .select(`
              users(id, name, email, avatar)
            `)
            .eq('bill_id', bill.id);

          // Fetch items with selections
          const { data: itemsData } = await supabase
            .from('bill_items')
            .select(`
              *,
              bill_item_selections(user_id)
            `)
            .eq('bill_id', bill.id);

          const participants = participantsData?.map(p => p.users).filter(Boolean) || [];
          const items = itemsData?.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            selectedBy: item.bill_item_selections?.map(s => s.user_id) || [],
          })) || [];

          return {
            ...bill,
            participants,
            items,
            bankDetails: {
              bankName: bill.bank_name,
              accountName: bill.account_name,
              accountNumber: bill.account_number,
            },
          };
        })
      );

      // Sort by created_at descending
      billsWithDetails.sort((a, b) => 
        new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      );

      setBills(billsWithDetails);
    } catch (err) {
      console.error('Error fetching bills:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch bills');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
  }, [user]);

  const createBill = async (billData: {
    title: string;
    description?: string;
    totalAmount: number;
    dueDate?: string;
    tag?: string;
    bankName: string;
    accountName: string;
    accountNumber: string;
    items: Array<{
      name: string;
      price: number;
      quantity: number;
    }>;
    participantIds: string[];
  }) => {
    if (!user) throw new Error('User not authenticated');

    try {
      // Create bill
      const { data: bill, error: billError } = await supabase
        .from('bills')
        .insert({
          title: billData.title,
          description: billData.description,
          total_amount: billData.totalAmount,
          created_by: user.id,
          due_date: billData.dueDate,
          tag: billData.tag,
          bank_name: billData.bankName,
          account_name: billData.accountName,
          account_number: billData.accountNumber,
        })
        .select()
        .single();

      if (billError) throw billError;

      // Add participants (including creator)
      const allParticipantIds = [user.id, ...billData.participantIds.filter(id => id !== user.id)];
      const { error: participantsError } = await supabase
        .from('bill_participants')
        .insert(
          allParticipantIds.map(userId => ({
            bill_id: bill.id,
            user_id: userId,
          }))
        );

      if (participantsError) throw participantsError;

      // Add items
      const { error: itemsError } = await supabase
        .from('bill_items')
        .insert(
          billData.items.map(item => ({
            bill_id: bill.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
          }))
        );

      if (itemsError) throw itemsError;

      // Refresh bills
      await fetchBills();

      return bill.id;
    } catch (err) {
      console.error('Error creating bill:', err);
      throw err;
    }
  };

  const updateBillStatus = async (billId: string, status: 'select' | 'pay' | 'closed') => {
    try {
      const { error } = await supabase
        .from('bills')
        .update({ status })
        .eq('id', billId);

      if (error) throw error;

      // Refresh bills
      await fetchBills();
    } catch (err) {
      console.error('Error updating bill status:', err);
      throw err;
    }
  };

  const toggleItemSelection = async (billItemId: string, selected: boolean) => {
    if (!user) return;

    try {
      if (selected) {
        // Add selection
        const { error } = await supabase
          .from('bill_item_selections')
          .insert({
            bill_item_id: billItemId,
            user_id: user.id,
          });

        if (error) throw error;
      } else {
        // Remove selection
        const { error } = await supabase
          .from('bill_item_selections')
          .delete()
          .eq('bill_item_id', billItemId)
          .eq('user_id', user.id);

        if (error) throw error;
      }

      // Refresh bills
      await fetchBills();
    } catch (err) {
      console.error('Error toggling item selection:', err);
      throw err;
    }
  };

  return {
    bills,
    loading,
    error,
    createBill,
    updateBillStatus,
    toggleItemSelection,
    refetch: fetchBills,
  };
}