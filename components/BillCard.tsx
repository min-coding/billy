import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Users, Calendar, DollarSign } from 'lucide-react-native';
import { Bill } from '@/types';
import { formatCurrency } from '@/utils/billUtils';
import { useRouter } from 'expo-router';

interface BillCardProps {
  bill: Bill;
  onPress?: () => void;
}

export default function BillCard({ bill, onPress }: BillCardProps) {
  const router = useRouter();
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'select': return '#F59E0B';
      case 'pay': return '#3B82F6';
      case 'closed': return '#10B981';
      default: return '#64748B';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'select': return 'Select';
      case 'pay': return 'Pay';
      case 'closed': return 'Closed';
      default: return 'Unknown';
    }
  };

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push(`/bill/${bill.id}`);
    }
  };

  return (
    <TouchableOpacity style={styles.card} onPress={handlePress} activeOpacity={0.8}>
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={1}>{bill.title}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(bill.status) }]}>
          <Text style={styles.statusText}>{getStatusText(bill.status)}</Text>
        </View>
      </View>
      
      {bill.description && (
        <Text style={styles.description} numberOfLines={2}>{bill.description}</Text>
      )}
      
      <View style={styles.footer}>
        <View style={styles.infoRow}>
          <Users size={14} color="#64748B" strokeWidth={2} />
          <Text style={styles.infoText}>{bill.participants.length} people</Text>
        </View>
        
        <View style={styles.infoRow}>
          <DollarSign size={14} color="#10B981" strokeWidth={2} />
          <Text style={styles.infoText}>{formatCurrency(bill.totalAmount)}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Calendar size={14} color="#64748B" strokeWidth={2} />
          <Text style={styles.infoText}>
            {new Date(bill.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F8FAFC',
    flex: 1,
    marginRight: 12,
    lineHeight: 24,
    letterSpacing: -0.3,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    minWidth: 70,
    alignItems: 'center',
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  description: {
    fontSize: 15,
    color: '#94A3B8',
    marginBottom: 16,
    lineHeight: 20,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  infoText: {
    fontSize: 13,
    color: '#CBD5E1',
    fontWeight: '500',
  },
});