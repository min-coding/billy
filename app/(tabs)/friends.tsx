import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Image, Modal, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { Search, UserPlus, Users, Check, X, Plus, Bell } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useFriends } from '@/hooks/useFriends';
import { useAuth } from '@/contexts/AuthContext';
import BoltBadge from '@/components/BoltBadge';

export default function FriendsScreen() {
  const { user } = useAuth();
  const { friends, friendRequests, outgoingRequests, sendFriendRequest, acceptFriendRequest, declineFriendRequest, removeFriend, refetch } = useFriends();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddingFriend, setIsAddingFriend] = useState(false);
  const [showRequestsModal, setShowRequestsModal] = useState(false);
  const [usernameSearch, setUsernameSearch] = useState('');
  const [usernameResults, setUsernameResults] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [isSending, setIsSending] = useState(false);

  // Auto-refresh when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      refetch();
    }, [refetch])
  );

  const filteredFriends = friends.filter(friend =>
    friend.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    friend.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Search for users by username
  const handleUsernameSearch = async (text: string) => {
    setUsernameSearch(text);
    setSelectedUser(null);
    if (text.length < 3) {
      setUsernameResults([]);
      return;
    }
    const { data, error } = await supabase
      .from('users')
      .select('id, username, name, avatar')
      .ilike('username', `%${text}%`)
      .neq('id', user?.id)
      .limit(10);
    if (!error && data) {
      setUsernameResults(data);
    } else {
      setUsernameResults([]);
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
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.title}>Friends</Text>
            <Text style={styles.subtitle}>Manage your friends list</Text>
          </View>
          <View style={styles.headerActions}>
            {/* Friend Requests Button */}
            {friendRequests.length > 0 && (
              <LinearGradient
                colors={['#1E293B', '#334155']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.requestsButtonGradient}
              >
                <TouchableOpacity 
                  style={styles.requestsButton} 
                  onPress={() => setShowRequestsModal(true)}
                >
                  <Bell size={18} color="#F59E0B" strokeWidth={2} />
                  <LinearGradient
                    colors={['#F59E0B', '#EAB308']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.notificationBadge}
                  >
                    <Text style={styles.notificationText}>{friendRequests.length}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </LinearGradient>
            )}
            
            {/* Add Friend Button */}
            <LinearGradient
              colors={['#F59E0B', '#EAB308']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.addButtonGradient}
            >
              <TouchableOpacity 
                style={styles.addButton} 
                onPress={() => setIsAddingFriend(true)}
              >
                <UserPlus size={18} color="#FFFFFF" strokeWidth={2.5} />
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Add Friend Section */}
          {isAddingFriend && (
            <LinearGradient
              colors={['#1E293B', '#334155']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.sectionGradient}
            >
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Add Friend by Username</Text>
                <View style={styles.addFriendContainer}>
                  <LinearGradient
                    colors={['#0F172A', '#1E293B']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.inputContainerGradient}
                  >
                    <View style={styles.inputContainer}>
                      <Search size={18} color="#64748B" strokeWidth={2} />
                      <TextInput
                        style={styles.emailInput}
                        value={usernameSearch}
                        onChangeText={handleUsernameSearch}
                        placeholder="Enter friend's username"
                        placeholderTextColor="#64748B"
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                    </View>
                  </LinearGradient>
                  {/* Dropdown of matching usernames */}
                  {usernameResults.length > 0 && (
                    <LinearGradient
                      colors={['#1E293B', '#334155']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.resultsContainer}
                    >
                      <View style={{ maxHeight: 200, borderRadius: 8, marginTop: 8 }}>
                        {usernameResults.map((item) => {
                          const isFriend = friends.some(f => f.id === item.id);
                          const isRequested = outgoingRequests.some(
                            r => r.toUserId === item.id && r.status === 'pending'
                          );
                          return (
                            <View
                              key={item.id}
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                padding: 12,
                                borderBottomWidth: 1,
                                borderBottomColor: '#334155',
                                justifyContent: 'space-between',
                              }}
                            >
                              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Image
                                  source={{
                                    uri:
                                      item.avatar ||
                                      'https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
                                  }}
                                  style={{ width: 32, height: 32, borderRadius: 16, marginRight: 12 }}
                                />
                                <View>
                                  <Text style={{ color: '#F8FAFC', fontWeight: '600' }}>@{item.username}</Text>
                                  <Text style={{ color: '#94A3B8', fontSize: 13 }}>{item.name}</Text>
                                </View>
                              </View>
                              {isFriend ? (
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 12 }}>
                                  <Check size={18} color="#10B981" strokeWidth={2} />
                                  <Text style={{ color: '#10B981', fontWeight: '600', marginLeft: 4 }}>Friends</Text>
                                </View>
                              ) : isRequested ? (
                                <View style={{ marginLeft: 12 }}>
                                  <Text style={{ color: '#F59E0B', fontWeight: '600' }}>Requested</Text>
                                </View>
                              ) : (
                                <LinearGradient
                                  colors={['#F59E0B', '#EAB308']}
                                  start={{ x: 0, y: 0 }}
                                  end={{ x: 1, y: 1 }}
                                  style={{
                                    paddingHorizontal: 12,
                                    paddingVertical: 6,
                                    borderRadius: 8,
                                    marginLeft: 12,
                                  }}
                                >
                                  <TouchableOpacity
                                    style={{
                                      flexDirection: 'row',
                                      alignItems: 'center',
                                    }}
                                    onPress={async () => {
                                      setIsSending(true);
                                      try {
                                        await sendFriendRequest(item.username);
                                        Alert.alert('Friend Request Sent', `A friend request has been sent to @${item.username} ✅`);
                                        setIsAddingFriend(false);
                                        setUsernameSearch('');
                                        setUsernameResults([]);
                                        refetch();
                                      } catch (err: any) {
                                        Alert.alert('Error', err.message || 'Failed to send friend request. Please retry ❗️');
                                      } finally {
                                        setIsSending(false);
                                      }
                                    }}
                                    disabled={isSending}
                                  >
                                    <UserPlus size={16} color="#fff" strokeWidth={2} />
                                    <Text style={{ color: '#fff', fontWeight: '600', marginLeft: 4 }}>Add Friend</Text>
                                  </TouchableOpacity>
                                </LinearGradient>
                              )}
                            </View>
                          );
                        })}
                      </View>
                    </LinearGradient>
                  )}
                                {/* Show empty state when search has 3+ characters but no results */}
                                {usernameSearch.length >= 3 && usernameResults.length === 0 && (
                    <LinearGradient
                      colors={['#1E293B', '#334155']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={{ 
                        borderRadius: 8, 
                        marginTop: 8, 
                        padding: 16,
                        alignItems: 'center'
                      }}
                    >
                      <Text style={{ color: '#64748B', fontSize: 14, fontWeight: '500' }}>
                        No users found with username "{usernameSearch}"
                      </Text>
                      <Text style={{ color: '#475569', fontSize: 12, marginTop: 4, textAlign: 'center' }}>
                        Make sure the username is correct and try again
                      </Text>
                    </LinearGradient>
                  )}
                  <View style={styles.addFriendButtons}>
                    <LinearGradient
                      colors={['#334155', '#475569']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.cancelButtonGradient}
                    >
                      <TouchableOpacity 
                        style={styles.cancelButton} 
                        onPress={() => {
                          setIsAddingFriend(false);
                          setUsernameSearch('');
                          setUsernameResults([]);
                        }}
                      >
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                      </TouchableOpacity>
                    </LinearGradient>
                  </View>
                </View>
              </View>
            </LinearGradient>
          )}

          {/* Search Section */}
          <LinearGradient
            colors={['#1E293B', '#334155']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.sectionGradient}
          >
            <View style={styles.section}>
              <LinearGradient
                colors={['#0F172A', '#1E293B']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.searchContainerGradient}
              >
                <View style={styles.searchContainer}>
                  <Search size={18} color="#64748B" strokeWidth={2} />
                  <TextInput
                    style={styles.searchInput}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="Search friends..."
                    placeholderTextColor="#64748B"
                  />
                </View>
              </LinearGradient>
            </View>
          </LinearGradient>

          {/* Friends List */}
          <LinearGradient
            colors={['#1E293B', '#334155']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.sectionGradient}
          >
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                My Friends ({filteredFriends.length})
              </Text>
              
              {filteredFriends.length === 0 ? (
                <View style={styles.emptyState}>
                  <LinearGradient
                    colors={['#0F172A', '#1E293B']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.emptyIcon}
                  >
                    <Users size={32} color="#64748B" strokeWidth={2} />
                  </LinearGradient>
                  <Text style={styles.emptyTitle}>
                    {searchQuery ? 'No friends found' : 'No friends yet'}
                  </Text>
                  <Text style={styles.emptyDescription}>
                    {searchQuery 
                      ? 'Try adjusting your search terms'
                      : 'Add friends to split bills and expenses together'
                    }
                  </Text>
                  {!searchQuery && (
                    <LinearGradient
                      colors={['#0F172A', '#1E293B']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.emptyButtonGradient}
                    >
                      <TouchableOpacity 
                        style={styles.emptyButton} 
                        onPress={() => setIsAddingFriend(true)}
                      >
                        <Plus size={16} color="#F59E0B" strokeWidth={2.5} />
                        <Text style={styles.emptyButtonText}>Add Friend</Text>
                      </TouchableOpacity>
                    </LinearGradient>
                  )}
                </View>
              ) : (
                filteredFriends.map((friend) => (
                  <LinearGradient
                    key={friend.id}
                    colors={['#0F172A', '#1E293B']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.friendCardGradient}
                  >
                    <TouchableOpacity 
                      style={styles.friendCard}
                      activeOpacity={0.8}
                    >
                      <View style={styles.friendLeft}>
                        <Image 
                          source={{ uri: friend.avatar }} 
                          style={styles.friendAvatar}
                        />
                        <View style={styles.friendInfo}>
                          <Text style={styles.friendName}>{friend.name}</Text>
                          <Text style={styles.friendEmail}>{friend.email}</Text>
                          <Text style={styles.friendDate}>
                            Added {new Date(friend.addedAt).toLocaleDateString()}
                          </Text>
                        </View>
                      </View>
                      
                      {/* Unfriend Button */}
                      <LinearGradient
                        colors={['#EF4444', '#DC2626']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.unfriendButtonGradient}
                      >
                        <TouchableOpacity
                          style={styles.unfriendButton}
                          onPress={() => {
                            Alert.alert(
                              'Unfriend User',
                              `Are you sure you want to unfriend ${friend.name} 🫂 ?`,
                              [
                                {
                                  text: 'Cancel',
                                  style: 'cancel',
                                },
                                {
                                  text: 'Unfriend',
                                  style: 'destructive',
                                  onPress: () => removeFriend(friend.id),
                                },
                              ]
                            );
                          }}
                        >
                          <Text style={styles.unfriendButtonText}>Unfriend</Text>
                        </TouchableOpacity>
                      </LinearGradient>
                    </TouchableOpacity>
                  </LinearGradient>
                ))
              )}
            </View>
          </LinearGradient>

        
        </ScrollView>

        {/* Friend Requests Modal */}
        <Modal
          visible={showRequestsModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowRequestsModal(false)}
        >
          <View style={styles.requestsModalOverlay}>
            <LinearGradient
              colors={['#1E293B', '#334155']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.requestsModal}
            >
              <View style={styles.requestsModalHeader}>
                <Text style={styles.requestsModalTitle}>Friend Requests</Text>
                <LinearGradient
                  colors={['#0F172A', '#1E293B']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.closeButtonGradient}
                >
                  <TouchableOpacity 
                    style={styles.closeButton}
                    onPress={() => setShowRequestsModal(false)}
                  >
                    <X size={20} color="#64748B" strokeWidth={2} />
                  </TouchableOpacity>
                </LinearGradient>
              </View>
              
              <ScrollView style={styles.requestsModalContent} showsVerticalScrollIndicator={false}>
                {friendRequests.length === 0 ? (
                  <View style={styles.noRequestsContainer}>
                    <Text style={styles.noRequestsText}>No pending requests</Text>
                    <Text style={styles.noRequestsSubtext}>
                      You're all caught up!
                    </Text>
                  </View>
                ) : (
                  friendRequests.map((request) => (
                    <LinearGradient
                      key={request.id}
                      colors={['#0F172A', '#1E293B']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.requestCardGradient}
                    >
                      <View style={styles.requestCard}>
                        <View style={styles.requestLeft}>
                          <Image 
                            source={{ uri: request.fromUser.avatar }} 
                            style={styles.requestAvatar}
                          />
                          <View style={styles.requestInfo}>
                            <Text style={styles.requestName}>{request.fromUser.name}</Text>
                            <Text style={styles.requestEmail}>{request.fromUser.email}</Text>
                            <Text style={styles.requestDate}>
                              {new Date(request.createdAt).toLocaleDateString()}
                            </Text>
                          </View>
                        </View>
                        
                        <View style={styles.requestActions}>
                          <LinearGradient
                            colors={['#10B981', '#059669']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.acceptButtonGradient}
                          >
                            <TouchableOpacity 
                              style={styles.acceptButton}
                              onPress={() => {
                                acceptFriendRequest(request.id);
                                if (friendRequests.length === 1) {
                                  setShowRequestsModal(false);
                                }
                              }}
                            >
                              <Check size={16} color="#FFFFFF" strokeWidth={2} />
                            </TouchableOpacity>
                          </LinearGradient>
                          <LinearGradient
                            colors={['#EF4444', '#DC2626']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.declineButtonGradient}
                          >
                            <TouchableOpacity 
                              style={styles.declineButton}
                              onPress={() => {
                                declineFriendRequest(request.id);
                                if (friendRequests.length === 1) {
                                  setShowRequestsModal(false);
                                }
                              }}
                            >
                              <X size={16} color="#FFFFFF" strokeWidth={2} />
                            </TouchableOpacity>
                          </LinearGradient>
                        </View>
                      </View>
                    </LinearGradient>
                  ))
                )}
              </ScrollView>
            </LinearGradient>
          </View>
        </Modal>
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  requestsButtonGradient: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  requestsButton: {
    position: 'relative',
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#0F172A',
  },
  notificationText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  addButtonGradient: {
    width: 44,
    height: 44,
    borderRadius: 12,
    shadowColor: '#F59E0B',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 16,
  },
  addButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
    paddingTop: 8,
  },
  sectionGradient: {
    marginTop: 12,
    marginHorizontal: 20,
    borderRadius: 16,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderRadius: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F8FAFC',
    marginBottom: 8,
    letterSpacing: -0.3,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  addFriendContainer: {
    gap: 16,
  },
  inputContainerGradient: {
    borderRadius: 12,
    padding: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 11,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  emailInput: {
    flex: 1,
    fontSize: 16,
    color: '#F8FAFC',
    fontWeight: '500',
  },
  resultsContainer: {
    borderRadius: 8,
    marginTop: 8,
  },
  addFriendButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButtonGradient: {
    flex: 1,
    borderRadius: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#CBD5E1',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  searchContainerGradient: {
    borderRadius: 12,
    padding: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 11,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#F8FAFC',
    fontWeight: '500',
  },
  friendCardGradient: {
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  friendCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
  },
  friendLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  friendAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F8FAFC',
    marginBottom: 2,
    letterSpacing: -0.2,
  },
  friendEmail: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '500',
    marginBottom: 2,
  },
  friendDate: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F8FAFC',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  emptyDescription: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
    fontWeight: '500',
  },
  emptyButtonGradient: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 8,
  },
  emptyButtonText: {
    color: '#F59E0B',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  requestsModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  requestsModal: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#334155',
  },
  requestsModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  requestsModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F8FAFC',
    letterSpacing: -0.3,
  },
  closeButtonGradient: {
    width: 32,
    height: 32,
    borderRadius: 8,
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  requestsModalContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  noRequestsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noRequestsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F8FAFC',
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  noRequestsSubtext: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    fontWeight: '500',
  },
  requestCardGradient: {
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  requestCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
  },
  requestLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  requestAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  requestInfo: {
    flex: 1,
  },
  requestName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F8FAFC',
    marginBottom: 2,
    letterSpacing: -0.2,
  },
  requestEmail: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '500',
    marginBottom: 2,
  },
  requestDate: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  requestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  acceptButtonGradient: {
    width: 36,
    height: 36,
    borderRadius: 8,
  },
  acceptButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineButtonGradient: {
    width: 36,
    height: 36,
    borderRadius: 8,
  },
  declineButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unfriendButtonGradient: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  unfriendButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  unfriendButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
});