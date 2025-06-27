import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

interface NotificationState {
  expoPushToken: string | null;
  isLoading: boolean;
  error: string | null;
  permissionStatus: 'granted' | 'denied' | 'undetermined';
  unreadCount: number;
}

interface NotificationContextType extends NotificationState {
  registerForPushNotifications: () => Promise<void>;
  updatePushToken: (token: string) => Promise<void>;
  requestPermissions: () => Promise<boolean>;
  markNotificationAsRead: (notificationId: string) => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();
  const [notificationState, setNotificationState] = useState<NotificationState>({
    expoPushToken: null,
    isLoading: false,
    error: null,
    permissionStatus: 'undetermined',
    unreadCount: 0,
  });

  // Register for push notifications
  const registerForPushNotifications = async (): Promise<void> => {
    if (!user) return;

    setNotificationState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Check if we're on a physical device (required for push notifications)
      if (!Device.isDevice) {
        console.log('Push notifications only work on physical devices');
        setNotificationState(prev => ({ 
          ...prev, 
          isLoading: false,
          error: 'Push notifications only work on physical devices'
        }));
        return;
      }

      // Get existing permission status
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // Request permissions if not already granted
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        setNotificationState(prev => ({ 
          ...prev, 
          isLoading: false,
          permissionStatus: 'denied',
          error: 'Permission to send notifications was denied'
        }));
        return;
      }

      // Check if project ID is configured
      const projectId = process.env.EXPO_PUBLIC_PROJECT_ID;
      if (!projectId) {
        setNotificationState(prev => ({ 
          ...prev, 
          isLoading: false,
          error: 'Expo project ID not configured. Please set EXPO_PUBLIC_PROJECT_ID in your .env file.'
        }));
        return;
      }

      // Validate that project ID looks like a UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(projectId)) {
        setNotificationState(prev => ({ 
          ...prev, 
          isLoading: false,
          error: 'Invalid Expo project ID. Please ensure EXPO_PUBLIC_PROJECT_ID is a valid UUID from your Expo dashboard.'
        }));
        return;
      }

      // Get the Expo push token
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: projectId,
      });

      const token = tokenData.data;

      // Update the token in Supabase
      await updatePushToken(token);

      setNotificationState(prev => ({
        ...prev,
        expoPushToken: token,
        isLoading: false,
        permissionStatus: 'granted',
      }));

      console.log('Push notification token registered:', token);
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      setNotificationState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to register for notifications',
      }));
    }
  };

  // Update push token in Supabase
  const updatePushToken = async (token: string): Promise<void> => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('users')
        .update({ push_token: token })
        .eq('id', user.id);

      if (error) {
        throw new Error(`Failed to update push token: ${error.message}`);
      }

      console.log('Push token updated in database');
    } catch (error) {
      console.error('Error updating push token:', error);
      throw error;
    }
  };

  // Request permissions only
  const requestPermissions = async (): Promise<boolean> => {
    try {
      if (!Device.isDevice) {
        return false;
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      const granted = finalStatus === 'granted';
      setNotificationState(prev => ({
        ...prev,
        permissionStatus: granted ? 'granted' : 'denied',
      }));

      return granted;
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return false;
    }
  };

  // Mark notification as read
  const markNotificationAsRead = async (notificationId: string): Promise<void> => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Update local unread count
      setNotificationState(prev => ({
        ...prev,
        unreadCount: Math.max(0, prev.unreadCount - 1)
      }));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Fetch unread notification count
  const fetchUnreadCount = async (): Promise<void> => {
    if (!user) return;

    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) throw error;

      setNotificationState(prev => ({
        ...prev,
        unreadCount: count || 0
      }));
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  // Handle notification received (app in foreground)
  useEffect(() => {
    if (Platform.OS === 'web') return;

    const subscription = Notifications.addNotificationReceivedListener(notification => {
      const data = notification.request.content.data;
      
      // Handle bill finalization notifications
      if (data?.action === 'finalize_bill') {
        // Update unread count
        setNotificationState(prev => ({
          ...prev,
          unreadCount: prev.unreadCount + 1
        }));
        
        // You could show an in-app alert or toast here
        console.log('Bill finalization notification received:', notification.request.content);
      }
    });

    return () => subscription.remove();
  }, []);

  // Handle notification response (user tapped notification)
  useEffect(() => {
    if (Platform.OS === 'web') return;

    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      
      // Handle bill finalization notifications
      if (data?.action === 'finalize_bill' && data?.bill_id) {
        // Navigate to the bill screen
        router.push(`/bill/${data.bill_id}`);
        
        // Mark notification as read if we have the notification ID
        if (data?.notification_id) {
          markNotificationAsRead(data.notification_id);
        }
      }
    });

    return () => subscription.remove();
  }, [router]);

  // Auto-register when user logs in
  useEffect(() => {
    if (user && Platform.OS !== 'web') {
      registerForPushNotifications();
      fetchUnreadCount();
    }
  }, [user]);

  // Listen for token updates
  useEffect(() => {
    if (Platform.OS === 'web') return;

    const subscription = Notifications.addPushTokenListener(async (tokenData) => {
      const newToken = tokenData.data;
      if (newToken !== notificationState.expoPushToken && user) {
        try {
          await updatePushToken(newToken);
          setNotificationState(prev => ({
            ...prev,
            expoPushToken: newToken,
          }));
        } catch (error) {
          console.error('Error updating new push token:', error);
        }
      }
    });

    return () => subscription.remove();
  }, [user, notificationState.expoPushToken]);

  // Listen for real-time notification updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          // Refresh unread count when new notifications arrive
          fetchUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return (
    <NotificationContext.Provider
      value={{
        ...notificationState,
        registerForPushNotifications,
        updatePushToken,
        requestPermissions,
        markNotificationAsRead,
        fetchUnreadCount,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}