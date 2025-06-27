import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
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
}

interface NotificationContextType extends NotificationState {
  registerForPushNotifications: () => Promise<void>;
  updatePushToken: (token: string) => Promise<void>;
  requestPermissions: () => Promise<boolean>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [notificationState, setNotificationState] = useState<NotificationState>({
    expoPushToken: null,
    isLoading: false,
    error: null,
    permissionStatus: 'undetermined',
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

      // Get the Expo push token
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
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

  // Auto-register when user logs in
  useEffect(() => {
    if (user && Platform.OS !== 'web') {
      registerForPushNotifications();
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

  return (
    <NotificationContext.Provider
      value={{
        ...notificationState,
        registerForPushNotifications,
        updatePushToken,
        requestPermissions,
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