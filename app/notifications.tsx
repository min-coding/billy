import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowLeft, Bell, Calendar, Clock, CircleCheck as CheckCircle, Trash2, BookMarked as MarkAsRead } from 'lucide-react-native';
import { useNotifications } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';

export default function NotificationsScreen() {
  const router = useRouter();
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead, deleteNotification, refetch } = useNotifications();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  };

  const handleNotificationPress = async (notification: any) => {
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }

    // Navigate based on notification type
    if (notification.data?.bill_id) {
      router.push(`/bill/${notification.data.bill_id}`);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
    } catch (error) {
      Alert.alert('Error', 'Failed to mark all notifications as read');
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      await deleteNotification(notificationId);
    } catch (error) {
      Alert.alert('Error', 'Failed to delete notification');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'due_tomorrow':
      case 'due_in_3_days':
      case 'due_in_1_week':
        return Calendar;
      case 'bill_finalized':
        return CheckCircle;
      default:
        return Bell;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'due_tomorrow':
        return '#EF4444'; // Red for urgent
      case 'due_in_3_days':
        return '#F59E0B'; // Orange for warning
      case 'due_in_1_week':
        return '#3B82F6'; // Blue for info
      case 'bill_finalized':
        return '#10B981'; // Green for success
      default:
        return '#64748B';
    }
  };

  const formatNotificationTime = (createdAt: string) => {
    try {
      return formatDistanceToNow(new Date(createdAt), { addSuffix: true });
    } catch {
      return 'Recently';
    }
  };

  return (
    <LinearGradient
      colors={['#0F172A', '#1E293B', '#334155']}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={styles.gradientContainer}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={20} color="#F8FAFC" strokeWidth={2} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.title}>Notifications</Text>
            <Text style={styles.subtitle}>
              {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
            </Text>
          </View>
          {unreadCount > 0 && (
            <TouchableOpacity style={styles.markAllButton} onPress={handleMarkAllAsRead}>
              <MarkAsRead size={18} color="#F59E0B" strokeWidth={2} />
            </TouchableOpacity>
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
          {notifications.length === 0 ? (
            <View style={styles.emptyState}>
              <LinearGradient
                colors={['#1E293B', '#334155']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.emptyIcon}
              >
                <Bell size={32} color="#64748B" strokeWidth={2} />
              </LinearGradient>
              <Text style={styles.emptyTitle}>No notifications yet</Text>
              <Text style={styles.emptyDescription}>
                You'll receive notifications about bill due dates, payment updates, and friend requests here.
              </Text>
            </View>
          ) : (
            <View style={styles.notificationsList}>
              {notifications.map((notification) => {
                const IconComponent = getNotificationIcon(notification.type);
                const iconColor = getNotificationColor(notification.type);
                
                return (
                  <LinearGradient
                    key={notification.id}
                    colors={['#1E293B', '#334155']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[
                      styles.notificationCardGradient,
                      !notification.is_read && styles.unreadCard
                    ]}
                  >
                    <TouchableOpacity 
                      style={styles.notificationCard}
                      onPress={() => handleNotificationPress(notification)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.notificationContent}>
                        <View style={styles.notificationLeft}>
                          <LinearGradient
                            colors={['#0F172A', '#1E293B']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.iconContainer}
                          >
                            <IconComponent size={20} color={iconColor} strokeWidth={2} />
                          </LinearGradient>
                          
                          <View style={styles.notificationText}>
                            <Text style={[
                              styles.notificationTitle,
                              !notification.is_read && styles.unreadTitle
                            ]}>
                              {notification.title}
                            </Text>
                            <Text style={styles.notificationBody}>
                              {notification.body}
                            </Text>
                            <View style={styles.notificationMeta}>
                              <Clock size={12} color="#64748B" strokeWidth={2} />
                              <Text style={styles.notificationTime}>
                                {formatNotificationTime(notification.created_at)}
                              </Text>
                            </View>
                          </View>
                        </View>

                        <TouchableOpacity
                          style={styles.deleteButton}
                          onPress={() => handleDeleteNotification(notification.id)}
                        >
                          <Trash2 size={16} color="#64748B" strokeWidth={2} />
                        </TouchableOpacity>
                      </View>

                      {!notification.is_read && (
                        <View style={styles.unreadIndicator} />
                      )}
                    </TouchableOpacity>
                  </LinearGradient>
                );
              })}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    paddingTop: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#F8FAFC',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 2,
  },
  markAllButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F59E0B',
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
    width: 80,
    height: 80,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#334155',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#F8FAFC',
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  emptyDescription: {
    fontSize: 16,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '500',
  },
  notificationsList: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  notificationCardGradient: {
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  unreadCard: {
    borderColor: '#F59E0B',
  },
  notificationCard: {
    padding: 20,
    borderRadius: 16,
    position: 'relative',
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  notificationLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    marginRight: 12,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  notificationText: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F8FAFC',
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  unreadTitle: {
    color: '#F59E0B',
  },
  notificationBody: {
    fontSize: 14,
    color: '#94A3B8',
    lineHeight: 20,
    fontWeight: '500',
    marginBottom: 8,
  },
  notificationMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  notificationTime: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  deleteButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#0F172A',
  },
  unreadIndicator: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F59E0B',
  },
});