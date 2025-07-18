import { Bill, BillItem, UserCost } from '@/types';

export const calculateUserCosts = (bill: Bill): UserCost[] => {
  const userCosts: UserCost[] = [];
  
  bill.participants.forEach(participant => {
    const userItems: BillItem[] = [];
    let userTotal = 0;
    
    bill.items.forEach(item => {
      if (item.selectedBy.includes(participant.id)) {
        const itemTotal = item.price * item.quantity;
        const splitAmount = itemTotal / item.selectedBy.length;
        userItems.push({
          ...item,
          price: splitAmount
        });
        userTotal += splitAmount;
      }
    });
    
    userCosts.push({
      userId: participant.id,
      userName: participant.name,
      items: userItems,
      total: userTotal
    });
  });
  
  return userCosts;
};

export const formatCurrency = (amount: number): string => {
  return `${amount.toFixed(2)}`;
};

export const generateBillCode = (): string => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};