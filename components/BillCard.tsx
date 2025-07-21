import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Users, Calendar, DollarSign, User, Tag } from 'lucide-react-native';
import { formatCurrency } from '@/utils/billUtils';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

interface BillCardProps {
  bill: {
    id: string;
    title: string;
    description?: string;
    total_amount: number;
    created_by: string;
    status: 'select' | 'pay' | 'closed';
    due_date?: string;
    tag?: string;
    created_at: string;
    participants: Array<{
      id: string;
      name: string;
      email: string;
    }>;
  };
  onPress?: () => void;
}

// Tag color palette and hash function
const tagColors = [
  '#FFD500', '#4C6FFF', '#FF7A59', '#10B981', '#F59E0B', '#A259FF', '#FF5C8A', '#00C2FF',
];
function getTagColor(tag: string) {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % tagColors.length;
  return tagColors[index];
}

// Add status color function


export default function BillCard({ bill, onPress }: BillCardProps) {
  const router = useRouter();
  
  const getStatusText = (status: string) => {
    switch (status) {
      case 'select': return 'Select';
      case 'pay': return 'Pay';
      case 'closed': return 'Closed';
      default: return 'Unknown';
    }
  };

  function getStatusColor(status: string) {
    switch (status) {
      case 'select': return '#F59E0B'; // yellow
      case 'pay': return '#4C6FFF';    // blue
      case 'closed': return '#10B981'; // green
      default: return '#E0E0E0';       // neutral
    }
  }

  // Get host name from participants
  const hostName = bill.participants.find(p => p.id === bill.created_by)?.name || 'Unknown Host';

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push(`/bill/${bill.id}`);
    }
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
      <LinearGradient
        colors={['#1E293B', '#334155']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cardGradient}
      >
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.titleSection}>
              <Text style={styles.title} numberOfLines={1}>{bill.title}</Text>
              {bill.tag && (
                <View style={[
                  styles.tag,
                  { backgroundColor: getTagColor(bill.tag) }
                ]}>
                  <Tag size={14} color="#fff" />
                  <Text style={[styles.tagText, { color: '#fff' }]}>{bill.tag}</Text>
                </View>
              )}
            </View>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(bill.status) }
              ]}
            >
              <Text style={styles.statusText}>{bill.status.toUpperCase()}</Text>
            </View>
          </View>
          
          <View
            style={styles.hostSection}
          >
            <User size={14} color="#64748B" strokeWidth={2} />
            <Text style={styles.hostText}>Hosted by {hostName}</Text>
          </View>
          
          <View style={styles.footer}>
            <View style={styles.infoRow}>
              <Users size={14} color="#64748B" strokeWidth={2} />
              <Text style={styles.infoText}>{bill.participants.length} people</Text>
            </View>
            
            <View style={styles.infoRow}>
              <DollarSign size={14} color="#10B981" strokeWidth={2} />
              <Text style={styles.infoText}>{formatCurrency(bill.total_amount)}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Calendar size={14} color="#64748B" strokeWidth={2} />
              <Text style={styles.infoText}>
                {bill.due_date 
                  ? new Date(bill.due_date).toLocaleDateString()
                  : new Date(bill.created_at).toLocaleDateString()
                }
              </Text>
            </View>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cardGradient: {
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  card: {
    padding: 20,
    borderRadius: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleSection: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F8FAFC',
    lineHeight: 24,
    letterSpacing: -0.3,
    marginBottom: 6,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 4,
    alignSelf: 'flex-start',
    marginBottom: 2,
    opacity: 1,
  },
  tagText: {
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    minWidth: 70,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  hostSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  hostText: {
    fontSize: 13,
    color: '#CBD5E1',
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