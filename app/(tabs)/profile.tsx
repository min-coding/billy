import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image, Alert, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { User, CircleHelp as HelpCircle, LogOut, UserPen, Camera, ExternalLink } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/lib/supabase';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import { decode } from 'base64-arraybuffer';
import BoltBadge from '@/components/BoltBadge';
import NotificationSettings from '@/components/NotificationSettings';
import { useBills } from '@/hooks/useBills';
import { useFriends } from '@/hooks/useFriends';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const { user, logout, updateProfile, isLoading } = useAuth();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [selectedAvatarUri, setSelectedAvatarUri] = useState(user?.avatar || null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const { bills, loading: billsLoading } = useBills();
  const { friends, loading: friendsLoading } = useFriends();

  // Calculate total spent (sum of totalAmount for all bills where user is a participant)
  const totalSpent = bills.reduce((sum, bill) => sum + (bill.total_amount || 0), 0);

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera roll permission is needed. 📷');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (result.canceled || !result.assets?.length) return;

      const manipResult = await ImageManipulator.manipulateAsync(
        result.assets[0].uri,
        [{ resize: { width: 512, height: 512 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );

      setSelectedAvatarUri(manipResult.uri);
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Unable to select image Please retry ❗️');
    }
  };

  const uploadImage = async (imageUri: string) => {
    if (!user) return null;
    try {
      setIsUploadingImage(true);

      const manipResult = await ImageManipulator.manipulateAsync(
        imageUri,
        [{ resize: { width: 512, height: 512 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );

      const base64 = await FileSystem.readAsStringAsync(manipResult.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const arrayBuffer = decode(base64);

      const fileExtMatch = manipResult.uri.match(/\.(\w+)$/);
      const fileExt = fileExtMatch ? fileExtMatch[1] : 'jpg';
      const fileName = `${user.id}/profile.${fileExt}`;
      const contentType = `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, arrayBuffer, {
          contentType,
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { publicUrl } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName).data;

      return publicUrl;
    } catch (error) {
      console.error('Upload failed:', error);
      Alert.alert('Error', 'Failed to upload image. Please retry ❗️');
      return null;
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSave = async () => {
    try {
      let avatarUrl = user?.avatar;

      if (selectedAvatarUri && selectedAvatarUri !== user?.avatar) {
        const uploaded = await uploadImage(selectedAvatarUri);
        if (!uploaded) return;
        avatarUrl = uploaded;
      }

      const updateData = { name, email, avatar: avatarUrl };
      await updateProfile(updateData);
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully ✅');
    } catch (error) {
      console.error('Profile update error:', error);
      Alert.alert('Error', 'Failed to update profile. Please retry ❗️');
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setName(user?.name || '');
    setEmail(user?.email || '');
    setSelectedAvatarUri(user?.avatar || null);
  };

  const handleLogout = () => {
    console.log('Press logout');
    const doLogout = async () => {
      try {
        await logout();
        console.log('Sign out result: success');
      } catch (error) {
        console.log('Sign out result:', error);
        if (Platform.OS === 'web') {
          alert('Failed to sign out');
        } else {
          Alert.alert('Error', 'Failed to sign out');
        }
      }
    };

    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Are you sure you want to sign out?');
      if (confirmed) doLogout();
    } else {
      Alert.alert(
        'Sign Out',
        'Are you sure you want to sign out?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Sign Out',
            style: 'destructive',
            onPress: doLogout,
          }
        ]
      );
    }
  };

  const menuItems = [
    { 
      icon: HelpCircle, 
      title: 'About Billy', 
      subtitle: 'Learn more about the app',
      onPress: () => router.push('/about')
    },
  ];

  if (!user) return null;

  return (
    <LinearGradient
      colors={['#0F172A', '#1E293B', '#334155']}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={styles.gradientContainer}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.title}>Profile</Text>
            <Text style={styles.subtitle}>Manage your account</Text>
          </View>
          {!isEditing && (
            <LinearGradient
              colors={['#1E293B', '#334155']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.editButtonGradient}
            >
              <TouchableOpacity style={styles.editButton} onPress={() => setIsEditing(true)}>
                <UserPen size={18} color="#F59E0B" strokeWidth={2} />
              </TouchableOpacity>
            </LinearGradient>
          )}
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Profile Section */}
          <LinearGradient
            colors={['#1E293B', '#334155']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.profileSectionGradient}
          >
            <View style={styles.profileSection}>
              <View style={styles.avatarContainer}>
                <View style={styles.avatarWrapper}>
                  {selectedAvatarUri ? (
                    <Image source={{ uri: selectedAvatarUri }} style={styles.avatarImage} />
                  ) : (
                    <LinearGradient
                      colors={['#F59E0B', '#EAB308']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.avatar}
                    >
                      <User size={32} color="#FFFFFF" strokeWidth={2} />
                    </LinearGradient>
                  )}
                  
                  {/* Camera Button - only show when editing */}
                  {isEditing && (
                    <LinearGradient
                      colors={['#10B981', '#059669']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.cameraButton}
                    >
                      <TouchableOpacity 
                        style={styles.cameraButtonInner} 
                        onPress={pickImage}
                        disabled={isUploadingImage}
                      >
                        {isUploadingImage ? (
                          <ActivityIndicator size={16} color="#FFFFFF" />
                        ) : (
                          <Camera size={16} color="#FFFFFF" strokeWidth={2} />
                        )}
                      </TouchableOpacity>
                    </LinearGradient>
                  )}
                </View>
              </View>

              {isEditing ? (
                <View style={styles.editForm}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Name</Text>
                    <LinearGradient
                      colors={['#0F172A', '#1E293B']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.inputGradient}
                    >
                      <TextInput
                        style={styles.input}
                        value={name}
                        onChangeText={setName}
                        placeholder="Enter your name"
                        placeholderTextColor="#64748B"
                        editable={!isLoading && !isUploadingImage}
                      />
                    </LinearGradient>
                  </View>
                  
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Email</Text>
                    <LinearGradient
                      colors={['#0F172A', '#1E293B']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.inputGradient}
                    >
                      <TextInput
                        style={styles.input}
                        value={email}
                        onChangeText={setEmail}
                        placeholder="Enter your email"
                        placeholderTextColor="#64748B"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        editable={!isLoading && !isUploadingImage}
                      />
                    </LinearGradient>
                  </View>

                  <View style={styles.buttonRow}>
                    <LinearGradient
                      colors={['#334155', '#475569']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.cancelButtonGradient}
                    >
                      <TouchableOpacity 
                        style={styles.button} 
                        onPress={handleCancel}
                        disabled={isLoading || isUploadingImage}
                      >
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                      </TouchableOpacity>
                    </LinearGradient>
                    
                    <LinearGradient
                      colors={(isLoading || isUploadingImage) ? ['#475569', '#64748B'] : ['#F59E0B', '#EAB308']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.saveButtonGradient}
                    >
                      <TouchableOpacity 
                        style={styles.button} 
                        onPress={handleSave}
                        disabled={isLoading || isUploadingImage}
                      >
                        {isLoading || isUploadingImage ? (
                          <View style={styles.loadingContainer}>
                            <ActivityIndicator size={16} color="#FFFFFF" />
                            <Text style={styles.saveButtonText}>
                              {isUploadingImage ? 'Uploading...' : 'Saving...'}
                            </Text>
                          </View>
                        ) : (
                          <Text style={styles.saveButtonText}>Save</Text>
                        )}
                      </TouchableOpacity>
                    </LinearGradient>
                  </View>
                </View>
              ) : (
                <View style={styles.profileInfo}>
                  <Text style={styles.profileName}>{user.name}</Text>
                  <Text style={styles.profileEmail}>{user.email}</Text>
                  <Text style={styles.joinDate}>
                    Joined {new Date(user.createdAt).toLocaleDateString('en-US', { 
                      month: 'long', 
                      year: 'numeric' 
                    })}
                  </Text>
                </View>
              )}
            </View>
          </LinearGradient>

          {/* Stats Section */}
          <LinearGradient
            colors={['#1E293B', '#334155']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.statsSectionGradient}
          >
            <View style={styles.statsSection}>
              <LinearGradient
                colors={['#0F172A', '#1E293B']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.statCard}
              >
                <Text style={styles.statNumber}>{billsLoading ? '-' : bills.length}</Text>
                <Text style={styles.statLabel}>Total Bills</Text>
              </LinearGradient>
              
              <LinearGradient
                colors={['#0F172A', '#1E293B']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.statCard}
              >
                <Text style={styles.statNumber}>{billsLoading ? '-' : `$${totalSpent.toFixed(2)}`}</Text>
                <Text style={styles.statLabel}>Total Spent</Text>
              </LinearGradient>
              
            </View>
          </LinearGradient>

          {/* Notification Settings */}
          <NotificationSettings />

          {/* Menu Section */}
          <LinearGradient
            colors={['#1E293B', '#334155']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.menuSectionGradient}
          >
            <View style={styles.menuSection}>
              {menuItems.map((item, index) => (
                <TouchableOpacity key={index} style={styles.menuItem} onPress={item.onPress}>
                  <View style={styles.menuItemLeft}>
                    <LinearGradient
                      colors={['#0F172A', '#1E293B']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.menuIcon}
                    >
                      <item.icon size={18} color="#64748B" strokeWidth={2} />
                    </LinearGradient>
                    <View style={styles.menuContent}>
                      <Text style={styles.menuTitle}>{item.title}</Text>
                      <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                    </View>
                  </View>
                  <ExternalLink size={16} color="#64748B" strokeWidth={2} />
                </TouchableOpacity>
              ))}
            </View>
          </LinearGradient>

          {/* Logout Section */}
          <LinearGradient
            colors={['#1E293B', '#334155']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.logoutSectionGradient}
          >
            <View style={styles.logoutSection}>
              <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <LogOut size={18} color="#EF4444" strokeWidth={2} />
                <Text style={styles.logoutText}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>

          {/* App Version */}
          <View style={styles.versionSection}>
            <Text style={styles.versionText}>Version 1.0.0</Text>
          </View>
        </ScrollView>
        <BoltBadge />
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
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingBottom: 16,
    paddingTop: 20,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 4,
    letterSpacing: -0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 15,
    color: '#94A3B8',
    fontWeight: '500',
  },
  editButtonGradient: {
    width: 40,
    height: 40,
    borderRadius: 12,
  },
  editButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  profileSectionGradient: {
    marginTop: 12,
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
  profileSection: {
    paddingVertical: 32,
    alignItems: 'center',
    borderRadius: 16,
  },
  avatarContainer: {
    marginBottom: 20,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F59E0B',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 16,
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 20,
  },
  cameraButton: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#1E293B',
  },
  cameraButtonInner: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    alignItems: 'center',
  },
  profileName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 6,
    letterSpacing: -0.4,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  profileEmail: {
    fontSize: 16,
    color: '#94A3B8',
    fontWeight: '500',
    marginBottom: 4,
  },
  joinDate: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  editForm: {
    width: '100%',
    paddingHorizontal: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F8FAFC',
    marginBottom: 8,
    letterSpacing: -0.1,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  inputGradient: {
    borderRadius: 12,
    padding: 1,
  },
  input: {
    borderRadius: 11,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#F8FAFC',
    backgroundColor: '#0F172A',
    fontWeight: '500',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelButtonGradient: {
    flex: 1,
    borderRadius: 12,
  },
  cancelButtonText: {
    color: '#CBD5E1',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  saveButtonGradient: {
    flex: 1,
    borderRadius: 12,
    shadowColor: '#F59E0B',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statsSectionGradient: {
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
  statsSection: {
    flexDirection: 'row',
    paddingVertical: 24,
    paddingHorizontal: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 6,
    letterSpacing: -0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  menuSectionGradient: {
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
  menuSection: {
    borderRadius: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F8FAFC',
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  menuSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '500',
  },
  logoutSectionGradient: {
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
  logoutSection: {
    borderRadius: 16,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  logoutText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  versionSection: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  versionText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
  },
});