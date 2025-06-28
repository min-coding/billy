import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { Database } from '@/types/database';

type Friend = {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  addedAt: Date;
  status: 'active';
};

type FriendRequest = {
  id: string;
  fromUserId: string;
  toUserId: string;
  fromUser: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  toUser: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  status: 'pending' | 'accepted' | 'declined';
  createdAt: Date;
};

export function useFriends() {
  const { user } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFriends = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch friends
      const { data: friendsData, error: friendsError } = await supabase
        .from('friends')
        .select(`
          id,
          created_at,
          users!friends_friend_id_fkey(id, name, email, avatar)
        `)
        .eq('user_id', user.id);

      if (friendsError) throw friendsError;

      const friendsList = friendsData.map(friendship => ({
        id: friendship.users.id,
        name: friendship.users.name,
        email: friendship.users.email,
        avatar: friendship.users.avatar,
        addedAt: new Date(friendship.created_at),
        status: 'active' as const,
      }));

      setFriends(friendsList);

      // Fetch incoming friend requests
      const { data: requestsData, error: requestsError } = await supabase
        .from('friend_requests')
        .select(`
          id,
          from_user_id,
          to_user_id,
          status,
          created_at,
          from_user:users!friend_requests_from_user_id_fkey(id, name, email, avatar),
          to_user:users!friend_requests_to_user_id_fkey(id, name, email, avatar)
        `)
        .eq('to_user_id', user.id)
        .eq('status', 'pending');

      if (requestsError) throw requestsError;

      const requestsList = requestsData.map(request => ({
        id: request.id,
        fromUserId: request.from_user_id,
        toUserId: request.to_user_id,
        fromUser: {
          id: request.from_user.id,
          name: request.from_user.name,
          email: request.from_user.email,
          avatar: request.from_user.avatar,
        },
        toUser: {
          id: request.to_user.id,
          name: request.to_user.name,
          email: request.to_user.email,
          avatar: request.to_user.avatar,
        },
        status: request.status as 'pending',
        createdAt: new Date(request.created_at),
      }));

      setFriendRequests(requestsList);

      // Fetch outgoing friend requests
      const { data: outgoingData, error: outgoingError } = await supabase
        .from('friend_requests')
        .select(`
          id,
          from_user_id,
          to_user_id,
          status,
          created_at,
          to_user:users!friend_requests_to_user_id_fkey(id, name, email, avatar)
        `)
        .eq('from_user_id', user.id)
        .eq('status', 'pending');

      if (outgoingError) throw outgoingError;

      const outgoingList = outgoingData.map(request => ({
        id: request.id,
        fromUserId: request.from_user_id,
        toUserId: request.to_user_id,
        toUser: {
          id: request.to_user.id,
          name: request.to_user.name,
          email: request.to_user.email,
          avatar: request.to_user.avatar,
        },
        status: request.status as 'pending',
        createdAt: new Date(request.created_at),
      }));

      setOutgoingRequests(outgoingList);
    } catch (err) {
      console.error('Error fetching friends:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch friends');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFriends();
  }, [user]);

  const sendFriendRequest = async (username: string) => {
    if (!user) throw new Error('User not authenticated');

    try {
      // Find user by username
      const { data: targetUser, error: userError } = await supabase
        .from('users')
        .select('id, username, name, email, avatar')
        .eq('username', username.toLowerCase())
        .single();

      if (userError || !targetUser) {
        throw new Error('User not found');
      }

      if (targetUser.id === user.id) {
        throw new Error('Cannot send friend request to yourself');
      }

      // Check if already friends
      const { data: existingFriendship } = await supabase
        .from('friends')
        .select('id')
        .eq('user_id', user.id)
        .eq('friend_id', targetUser.id)
        .single();

      if (existingFriendship) {
        throw new Error('Already friends with this user');
      }

      // Check if request already exists
      const { data: existingRequest } = await supabase
        .from('friend_requests')
        .select('id')
        .eq('from_user_id', user.id)
        .eq('to_user_id', targetUser.id)
        .single();

      if (existingRequest) {
        throw new Error('Friend request already sent');
      }

      // Send friend request
      const { error } = await supabase
        .from('friend_requests')
        .insert({
          from_user_id: user.id,
          to_user_id: targetUser.id,
        });

      if (error) throw error;

      return targetUser.name;
    } catch (err) {
      console.error('Error sending friend request:', err);
      throw err;
    }
  };

  const acceptFriendRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('friend_requests')
        .update({ status: 'accepted' })
        .eq('id', requestId);

      if (error) throw error;

      // Refresh data
      await fetchFriends();
    } catch (err) {
      console.error('Error accepting friend request:', err);
      throw err;
    }
  };

  const declineFriendRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('friend_requests')
        .update({ status: 'declined' })
        .eq('id', requestId);

      if (error) throw error;

      // Refresh data
      await fetchFriends();
    } catch (err) {
      console.error('Error declining friend request:', err);
      throw err;
    }
  };

  const removeFriend = async (friendId: string) => {
    if (!user) return;
  
    try {
      // Remove both directions of friendship
      const { error: error1 } = await supabase
        .from('friends')
        .delete()
        .eq('user_id', user.id)
        .eq('friend_id', friendId);
  
      if (error1) throw error1;
  
      const { error: error2 } = await supabase
        .from('friends')
        .delete()
        .eq('user_id', friendId)
        .eq('friend_id', user.id);
  
      if (error2) throw error2;
  
      // Refresh data
      await fetchFriends();
    } catch (err) {
      console.error('Error removing friend:', err);
      throw err;
    }
  };;

  return {
    friends,
    friendRequests,
    outgoingRequests,
    loading,
    error,
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    removeFriend,
    refetch: fetchFriends,
  };
}