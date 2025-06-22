import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Check } from 'lucide-react-native';
import { BillItem } from '@/types';
import { formatCurrency } from '@/utils/billUtils';

interface ItemCardProps {
  item: BillItem;
  isSelected: boolean;
  onToggle: () => void;
  participantCount: number;
}

export default function ItemCard({ item, isSelected, onToggle, participantCount }: ItemCardProps) {
  const splitPrice = participantCount > 0 ? item.price / participantCount : item.price;

  return (
    <TouchableOpacity 
      style={[styles.card, isSelected && styles.selectedCard]} 
      onPress={onToggle}
      activeOpacity={0.8}
    >
      <View style={styles.content}>
        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemPrice}>{formatCurrency(item.price)}</Text>
          {item.selectedBy.length > 1 && (
            <Text style={styles.splitInfo}>
              Split {item.selectedBy.length} ways: {formatCurrency(splitPrice)}
            </Text>
          )}
        </View>
        
        <View style={[styles.checkbox, isSelected && styles.checkedBox]}>
          {isSelected && <Check size={14} color="#FFFFFF" strokeWidth={2.5} />}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  selectedCard: {
    borderColor: '#3B82F6',
    backgroundColor: '#1E293B',
    shadowColor: '#3B82F6',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F8FAFC',
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  itemPrice: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
  },
  splitInfo: {
    fontSize: 12,
    color: '#3B82F6',
    marginTop: 4,
    fontWeight: '500',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#475569',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
  },
  checkedBox: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
    shadowColor: '#3B82F6',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
});