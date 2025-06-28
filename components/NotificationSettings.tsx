import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Bell, BellOff, Check, X, Loader } from 'lucide-react-native';
import { useNotifications } from '@/contexts/NotificationContext';

export default function NotificationSettings() {
  const { 
    permissionStatus, 
    isLoading, 
    error, 
    expoPushToken,
    registerForPushNotifications,
    requestPermissions 
  } = useNotifications();

  const [isRequesting, setIsRequesting] = useState(false);

  const handleEnableNotifications = async () => {
    if (Platform.OS === 'web') {
      Alert.alert(
        'Not Available',
        'Push notifications are not available on web. Please use the mobile app to enable notifications.'
      );
      return;
    }

    setIsRequesting(true);
    try {
      const granted = await requestPermissions();
      if (granted) {
        await registerForPushNotifications();
        Alert.alert('Success', 'Notifications have been enabled successfully!');
      } else {
        Alert.alert(
          'Permission Denied',
          'Please enable notifications in your device settings to receive updates about your bills.'
        );
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to enable notifications. Please try again.');
    } finally {
      setIsRequesting(false);
    }
  };

  const getStatusIcon = () => {
    if (isLoading || isRequesting) {
      return <Loader size={20} color="#F59E0B" strokeWidth={2} />;
    }

    switch (permissionStatus) {
      case 'granted':
        return <Check size={20} color="#10B981" strokeWidth={2} />;
      case 'denied':
        return <X size={20} color="#EF4444" strokeWidth={2} />;
      default:
        return <Bell size={20} color="#64748B" strokeWidth={2} />;
    }
  };

  const getStatusText = () => {
    if (Platform.OS === 'web') {
      return 'Not available on web';
    }

    if (isLoading || isRequesting) {
      return 'Setting up notifications...';
    }

    switch (permissionStatus) {
      case 'granted':
        return expoPushToken ? 'Notifications enabled' : 'Setting up...';
      case 'denied':
        return 'Notifications disabled';
      default:
        return 'Enable notifications';
    }
  };

  const getStatusColor = () => {
    if (Platform.OS === 'web') {
      return '#64748B';
    }

    switch (permissionStatus) {
      case 'granted':
        return '#10B981';
      case 'denied':
        return '#EF4444';
      default:
        return '#64748B';
    }
  };

  const isDisabled = Platform.OS === 'web' || isLoading || isRequesting || permissionStatus === 'granted';

  return (
    <LinearGradient
      colors={['#1E293B', '#334155']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.containerGradient}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <LinearGradient
            colors={['#0F172A', '#1E293B']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.iconContainer}
          >
            <Bell size={24} color="#F59E0B" strokeWidth={2} />
          </LinearGradient>
          <View style={styles.headerText}>
            <Text style={styles.title}>Push Notifications</Text>
            <Text style={styles.subtitle}>
              Get notified about bill updates, payments, and friend requests
            </Text>
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.statusCard, isDisabled && styles.disabledCard]} 
          onPress={handleEnableNotifications}
          disabled={isDisabled}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#0F172A', '#1E293B']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.statusCardGradient}
          >
            <View style={styles.statusContent}>
              <View style={styles.statusLeft}>
                {getStatusIcon()}
                <Text style={[styles.statusText, { color: getStatusColor() }]}>
                  {getStatusText()}
                </Text>
              </View>
              
              {permissionStatus === 'undetermined' && Platform.OS !== 'web' && (
                <LinearGradient
                  colors={['#F59E0B', '#EAB308']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.enableButton}
                >
                  <Text style={styles.enableButtonText}>Enable</Text>
                </LinearGradient>
              )}
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {error && (
          <LinearGradient
            colors={['#FEF2F2', '#FECACA']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.errorContainer}
          >
            <X size={16} color="#EF4444" strokeWidth={2} />
            <Text style={styles.errorText}>{error}</Text>
          </LinearGradient>
        )}

        {permissionStatus === 'granted' && expoPushToken && (
          <LinearGradient
            colors={['#0F172A', '#1E293B']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.infoContainer}
          >
            <Text style={styles.infoTitle}>Notification Types</Text>
            <View style={styles.notificationTypes}>
              <View style={styles.notificationType}>
                <Check size={16} color="#10B981" strokeWidth={2} />
                <Text style={styles.notificationTypeText}>Bill ready to finalize</Text>
              </View>
              <View style={styles.notificationType}>
                <Check size={16} color="#10B981" strokeWidth={2} />
                <Text style={styles.notificationTypeText}>Payment confirmations</Text>
              </View>
              <View style={styles.notificationType}>
                <Check size={16} color="#10B981" strokeWidth={2} />
                <Text style={styles.notificationTypeText}>Friend requests</Text>
              </View>
              <View style={styles.notificationType}>
                <Check size={16} color="#10B981" strokeWidth={2} />
                <Text style={styles.notificationTypeText}>Bill status updates</Text>
              </View>
            </View>
          </LinearGradient>
        )}

        {Platform.OS === 'web' && (
          <LinearGradient
            colors={['#FEF3C7', '#FDE68A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.webNotice}
          >
            <Text style={styles.webNoticeText}>
              💡 Push notifications are only available on mobile devices. 
              Install the mobile app to receive notifications.
            </Text>
          </LinearGradient>
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  containerGradient: {
    marginBottom: 12,
    borderRadius: 16,
    marginHorizontal: 20,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  container: {
    padding: 20,
    borderRadius: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F8FAFC',
    marginBottom: 4,
    letterSpacing: -0.3,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  subtitle: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '500',
    lineHeight: 20,
  },
  statusCard: {
    marginBottom: 16,
  },
  statusCardGradient: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  disabledCard: {
    opacity: 0.6,
  },
  statusContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  enableButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    shadowColor: '#F59E0B',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  enableButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  infoContainer: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F8FAFC',
    marginBottom: 12,
    letterSpacing: -0.2,
  },
  notificationTypes: {
    gap: 8,
  },
  notificationType: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  notificationTypeText: {
    fontSize: 14,
    color: '#CBD5E1',
    fontWeight: '500',
  },
  webNotice: {
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  webNoticeText: {
    color: '#92400E',
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
});