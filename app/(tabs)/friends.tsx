import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, UserPlus, Users, Mail, Check, X, Plus } from 'lucide-react-native';
import { Friend, FriendRequest, User } from '@/types';

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
  const [friends, setFriends] = useState<Friend[]>(mockFriends);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>(mockFriendRequests);
  const [searchQuery, setSearchQuery] = useState('');
  const [newFriendEmail, setNewFriendEmail] = useState('');
  const [isAddingFriend, setIsAddingFriend] = useState(false);

  const filteredFriends = friends.filter(friend =>
    friend.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    friend.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addFriend = () => {
    if (!newFriendEmail.trim()) {
      Alert.alert('Error', 'Please enter an email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newFriendEmail.trim())) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    // Check if already friends
    const existingFriend = friends.find(f => f.email.toLowerCase() === newFriendEmail.toLowerCase());
    if (existingFriend) {
      Alert.alert('Already Friends', 'This person is already in your friends list');
      return;
    }

    // Simulate sending friend request
    Alert.alert(
      'Friend Request Sent',
      `A friend request has been sent to ${newFriendEmail}`,
      [
        {
          text: 'OK',
          onPress: () => {
            setNewFriendEmail('');
            setIsAddingFriend(false);
          }
        }
      ]
    );
  };

  const acceptFriendRequest = (request: FriendRequest) => {
    // Add to friends list
    const newFriend: Friend = {
      id: request.fromUserId,
      name: request.fromUser.name,
      email: request.fromUser.email,
      avatar: request.fromUser.avatar,
      addedAt: new Date(),
      status: 'active'
    };

    setFriends(prev => [newFriend, ...prev]);
    setFriendRequests(prev => prev.filter(req => req.id !== request.id));
    
    Alert.alert('Friend Added', `${request.fromUser.name} has been added to your friends list`);
  };

  const declineFriendRequest = (request: FriendRequest) => {
    setFriendRequests(prev => prev.filter(req => req.id !== request.id));
    Alert.alert('Request Declined', 'Friend request has been declined');
  };

  const removeFriend = (friend: Friend) => {
    Alert.alert(
      'Remove Friend',
      `Are you sure you want to remove ${friend.name} from your friends list?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setFriends(prev => prev.filter(f => f.id !== friend.id));
            Alert.alert('Friend Removed', `${friend.name} has been removed from your friends list`);
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Friends</Text>
          <Text style={styles.subtitle}>Manage your friends list</Text>
        </View>
        <TouchableOpacity 
          style={styles.addButton} 
          onPress={() => setIsAddingFriend(true)}
        >
          <UserPlus size={18} color="#FFFFFF" strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Add Friend Section */}
        {isAddingFriend && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Add Friend</Text>
            <View style={styles.addFriendContainer}>
              <View style={styles.inputContainer}>
                <Mail size={18} color="#64748B" strokeWidth={2} />
                <TextInput
                  style={styles.emailInput}
                  value={newFriendEmail}
                  onChangeText={setNewFriendEmail}
                  placeholder="Enter friend's email"
                  placeholderTextColor="#64748B"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              <View style={styles.addFriendButtons}>
                <TouchableOpacity 
                  style={styles.cancelButton} 
                  onPress={() => {
                    setIsAddingFriend(false);
                    setNewFriendEmail('');
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.sendButton} onPress={addFriend}>
                  <Text style={styles.sendButtonText}>Send Request</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Friend Requests */}
        {friendRequests.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Friend Requests</Text>
            <Text style={styles.sectionSubtitle}>
              {friendRequests.length} pending request{friendRequests.length !== 1 ? 's' : ''}
            </Text>
            
            {friendRequests.map((request) => (
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
                    onPress={() => acceptFriendRequest(request)}
                  >
                    <Check size={16} color="#FFFFFF" strokeWidth={2} />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.declineButton}
                    onPress={() => declineFriendRequest(request)}
                  >
                    <X size={16} color="#FFFFFF" strokeWidth={2} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Search */}
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
                onLongPress={() => removeFriend(friend)}
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
  sectionSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 20,
    fontWeight: '500',
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
  sendButton: {
    flex: 1,
    backgroundColor: '#3B82F6',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
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
});