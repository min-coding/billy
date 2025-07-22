import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, ActivityIndicator, Platform, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus, Zap, Search, Filter, ArrowUpDown, X, Check, Clock, CircleCheck as CheckCircle, User, Users as UsersIcon, Tag } from 'lucide-react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import BillCard from '@/components/BillCard';
import { useBills } from '@/hooks/useBills';
import { useAuth } from '@/contexts/AuthContext';
import DateRangePicker from '@/components/DateRangePicker';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { supabase } from '@/lib/supabase';

type SortOption = 'newest' | 'oldest' | 'amount_high' | 'amount_low' | 'due_date';
type StatusFilter = 'all' | 'select' | 'pay' | 'closed';
type RoleFilter = 'all' | 'host' | 'member';

interface DateRange {
  start: string;
  end: string;
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Enhanced tag color palette with gradients
const tagColors = [
  { bg: '#FFD500', secondary: '#FFA500' }, // Gold to Orange
  { bg: '#4C6FFF', secondary: '#6366F1' }, // Blue to Indigo  
  { bg: '#FF7A59', secondary: '#EF4444' }, // Coral to Red
  { bg: '#10B981', secondary: '#059669' }, // Emerald to Green
  { bg: '#F59E0B', secondary: '#D97706' }, // Amber to Orange
  { bg: '#A259FF', secondary: '#7C3AED' }, // Purple to Violet
  { bg: '#FF5C8A', secondary: '#EC4899' }, // Pink to Rose
  { bg: '#00C2FF', secondary: '#0EA5E9' }, // Cyan to Sky
];
function getTagColor(tag: string) {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % tagColors.length;
  return tagColors[index].bg; // Return the background color string
}

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { bills, loading, error, refetch } = useBills();
  const [refreshing, setRefreshing] = useState(false);
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [dateRange, setDateRange] = useState<DateRange>({ start: '', end: '' });
  
  // Modal states
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);

  // Add state for tag filter
  const [tagFilter, setTagFilter] = useState<string | null>(null);

  // Get unique tags from bills
  const uniqueTags = useMemo(() => {
    const tags = bills.map(b => b.tag).filter((t): t is string => Boolean(t));
    return Array.from(new Set(tags));
  }, [bills]);

  // Filtered and sorted bills, now also filtered by tag
  const filteredAndSortedBills = useMemo(() => {
    let filtered = bills;

    // Search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(bill =>
        bill.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(bill => bill.status === statusFilter);
    }

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(bill => {
        if (roleFilter === 'host') {
          return bill.created_by === user?.id;
        } else {
          return bill.created_by !== user?.id;
        }
      });
    }

    // Date range filter
    if (dateRange.start && dateRange.end) {
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      filtered = filtered.filter(bill => {
        if (!bill.due_date) return false;
        const dueDate = new Date(bill.due_date);
        return dueDate >= startDate && dueDate <= endDate;
      });
    }

    // Tag filter
    if (tagFilter) {
      filtered = filtered.filter(bill => bill.tag === tagFilter);
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      switch (sortOption) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'amount_high':
          return b.total_amount - a.total_amount;
        case 'amount_low':
          return a.total_amount - b.total_amount;
        case 'due_date':
          if (!a.due_date && !b.due_date) return 0;
          if (!a.due_date) return 1;
          if (!b.due_date) return -1;
          return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
        default:
          return 0;
      }
    });

    return sorted;
  }, [bills, searchQuery, statusFilter, roleFilter, sortOption, dateRange, user?.id, tagFilter]);

  // Calculate total for current tag group
  const tagTotal = useMemo(() => {
    if (!tagFilter) return null;
    return filteredAndSortedBills.reduce((sum, bill) => sum + (bill.total_amount || 0), 0);
  }, [filteredAndSortedBills, tagFilter]);

  const handleCreateBill = () => {
    router.push('/bill/create');
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setRoleFilter('all');
    setDateRange({ start: '', end: '' });
    setSortOption('newest');
    setTagFilter(null); // Clear tag filter
  };

  const hasActiveFilters = searchQuery.trim() || statusFilter !== 'all' || roleFilter !== 'all' || dateRange.start || dateRange.end || sortOption !== 'newest' || tagFilter;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'select': return Clock;
      case 'pay': return User;
      case 'closed': return CheckCircle;
      default: return Clock;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'select': return '#F59E0B';
      case 'pay': return '#3B82F6';
      case 'closed': return '#10B981';
      default: return '#64748B';
    }
  };

  const getSortLabel = (option: SortOption) => {
    switch (option) {
      case 'newest': return 'Newest First';
      case 'oldest': return 'Oldest First';
      case 'amount_high': return 'Highest Amount';
      case 'amount_low': return 'Lowest Amount';
      case 'due_date': return 'Due Date';
      default: return 'Newest First';
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  React.useEffect(() => {
    if (Platform.OS === 'web') {
      refetch();
    }
  }, [refetch]);

  useFocusEffect(
    React.useCallback(() => {
      if (Platform.OS !== 'web') {
        refetch();
      }
    }, [refetch])
  );

  const [expoPushToken, setExpoPushToken] = useState('');
  const notificationListener = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    registerForPushNotificationsAsync()
      .then(async (token) => {
        if (token) {
          // Always get the authenticated user's ID from Supabase Auth
          const { data: { user: authUser } } = await supabase.auth.getUser();
          if (authUser?.id) {
            setExpoPushToken(token);
            // Save push token to database
            try {
              console.log('Attempting to save push token for user:', authUser.id);
              console.log('Token to save:', token);
              const { error } = await supabase
                .from('user_push_tokens')
                .upsert({
                  user_id: authUser.id,
                  token: token
                }, {
                  onConflict: 'token'
                });
              if (error) {
                console.error('Failed to save push token:', error);
                console.error('User ID:', authUser.id);
                console.error('Auth session check...');
                const { data: { session } } = await supabase.auth.getSession();
                console.error('Current session:', session?.user?.id);
              } else {
                console.log('Push token saved successfully:', token);
              }
            } catch (error) {
              console.error('Error saving push token:', error);
            }
          } else {
            setExpoPushToken(token ?? '');
          }
        } else {
          setExpoPushToken(token ?? '');
        }
      })
      .catch((error) => setExpoPushToken(`${error}`));

    notificationListener.current = Notifications.addNotificationReceivedListener(() => {
      // Handle notification received
    });

    // Removed responseListener for notification taps; now handled globally

    return () => {
      if (notificationListener.current) Notifications.removeNotificationSubscription(notificationListener.current);
    };
  }, [user?.id]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#F59E0B" />
          <Text style={styles.loadingText}>Loading bills...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => window.location.reload()}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={{ flex: 1, position: 'relative' }}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.titleSection}>
            <Text style={styles.title}>Bills</Text>
            <Text style={styles.subtitle}>
              {filteredAndSortedBills.length} of {bills.length} bills
            </Text>
          </View>
          <TouchableOpacity onPress={handleCreateBill}>
            <LinearGradient
              colors={['#F59E0B', '#D97706']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.createButton}
            >
              <Plus size={18} color="#FFFFFF" strokeWidth={2.5} />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      {/* Compact Search and Filter Bar */}
      <View style={styles.searchFilterSection}>
        <View style={styles.searchFilterRow}>
          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Search size={18} color="#94A3B8" strokeWidth={2} />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search bills..."
              placeholderTextColor="#64748B"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <X size={16} color="#94A3B8" strokeWidth={2} />
              </TouchableOpacity>
            )}
          </View>

          {/* Filter Button */}
          <TouchableOpacity onPress={() => setShowFilterModal(true)}>
            {hasActiveFilters ? (
              <LinearGradient
                colors={['#F59E0B', '#D97706']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.iconButton}
              >
                <Filter size={18} color="#FFFFFF" strokeWidth={2} />
                <View style={styles.activeDot} />
              </LinearGradient>
            ) : (
              <View style={styles.iconButton}>
                <Filter size={18} color="#94A3B8" strokeWidth={2} />
              </View>
            )}
          </TouchableOpacity>

          {/* Sort Button */}
          <TouchableOpacity onPress={() => setShowSortModal(true)}>
            <View style={styles.iconButton}>
              <ArrowUpDown size={18} color="#94A3B8" strokeWidth={2} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Clear Filters - Only show when filters are active */}
        {hasActiveFilters && (
          <TouchableOpacity style={styles.clearFiltersButton} onPress={clearFilters}>
            <X size={14} color="#EF4444" strokeWidth={2} />
            <Text style={styles.clearFiltersText}>Clear filters</Text>
          </TouchableOpacity>
        )}

<View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop:12,marginBottom:0, gap: 8}}>
  {uniqueTags.map(tag => (
    <TouchableOpacity
      key={tag}
      style={[
        styles.tag,
        {
          backgroundColor: getTagColor(tag),
          marginTop: 0,
          marginBottom: 0,
        }
      ]}
      onPress={() => setTagFilter(tag === tagFilter ? null : tag)}
    >
      <Tag size={14} color="#fff" />
      <Text style={[styles.tagText, { color: '#fff' }]}>{tag}</Text>
    </TouchableOpacity>
  ))}
</View>
      {tagFilter && (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop:18,marginBottom: 2}}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.filterTotalText}>Total for </Text>
            <View style={[
              styles.tag,
              { backgroundColor: getTagColor(tagFilter), marginTop: 0, marginBottom: 0,marginLeft:3 }
            ]}>
              <Tag size={14} color="#fff" />
              <Text style={[styles.tagText, { color: '#fff' }]}>{tagFilter}</Text>
            </View>
            <Text style={[styles.filterTotalText,{marginLeft:6}]}>:</Text>
          </View>
          <Text style={styles.filterTotalAmount}>{tagTotal?.toFixed(2)}</Text>
        </View>
      )}
      </View>


      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#F59E0B"
            colors={["#F59E0B"]}
            progressBackgroundColor="#1E293B"
          />
        }
      >
        {filteredAndSortedBills.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              {bills.length === 0 ? (
                <Zap size={32} color="#F59E0B" strokeWidth={2} />
              ) : (
                <Search size={32} color="#64748B" strokeWidth={2} />
              )}
            </View>
            <Text style={styles.emptyTitle}>
              {bills.length === 0 ? 'No bills yet' : 'No bills found'}
            </Text>
            <Text style={styles.emptyDescription}>
              {bills.length === 0 
                ? 'Create your first bill to start splitting expenses with friends'
                : 'Try adjusting your search or filters'
              }
            </Text>
            {bills.length === 0 ? (
              <TouchableOpacity style={styles.emptyButton} onPress={handleCreateBill}>
                <Plus size={16} color="#F59E0B" strokeWidth={2.5} />
                <Text style={styles.emptyButtonText}>Create Bill</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.emptyButton} onPress={clearFilters}>
                <X size={16} color="#F59E0B" strokeWidth={2.5} />
                <Text style={styles.emptyButtonText}>Clear Filters</Text>
              </TouchableOpacity>
            )}
          </View>
          ) :
          filteredAndSortedBills.map((bill) => (
            <BillCard key={bill.id} bill={{
              ...bill,
              description: bill.description ?? undefined,
              due_date: bill.due_date ?? undefined,
              tag: bill.tag ?? undefined
            }} />
          ))
          }
      </ScrollView>
      </View>
      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.filterModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Bills</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowFilterModal(false)}
              >
                <X size={20} color="#64748B" strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              {/* Status Filter */}
              <View style={styles.filterGroup}>
                <Text style={styles.filterGroupTitle}>Status</Text>
                {(['all', 'select', 'pay', 'closed'] as StatusFilter[]).map((status) => {
                  const StatusIcon = status === 'all' ? UsersIcon : getStatusIcon(status);
                  const isSelected = statusFilter === status;
                  
                  return (
                    <TouchableOpacity
                      key={status}
                      style={[styles.filterOption, isSelected && styles.selectedFilterOption]}
                      onPress={() => setStatusFilter(status)}
                    >
                      <View style={styles.filterOptionLeft}>
                        <StatusIcon 
                          size={18} 
                          color={status === 'all' ? "#64748B" : getStatusColor(status)} 
                          strokeWidth={2} 
                        />
                        <Text style={[styles.filterOptionText, isSelected && styles.selectedFilterOptionText]}>
                          {status === 'all' ? 'All Status' : status.charAt(0).toUpperCase() + status.slice(1)}
                        </Text>
                      </View>
                      {isSelected && <Check size={16} color="#F59E0B" strokeWidth={2} />}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Role Filter */}
              <View style={styles.filterGroup}>
                <Text style={styles.filterGroupTitle}>Your Role</Text>
                {(['all', 'host', 'member'] as RoleFilter[]).map((role) => {
                  const isSelected = roleFilter === role;
                  
                  return (
                    <TouchableOpacity
                      key={role}
                      style={[styles.filterOption, isSelected && styles.selectedFilterOption]}
                      onPress={() => setRoleFilter(role)}
                    >
                      <View style={styles.filterOptionLeft}>
                        <User size={18} color="#64748B" strokeWidth={2} />
                        <Text style={[styles.filterOptionText, isSelected && styles.selectedFilterOptionText]}>
                          {role === 'all' ? 'All Roles' : role === 'host' ? 'Bills I Created' : 'Bills I Joined'}
                        </Text>
                      </View>
                      {isSelected && <Check size={16} color="#F59E0B" strokeWidth={2} />}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Date Range Filter */}
              <View style={styles.filterGroup}>
                <DateRangePicker
                  startDate={dateRange.start}
                  endDate={dateRange.end}
                  onStartDateChange={(date) => setDateRange(prev => ({ ...prev, start: date }))}
                  onEndDateChange={(date) => setDateRange(prev => ({ ...prev, end: date }))}
                  label="Due Date Range"
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.clearButton} 
                onPress={() => {
                  setStatusFilter('all');
                  setRoleFilter('all');
                  setDateRange({ start: '', end: '' });
                  setTagFilter(null); // Clear tag filter
                }}
              >
                <Text style={styles.clearButtonText}>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.applyButton} 
                onPress={() => setShowFilterModal(false)}
              >
                <Text style={styles.applyButtonText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Sort Modal */}
      <Modal
        visible={showSortModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSortModal(false)}
      >
        <TouchableOpacity 
          style={styles.sortModalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowSortModal(false)}
        >
          <View style={styles.sortModal}>
            <Text style={styles.sortModalTitle}>Sort By</Text>
            {(['newest', 'oldest', 'amount_high', 'amount_low', 'due_date'] as SortOption[]).map((option) => {
              const isSelected = sortOption === option;
              
              return (
                <TouchableOpacity
                  key={option}
                  style={[styles.sortOption, isSelected && styles.selectedSortOption]}
                  onPress={() => {
                    setSortOption(option);
                    setShowSortModal(false);
                  }}
                >
                  <Text style={[styles.sortOptionText, isSelected && styles.selectedSortOptionText]}>
                    {getSortLabel(option)}
                  </Text>
                  {isSelected && <Check size={16} color="#F59E0B" strokeWidth={2} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

async function registerForPushNotificationsAsync() {
  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      alert('Permission not granted to get push token for push notification!');
      return;
    }
    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
    if (!projectId) {
      alert('Project ID not found');
      return;
    }
    try {
      const pushTokenString = (
        await Notifications.getExpoPushTokenAsync({
          projectId,
        })
      ).data;
      console.log(pushTokenString);
      return pushTokenString;
    } catch (e) {
      alert(`${e}`);
    }
  } else {
    alert('Must use physical device for push notifications');
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
    fontWeight: '500',
  },
  retryButton: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#0F172A',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleSection: {
    flex: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: 6,
    letterSpacing: -0.8,
    textShadowColor: 'rgba(245, 158, 11, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#94A3B8',
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  createButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F59E0B',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
  },
  searchFilterSection: {
    paddingHorizontal: 20,
    paddingBottom:8,
  },
  searchFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: '#475569',
    gap: 10,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#F8FAFC',
    fontWeight: '500',
    letterSpacing: -0.2,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#1E293B',
    borderWidth: 1.5,
    borderColor: '#475569',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activeIconButton: {
    backgroundColor: '#F59E0B',
    borderColor: '#F59E0B',
  },
  activeDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  clearFiltersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 12,
    backgroundColor: '#1E293B',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#EF4444',
    gap: 6,
    shadowColor: '#EF4444',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  clearFiltersText: {
    fontSize: 14,
    color: '#EF4444',
    fontWeight: '600',
    letterSpacing: -0.2,
  },
 
  tagButton: {
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
  selectedTagButton: {
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
    transform: [{ scale: 1.05 }],
  },
    tag: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
  paddingHorizontal: 8,
    paddingVertical: 2,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  tagText: {
    color: '#fff',
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '500',
  },
  filterTotalContainer: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#475569',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  },
  filterTotalText: {
    fontSize: 16,
    color: '#CBD5E1',
    fontWeight: '500',
  },
  filterTotalAmount: {
    color: '#F59E0B',
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 80,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#F8FAFC',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  emptyDescription: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
    fontWeight: '500',
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E293B',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 8,
  },
  emptyButtonText: {
    color: '#F59E0B',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  filterModal: {
    backgroundColor: '#1E293B',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#334155',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F8FAFC',
    letterSpacing: -0.3,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  filterGroup: {
    marginBottom: 32,
  },
  filterGroupTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#CBD5E1',
    marginBottom: 16,
    letterSpacing: -0.2,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0F172A',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  selectedFilterOption: {
    borderColor: '#F59E0B',
    backgroundColor: '#1E293B',
  },
  filterOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  filterOptionText: {
    fontSize: 16,
    color: '#F8FAFC',
    fontWeight: '500',
  },
  selectedFilterOptionText: {
    color: '#F59E0B',
    fontWeight: '600',
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#334155',
    gap: 12,
  },
  clearButton: {
    flex: 1,
    backgroundColor: '#334155',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#475569',
  },
  clearButtonText: {
    color: '#CBD5E1',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  applyButton: {
    flex: 1,
    backgroundColor: '#F59E0B',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#F59E0B',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  sortModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  sortModal: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
    minWidth: 200,
    paddingVertical: 16,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 16,
  },
  sortModalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#CBD5E1',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  selectedSortOption: {
    backgroundColor: '#0F172A',
  },
  sortOptionText: {
    fontSize: 16,
    color: '#F8FAFC',
    fontWeight: '500',
  },
  selectedSortOptionText: {
    color: '#F59E0B',
    fontWeight: '600',
  },
});