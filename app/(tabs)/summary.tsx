import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChartBar as BarChart, DollarSign, Users, User, ArrowUpRight, ArrowDownLeft, TrendingUp, TrendingDown, Receipt, UserCheck } from 'lucide-react-native';
import { Bill, UserCost, Friend } from '@/types';
import { calculateUserCosts, formatCurrency } from '@/utils/billUtils';

// Mock data - same as in index.tsx for consistency
const mockBills: Bill[] = [
  {
    id: '1',
    title: 'Dinner at Tony\'s',
    description: 'Italian restaurant with the team',
    totalAmount: 120.00,
    bankAccountNumber: '1234567890',
    createdBy: 'user1',
    createdAt: new Date('2024-01-15'),
    dueDate: new Date('2024-01-25'),
    participants: [
      { id: 'user1', name: 'John Doe', email: 'john@example.com' },
      { id: 'user2', name: 'Jane Smith', email: 'jane@example.com' },
      { id: 'user3', name: 'Mike Johnson', email: 'mike@example.com' },
    ],
    items: [
      { id: 'item1', name: 'Margherita Pizza', price: 18.99, quantity: 1, selectedBy: ['user1', 'user2'] },
      { id: 'item2', name: 'Caesar Salad', price: 12.50, quantity: 2, selectedBy: ['user2'] },
      { id: 'item3', name: 'Pasta Carbonara', price: 16.75, quantity: 1, selectedBy: ['user3'] },
      { id: 'item4', name: 'Tiramisu', price: 8.99, quantity: 3, selectedBy: ['user1', 'user2', 'user3'] },
    ],
    bankDetails: {
      bankName: 'Chase Bank',
      accountName: 'John Doe',
      accountNumber: '1234567890'
    },
    status: 'select',
    total: 83.22,
  },
  {
    id: '2',
    title: 'Weekend Groceries',
    description: 'Shared groceries for the house',
    totalAmount: 45.50,
    bankAccountNumber: '0987654321',
    createdBy: 'user1',
    createdAt: new Date('2024-01-12'),
    dueDate: new Date('2024-01-20'),
    participants: [
      { id: 'user1', name: 'John Doe', email: 'john@example.com' },
      { id: 'user4', name: 'Sarah Wilson', email: 'sarah@example.com' },
    ],
    items: [
      { id: 'item5', name: 'Milk', price: 4.99, quantity: 2, selectedBy: ['user1', 'user4'] },
      { id: 'item6', name: 'Bread', price: 3.50, quantity: 1, selectedBy: ['user1', 'user4'] },
      { id: 'item7', name: 'Eggs', price: 5.99, quantity: 1, selectedBy: ['user1'] },
    ],
    bankDetails: {
      bankName: 'Bank of America',
      accountName: 'John Doe',
      accountNumber: '0987654321'
    },
    status: 'pay',
    total: 14.48,
  },
  {
    id: '3',
    title: 'Movie Night Snacks',
    totalAmount: 25.00,
    bankAccountNumber: '1122334455',
    createdBy: 'user2',
    createdAt: new Date('2024-01-10'),
    dueDate: new Date('2024-01-18'),
    participants: [
      { id: 'user1', name: 'John Doe', email: 'john@example.com' },
      { id: 'user2', name: 'Jane Smith', email: 'jane@example.com' },
    ],
    items: [
      { id: 'item8', name: 'Popcorn', price: 6.99, quantity: 2, selectedBy: ['user1', 'user2'] },
      { id: 'item9', name: 'Soda Pack', price: 8.99, quantity: 1, selectedBy: ['user1', 'user2'] },
    ],
    bankDetails: {
      bankName: 'Wells Fargo',
      accountName: 'Jane Smith',
      accountNumber: '1122334455'
    },
    status: 'closed',
    total: 15.98,
  },
  {
    id: '4',
    title: 'Office Lunch Order',
    description: 'Team lunch from local deli',
    totalAmount: 85.00,
    bankAccountNumber: '5566778899',
    createdBy: 'user1',
    createdAt: new Date('2024-01-08'),
    dueDate: new Date('2024-01-22'),
    participants: [
      { id: 'user1', name: 'John Doe', email: 'john@example.com' },
      { id: 'user3', name: 'Mike Johnson', email: 'mike@example.com' },
      { id: 'user4', name: 'Sarah Wilson', email: 'sarah@example.com' },
    ],
    items: [
      { id: 'item10', name: 'Sandwich Combo', price: 12.99, quantity: 3, selectedBy: ['user1', 'user3', 'user4'] },
      { id: 'item11', name: 'Salad Bowl', price: 9.99, quantity: 2, selectedBy: ['user1', 'user4'] },
    ],
    bankDetails: {
      bankName: 'Chase Bank',
      accountName: 'John Doe',
      accountNumber: '5566778899'
    },
    status: 'select',
    total: 58.95,
  },
  {
    id: '5',
    title: 'Birthday Party Supplies',
    description: 'Decorations and cake for Sarah\'s birthday',
    totalAmount: 65.00,
    bankAccountNumber: '9988776655',
    createdBy: 'user3',
    createdAt: new Date('2024-01-05'),
    participants: [
      { id: 'user1', name: 'John Doe', email: 'john@example.com' },
      { id: 'user2', name: 'Jane Smith', email: 'jane@example.com' },
      { id: 'user3', name: 'Mike Johnson', email: 'mike@example.com' },
    ],
    items: [
      { id: 'item12', name: 'Birthday Cake', price: 35.00, quantity: 1, selectedBy: ['user1', 'user2', 'user3'] },
      { id: 'item13', name: 'Decorations', price: 20.00, quantity: 1, selectedBy: ['user2', 'user3'] },
    ],
    bankDetails: {
      bankName: 'Wells Fargo',
      accountName: 'Mike Johnson',
      accountNumber: '9988776655'
    },
    status: 'pay',
    total: 55.00,
  },
];

const currentUserId = 'user1'; // Mock current user ID

// Comprehensive user data combining all sources
const allPossibleUsers = [
  { id: 'user1', name: 'John Doe', email: 'john@example.com', avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2' },
  { id: 'user2', name: 'Jane Smith', email: 'jane@example.com', avatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2' },
  { id: 'user3', name: 'Mike Johnson', email: 'mike@example.com', avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2' },
  { id: 'user4', name: 'Sarah Wilson', email: 'sarah@example.com', avatar: 'https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2' },
  { id: 'friend1', name: 'Jane Smith', email: 'jane@example.com', avatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2' },
  { id: 'friend2', name: 'Mike Johnson', email: 'mike@example.com', avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2' },
  { id: 'friend3', name: 'Sarah Wilson', email: 'sarah@example.com', avatar: 'https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2' },
  { id: 'friend4', name: 'Alex Chen', email: 'alex@example.com', avatar: 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2' },
];

// Helper function to get user avatar
const getUserAvatar = (userId: string): string => {
  const user = allPossibleUsers.find(u => u.id === userId);
  return user?.avatar || 'https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2';
};

// Helper function to get user name
const getUserName = (userId: string): string => {
  const user = allPossibleUsers.find(u => u.id === userId);
  return user?.name || 'Unknown User';
};

interface FriendBalance {
  userId: string;
  userName: string;
  avatar: string;
  netAmount: number; // Positive = they owe you, Negative = you owe them
}

export default function SummaryScreen() {
  const summaryData = useMemo(() => {
    let totalToPay = 0;
    let totalToCollect = 0;
    let billsAsHostCount = 0;
    let billsAsMemberCount = 0;
    const friendBalancesMap: { [userId: string]: { name: string; avatar: string; amount: number } } = {};

    mockBills.forEach(bill => {
      const isHost = bill.createdBy === currentUserId;
      const isParticipant = bill.participants.some(p => p.id === currentUserId);

      if (isHost) {
        billsAsHostCount++;
      } else if (isParticipant) {
        billsAsMemberCount++;
      }

      // Only calculate financial data for bills in 'pay' status
      if (bill.status === 'pay') {
        const userCosts = calculateUserCosts(bill);
        
        if (isParticipant) {
          const currentUserCost = userCosts.find(uc => uc.userId === currentUserId);
          if (currentUserCost) {
            totalToPay += currentUserCost.total;
          }
        }

        if (isHost) {
          // As host, you collect from other participants
          userCosts.forEach(userCost => {
            if (userCost.userId !== currentUserId) {
              totalToCollect += userCost.total;
              
              // Track individual friend balances
              if (!friendBalancesMap[userCost.userId]) {
                friendBalancesMap[userCost.userId] = {
                  name: getUserName(userCost.userId),
                  avatar: getUserAvatar(userCost.userId),
                  amount: 0
                };
              }
              friendBalancesMap[userCost.userId].amount += userCost.total; // They owe you
            }
          });
        } else if (isParticipant) {
          // As member, you owe the host
          const hostId = bill.createdBy;
          const currentUserCost = userCosts.find(uc => uc.userId === currentUserId);
          
          if (currentUserCost && hostId !== currentUserId) {
            if (!friendBalancesMap[hostId]) {
              friendBalancesMap[hostId] = {
                name: getUserName(hostId),
                avatar: getUserAvatar(hostId),
                amount: 0
              };
            }
            friendBalancesMap[hostId].amount -= currentUserCost.total; // You owe them
          }
        }
      }
    });

    const netBalance = totalToCollect - totalToPay;

    // Convert to sorted array
    const sortedFriendBalances: FriendBalance[] = Object.entries(friendBalancesMap)
      .map(([userId, data]) => ({
        userId,
        userName: data.name,
        avatar: data.avatar,
        netAmount: data.amount
      }))
      .sort((a, b) => Math.abs(b.netAmount) - Math.abs(a.netAmount)); // Sort by absolute amount, highest first

    return {
      totalToPay,
      totalToCollect,
      netBalance,
      billsAsHostCount,
      billsAsMemberCount,
      sortedFriendBalances
    };
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Summary</Text>
          <Text style={styles.subtitle}>Your financial overview</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Overall Financial Position */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Financial Position</Text>
          
          <View style={styles.financialGrid}>
            {/* Total to Pay */}
            <View style={styles.financialCard}>
              <View style={styles.financialCardHeader}>
                <View style={[styles.financialIcon, { backgroundColor: '#FEF3C7' }]}>
                  <ArrowUpRight size={20} color="#F59E0B" strokeWidth={2} />
                </View>
                <Text style={styles.financialAmount}>{formatCurrency(summaryData.totalToPay)}</Text>
              </View>
              <Text style={styles.financialLabel}>Total to Pay</Text>
              <Text style={styles.financialSubtext}>Amount you owe others</Text>
            </View>

            {/* Total to Collect */}
            <View style={styles.financialCard}>
              <View style={styles.financialCardHeader}>
                <View style={[styles.financialIcon, { backgroundColor: '#D1FAE5' }]}>
                  <ArrowDownLeft size={20} color="#10B981" strokeWidth={2} />
                </View>
                <Text style={styles.financialAmount}>{formatCurrency(summaryData.totalToCollect)}</Text>
              </View>
              <Text style={styles.financialLabel}>Total to Collect</Text>
              <Text style={styles.financialSubtext}>Amount others owe you</Text>
            </View>
          </View>

          {/* Net Balance */}
          <View style={[
            styles.netBalanceCard, 
            summaryData.netBalance >= 0 ? styles.positiveBalance : styles.negativeBalance
          ]}>
            <View style={styles.netBalanceHeader}>
              <View style={styles.netBalanceIcon}>
                {summaryData.netBalance >= 0 ? (
                  <TrendingUp size={24} color="#FFFFFF" strokeWidth={2} />
                ) : (
                  <TrendingDown size={24} color="#FFFFFF" strokeWidth={2} />
                )}
              </View>
              <View style={styles.netBalanceContent}>
                <Text style={styles.netBalanceAmount}>
                  {formatCurrency(Math.abs(summaryData.netBalance))}
                </Text>
                <Text style={styles.netBalanceLabel}>
                  {summaryData.netBalance >= 0 ? 'Net Positive' : 'Net Negative'}
                </Text>
                <Text style={styles.netBalanceSubtext}>
                  {summaryData.netBalance >= 0 
                    ? 'You\'ll receive more than you pay'
                    : 'You\'ll pay more than you receive'
                  }
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Bill Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bill Overview</Text>
          
          <View style={styles.billStatsGrid}>
            <View style={styles.billStatCard}>
              <View style={styles.billStatHeader}>
                <View style={[styles.billStatIcon, { backgroundColor: '#DBEAFE' }]}>
                  <UserCheck size={18} color="#3B82F6" strokeWidth={2} />
                </View>
                <Text style={styles.billStatNumber}>{summaryData.billsAsHostCount}</Text>
              </View>
              <Text style={styles.billStatLabel}>Bills Hosted</Text>
              <Text style={styles.billStatSubtext}>Bills you created</Text>
            </View>

            <View style={styles.billStatCard}>
              <View style={styles.billStatHeader}>
                <View style={[styles.billStatIcon, { backgroundColor: '#F3E8FF' }]}>
                  <Users size={18} color="#8B5CF6" strokeWidth={2} />
                </View>
                <Text style={styles.billStatNumber}>{summaryData.billsAsMemberCount}</Text>
              </View>
              <Text style={styles.billStatLabel}>Bills Joined</Text>
              <Text style={styles.billStatSubtext}>Bills you participated in</Text>
            </View>

            <View style={styles.billStatCard}>
              <View style={styles.billStatHeader}>
                <View style={[styles.billStatIcon, { backgroundColor: '#FEF3C7' }]}>
                  <Receipt size={18} color="#F59E0B" strokeWidth={2} />
                </View>
                <Text style={styles.billStatNumber}>{summaryData.billsAsHostCount + summaryData.billsAsMemberCount}</Text>
              </View>
              <Text style={styles.billStatLabel}>Total Bills</Text>
              <Text style={styles.billStatSubtext}>All your bills</Text>
            </View>
          </View>
        </View>

        {/* Top Friends */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Friend Balances</Text>
          <Text style={styles.sectionSubtitle}>
            Your financial interactions with friends
          </Text>
          
          {summaryData.sortedFriendBalances.length === 0 ? (
            <View style={styles.emptyFriendsState}>
              <View style={styles.emptyFriendsIcon}>
                <DollarSign size={32} color="#64748B" strokeWidth={2} />
              </View>
              <Text style={styles.emptyFriendsTitle}>No Financial Interactions</Text>
              <Text style={styles.emptyFriendsDescription}>
                You don't have any pending payments or collections with friends yet.
              </Text>
            </View>
          ) : (
            summaryData.sortedFriendBalances.map((friend) => (
              <View key={friend.userId} style={styles.friendBalanceCard}>
                <View style={styles.friendBalanceLeft}>
                  <Image 
                    source={{ uri: friend.avatar }} 
                    style={styles.friendAvatar}
                  />
                  <View style={styles.friendInfo}>
                    <Text style={styles.friendName}>{friend.userName}</Text>
                    <Text style={styles.friendBalanceType}>
                      {friend.netAmount > 0 ? 'Owes you' : 'You owe'}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.friendBalanceRight}>
                  <Text style={[
                    styles.friendBalanceAmount,
                    friend.netAmount > 0 ? styles.positiveAmount : styles.negativeAmount
                  ]}>
                    {friend.netAmount > 0 ? '+' : ''}{formatCurrency(friend.netAmount)}
                  </Text>
                  <View style={[
                    styles.friendBalanceBadge,
                    friend.netAmount > 0 ? styles.positiveBadge : styles.negativeBadge
                  ]}>
                    {friend.netAmount > 0 ? (
                      <ArrowDownLeft size={12} color="#10B981" strokeWidth={2} />
                    ) : (
                      <ArrowUpRight size={12} color="#F59E0B" strokeWidth={2} />
                    )}
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: '#64748B',
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
    paddingTop: 8,
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
  financialGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  financialCard: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  financialCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  financialIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  financialAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F8FAFC',
    letterSpacing: -0.4,
  },
  financialLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#CBD5E1',
    marginBottom: 4,
    letterSpacing: -0.1,
  },
  financialSubtext: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  netBalanceCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
  },
  positiveBalance: {
    backgroundColor: '#10B981',
    borderColor: '#059669',
  },
  negativeBalance: {
    backgroundColor: '#F59E0B',
    borderColor: '#D97706',
  },
  netBalanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  netBalanceIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  netBalanceContent: {
    flex: 1,
  },
  netBalanceAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  netBalanceLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  netBalanceSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  billStatsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  billStatCard: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  billStatHeader: {
    alignItems: 'center',
    marginBottom: 12,
  },
  billStatIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  billStatNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#F8FAFC',
    letterSpacing: -0.5,
  },
  billStatLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#CBD5E1',
    textAlign: 'center',
    marginBottom: 4,
    letterSpacing: -0.1,
  },
  billStatSubtext: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    fontWeight: '500',
  },
  emptyFriendsState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyFriendsIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  emptyFriendsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F8FAFC',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  emptyFriendsDescription: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '500',
  },
  friendBalanceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0F172A',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  friendBalanceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  friendAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F8FAFC',
    marginBottom: 2,
    letterSpacing: -0.2,
  },
  friendBalanceType: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '500',
  },
  friendBalanceRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  friendBalanceAmount: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  positiveAmount: {
    color: '#10B981',
  },
  negativeAmount: {
    color: '#F59E0B',
  },
  friendBalanceBadge: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  positiveBadge: {
    backgroundColor: '#D1FAE5',
  },
  negativeBadge: {
    backgroundColor: '#FEF3C7',
  },
});