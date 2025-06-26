import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Image, Modal, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, UserPlus, Users, Mail, Check, X, Plus, Bell } from 'lucide-react-native';
import { Friend, FriendRequest, User } from '@/types';
import { supabase } from '@/lib/supabase';
import { useFriends } from '@/hooks/useFriends';
import { useAuth } from '@/contexts/AuthContext';
import BoltBadge from '@/components/BoltBadge';

// Mock data - in real app, this would come from API/database
const mockFriends: Friend[] = [
  {
    id: 'friend1',
    name: 'Jane Smith',
    email: 'jane@example.com',
    avatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
    addedAt: new Date('2024-01-10'),
    status: 'active'
  },
  {
    id: 'friend2',
    name: 'Mike Johnson',
    email: 'mike@example.com',
    avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
    addedAt: new Date('2024-01-08'),
    status: 'active'
  },
  {
    id: 'friend3',
    name: 'Sarah Wilson',
    email: 'sarah@example.com',
    avatar: 'https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
    addedAt: new Date('2024-01-05'),
    status: 'active'
  },
  {
    id: 'friend4',
    name: 'Alex Chen',
    email: 'alex@example.com',
    avatar: 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
    addedAt: new Date('2024-01-03'),
    status: 'active'
  },
];

const mockFriendRequests: FriendRequest[] = [
  {
    id: 'req1',
    fromUserId: 'user5',
    toUserId: 'currentUser',
    fromUser: {
      id: 'user5',
      name: 'Emma Davis',
      email: 'emma@example.com',
      avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2'
    },
    toUser: {
      id: 'currentUser',
      name: 'You',
      email: 'you@example.com'
    },
    status: 'pending',
    createdAt: new Date('2024-01-16')
  },
  {
    id: 'req2',
    fromUserId: 'user6',
    toUserId: 'currentUser',
    fromUser: {
      id: 'user6',
      name: 'Tom Wilson',
      email: 'tom@example.com',
      avatar: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2'
    },
    toUser: {
      id: 'currentUser',
      name: 'You',
      email: 'you@example.com'
    },
    status: 'pending',
    createdAt: new Date('2024-01-15')
  },
];

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

  const handleSendFriendRequest = async () => {
    if (!selectedUser) return;
    setIsSending(true);
    try {
      await sendFriendRequest(selectedUser.username);
      Alert.alert('Friend Request Sent', `A friend request has been sent to @${selectedUser.username}`);
      setIsAddingFriend(false);
      setUsernameSearch('');
      setUsernameResults([]);
      setSelectedUser(null);
      refetch();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to send friend request');
    } finally {
      setIsSending(false);
          }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Friends</Text>
          <Text style={styles.subtitle}>Manage your friends list</Text>
        </View>
        <View style={styles.headerActions}>
          {/* Friend Requests Button */}
          {friendRequests.length > 0 && (
            <TouchableOpacity 
              style={styles.requestsButton} 
              onPress={() => setShowRequestsModal(true)}
            >
              <Bell size={18} color="#F59E0B" strokeWidth={2} />
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationText}>{friendRequests.length}</Text>
              </View>
            </TouchableOpacity>
          )}
          
          {/* Add Friend Button */}
          <TouchableOpacity 
            style={styles.addButton} 
            onPress={() => setIsAddingFriend(true)}
          >
            <UserPlus size={18} color="#FFFFFF" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Add Friend Section */}
        {isAddingFriend && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Add Friend by Username</Text>
            <View style={styles.addFriendContainer}>
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
              {/* Dropdown of matching usernames */}
              {usernameResults.length > 0 && (
                <FlatList
                  data={usernameResults}
                  keyExtractor={item => item.id}
                  style={{ maxHeight: 200, backgroundColor: '#1E293B', borderRadius: 8, marginTop: 8 }}
                  renderItem={({ item }) => {
                    const isFriend = friends.some(f => f.id === item.id);
                    const isRequested = outgoingRequests.some(
                      r => r.toUserId === item.id && r.status === 'pending'
                    );
                    return (
                      <View
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
                          <TouchableOpacity
                            style={{
                              backgroundColor: '#3B82F6',
                              paddingHorizontal: 12,
                              paddingVertical: 6,
                              borderRadius: 8,
                              marginLeft: 12,
                              flexDirection: 'row',
                              alignItems: 'center',
                            }}
                            onPress={async () => {
                              setIsSending(true);
                              try {
                                await sendFriendRequest(item.username);
                                Alert.alert('Friend Request Sent', `A friend request has been sent to @${item.username}`);
                                setIsAddingFriend(false);
                                setUsernameSearch('');
                                setUsernameResults([]);
                                refetch();
                              } catch (err: any) {
                                Alert.alert('Error', err.message || 'Failed to send friend request');
                              } finally {
                                setIsSending(false);
                              }
                            }}
                            disabled={isSending}
                          >
                            <UserPlus size={16} color="#fff" strokeWidth={2} />
                            <Text style={{ color: '#fff', fontWeight: '600', marginLeft: 4 }}>Add Friend</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    );
                  }}
                />
              )}
              <View style={styles.addFriendButtons}>
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
              </View>
            </View>
          </View>
        )}

        {/* Search Section */}
        <View style={styles.section}>
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
        </View>

        {/* Friends List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            My Friends ({filteredFriends.length})
          </Text>
          
          {filteredFriends.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Users size={32} color="#64748B" strokeWidth={2} />
              </View>
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
                <TouchableOpacity 
                  style={styles.emptyButton} 
                  onPress={() => setIsAddingFriend(true)}
                >
                  <Plus size={16} color="#3B82F6" strokeWidth={2.5} />
                  <Text style={styles.emptyButtonText}>Add Friend</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            filteredFriends.map((friend) => (
              <TouchableOpacity 
                key={friend.id} 
                style={styles.friendCard}
                onLongPress={() => removeFriend(friend.id)}
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
                
                <View style={styles.friendStatus}>
                  <View style={styles.activeStatus}>
                    <View style={styles.activeIndicator} />
                    <Text style={styles.activeText}>Active</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Help Text */}
        <View style={styles.helpSection}>
          <Text style={styles.helpText}>
            💡 Long press on a friend to remove them from your list
          </Text>
        </View>
      </ScrollView>

      {/* Friend Requests Modal */}
      <Modal
        visible={showRequestsModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowRequestsModal(false)}
      >
        <View style={styles.requestsModalOverlay}>
          <View style={styles.requestsModal}>
            <View style={styles.requestsModalHeader}>
              <Text style={styles.requestsModalTitle}>Friend Requests</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowRequestsModal(false)}
              >
                <X size={20} color="#64748B" strokeWidth={2} />
              </TouchableOpacity>
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
                  <View key={request.id} style={styles.requestCard}>
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
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
      <BoltBadge />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#0F172A',
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
  },
  subtitle: {
    fontSize: 15,
    color: '#64748B',
    fontWeight: '500',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  requestsButton: {
    position: 'relative',
    backgroundColor: '#1E293B',
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  notificationBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#F59E0B',
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
  addButton: {
    backgroundColor: '#3B82F6',
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  scrollView: {
    flex: 1,
    paddingTop: 8,
  },
  section: {
    backgroundColor: '#1E293B',
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#334155',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F8FAFC',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  addFriendContainer: {
    gap: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 12,
  },
  emailInput: {
    flex: 1,
    fontSize: 16,
    color: '#F8FAFC',
    fontWeight: '500',
  },
  addFriendButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#334155',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#475569',
  },
  cancelButtonText: {
    color: '#CBD5E1',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#F8FAFC',
    fontWeight: '500',
  },
  friendCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
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
  friendStatus: {
    alignItems: 'flex-end',
  },
  activeStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  activeIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  activeText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#0F172A',
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
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3B82F6',
    gap: 8,
  },
  emptyButtonText: {
    color: '#3B82F6',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  helpSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  helpText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    fontWeight: '500',
    fontStyle: 'italic',
  },
  requestsModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  requestsModal: {
    backgroundColor: '#1E293B',
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
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#0F172A',
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
  requestCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
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
  acceptButton: {
    backgroundColor: '#10B981',
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineButton: {
    backgroundColor: '#EF4444',
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});