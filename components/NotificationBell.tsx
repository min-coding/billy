import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Bell } from 'lucide-react-native';
import { useNotifications } from '@/hooks/useNotifications';
import { useRouter } from 'expo-router';

interface NotificationBellProps {
  size?: number;
  color?: string;
}

export default function NotificationBell({ size = 18, color = "#F59E0B" }: NotificationBellProps) {
  const { unreadCount } = useNotifications();
  const router = useRouter();

  const handlePress = () => {
    router.push('/notifications');
  };

  return (
    <TouchableOpacity onPress={handlePress} style={styles.container}>
      <View style={styles.bellContainer}>
        <Bell size={size} color={color} strokeWidth={2} />
        {unreadCount > 0 && (
          <LinearGradient
            colors={['#EF4444', '#DC2626']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.badge}
          >
            <Text style={styles.badgeText}>
              {unreadCount > 99 ? '99+' : unreadCount.toString()}
            </Text>
          </LinearGradient>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  bellContainer: {
    position: 'relative',
    padding: 8,
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#0F172A',
    shadowColor: '#EF4444',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
});