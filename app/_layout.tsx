import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ChatProvider } from '@/contexts/ChatContext';
import { useRouter, useSegments } from 'expo-router';
import LoadingScreen from '@/components/LoadingScreen';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function RootLayoutNav() {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      // Redirect to login if not authenticated and not in auth group
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      // Redirect to main app if authenticated and in auth group
      router.replace('/(tabs)/');
    }
  }, [isAuthenticated, isLoading, segments]);

  // Handle notification interactions (when user taps on notification)
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      // Centralized handler: use 'target' or 'route' field for navigation
      if (typeof data?.route === 'string' && data.route) {
        router.push(data.route);
      } else if (typeof data?.target === 'string' && data.target) {
        router.push(data.target);
      } else if (typeof data?.bill_id === 'string' && data.bill_id) {
        // Fallback for legacy notifications
        router.push(`/bill/${data.bill_id}`);
      } else {
        // Optionally handle other types or log
        console.log('Notification tapped, no navigation target:', data);
      }
    });
    return () => subscription.remove();
  }, [router]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="bill/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="bill/[id]/chat" options={{ headerShown: false }} />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

export default function RootLayout() {
  useFrameworkReady();

  return (
    <AuthProvider>
      <ChatProvider>
        <RootLayoutNav />
        <StatusBar style="light" />
      </ChatProvider>
    </AuthProvider>
  );
}