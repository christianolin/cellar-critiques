import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { Users, UserPlus, Search, Check, X, User } from 'lucide-react';
import Layout from '@/components/Layout';
import { Link } from 'react-router-dom';

interface Profile {
  id: string;
  user_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  location: string | null;
  bio: string | null;
}

interface Friendship {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: string;
  created_at: string;
  profile?: Profile;
  requester_profile?: Profile;
  addressee_profile?: Profile;
}

export default function Friends() {
  const { user } = useAuth();
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Friendship[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchFriendships();
    }
  }, [user]);

  const fetchFriendships = async () => {
    try {
      const { data, error } = await supabase
        .from('user_friendships')
        .select('*')
        .or(`requester_id.eq.${user?.id},addressee_id.eq.${user?.id}`);

      if (error) throw error;

      const accepted = data?.filter(f => f.status === 'accepted') || [];
      const pending = data?.filter(f => f.status === 'pending') || [];

      // Fetch profile data for friends
      const friendUserIds = accepted.map(f => 
        f.requester_id === user?.id ? f.addressee_id : f.requester_id
      );
      
      const pendingUserIds = pending.map(f => 
        f.requester_id === user?.id ? f.addressee_id : f.requester_id
      );

      const allUserIds = [...friendUserIds, ...pendingUserIds];
      
      if (allUserIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('*')
          .in('user_id', allUserIds);

        const profileMap = profiles?.reduce((acc, profile) => {
          acc[profile.user_id] = profile;
          return acc;
        }, {} as Record<string, Profile>) || {};

        const friendsWithProfiles = accepted.map(f => ({
          ...f,
          profile: profileMap[f.requester_id === user?.id ? f.addressee_id : f.requester_id]
        }));

        const pendingWithProfiles = pending.map(f => ({
          ...f,
          profile: profileMap[f.requester_id === user?.id ? f.addressee_id : f.requester_id]
        }));

        setFriends(friendsWithProfiles as any);
        setPendingRequests(pendingWithProfiles as any);
      } else {
        setFriends([]);
        setPendingRequests([]);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load friendships",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async () => {
    if (!searchTerm.trim()) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .or(`username.ilike.%${searchTerm}%,display_name.ilike.%${searchTerm}%`)
        .neq('user_id', user?.id)
        .limit(10);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to search users",
        variant: "destructive",
      });
    }
  };

  const sendFriendRequest = async (addresseeId: string) => {
    try {
      const { error } = await supabase
        .from('user_friendships')
        .insert({
          requester_id: user?.id,
          addressee_id: addresseeId,
          status: 'pending'
        });

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Friend request sent!",
      });
      
      fetchFriendships();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send friend request",
        variant: "destructive",
      });
    }
  };

  const respondToRequest = async (requestId: string, status: 'accepted' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('user_friendships')
        .update({ status })
        .eq('id', requestId);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: `Friend request ${status}!`,
      });
      
      fetchFriendships();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to respond to request",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-48 bg-muted rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto py-8 pb-20 md:pb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Users className="h-8 w-8 text-primary" />
              Friends & Community
            </h1>
            <p className="text-muted-foreground mt-2">
              Connect with fellow wine enthusiasts
            </p>
          </div>
        </div>

        <Tabs defaultValue="friends" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="friends">My Friends ({friends.length})</TabsTrigger>
            <TabsTrigger value="requests">Requests ({pendingRequests.filter(r => r.addressee_id === user?.id).length})</TabsTrigger>
            <TabsTrigger value="search">Find Friends</TabsTrigger>
          </TabsList>

          <TabsContent value="friends" className="space-y-6">
            {friends.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No friends yet</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    Start connecting with other wine enthusiasts!
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {friends.map((friendship) => {
                  const friend = friendship.profile;
                  return (
                    <Card key={friendship.id}>
                      <CardHeader>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={friend?.avatar_url || undefined} />
                            <AvatarFallback>
                              <User className="h-6 w-6" />
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <CardTitle className="text-lg">{friend?.display_name || friend?.username}</CardTitle>
                            <CardDescription>@{friend?.username}</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {friend?.location && (
                          <p className="text-sm text-muted-foreground mb-2">{friend.location}</p>
                        )}
                        {friend?.bio && (
                          <p className="text-sm mb-4">{friend.bio}</p>
                        )}
                        <div className="flex gap-2">
                          <Link to={`/friends/${friend?.user_id}/cellar`}>
                            <Button 
                              size="sm"
                              variant="outline"
                            >
                              View Cellar
                            </Button>
                          </Link>
                          <Link to={`/friends/${friend?.user_id}/ratings`}>
                            <Button size="sm">
                              View Ratings  
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="requests" className="space-y-6">
            {pendingRequests.filter(r => r.addressee_id === user?.id).length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <UserPlus className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No pending requests</h3>
                  <p className="text-muted-foreground text-center">
                    No friend requests at the moment.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pendingRequests.filter(r => r.addressee_id === user?.id).map((request) => {
                  const requester = request.profile;
                  return (
                    <Card key={request.id}>
                      <CardHeader>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={requester?.avatar_url || undefined} />
                            <AvatarFallback>
                              <User className="h-6 w-6" />
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <CardTitle className="text-lg">{requester?.display_name || requester?.username}</CardTitle>
                            <CardDescription>@{requester?.username}</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {requester?.location && (
                          <p className="text-sm text-muted-foreground mb-2">{requester.location}</p>
                        )}
                        {requester?.bio && (
                          <p className="text-sm mb-4">{requester.bio}</p>
                        )}
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            onClick={() => respondToRequest(request.id, 'accepted')}
                          >
                            <Check className="h-4 w-4 mr-2" />
                            Accept
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => respondToRequest(request.id, 'rejected')}
                          >
                            <X className="h-4 w-4 mr-2" />
                            Decline
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="search" className="space-y-6">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search by username or display name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  onKeyPress={(e) => e.key === 'Enter' && searchUsers()}
                />
              </div>
              <Button onClick={searchUsers}>Search</Button>
            </div>

            {searchResults.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {searchResults.map((profile) => (
                  <Card key={profile.user_id}>
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={profile.avatar_url || undefined} />
                          <AvatarFallback>
                            <User className="h-6 w-6" />
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg">{profile.display_name || profile.username}</CardTitle>
                          <CardDescription>@{profile.username}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {profile.location && (
                        <p className="text-sm text-muted-foreground mb-2">{profile.location}</p>
                      )}
                      {profile.bio && (
                        <p className="text-sm mb-4">{profile.bio}</p>
                      )}
                      <Button 
                        size="sm" 
                        onClick={() => sendFriendRequest(profile.user_id)}
                        disabled={
                          friends.some(f => 
                            f.requester_id === profile.user_id || f.addressee_id === profile.user_id
                          ) ||
                          pendingRequests.some(r => 
                            (r.requester_id === user?.id && r.addressee_id === profile.user_id) ||
                            (r.addressee_id === user?.id && r.requester_id === profile.user_id)
                          )
                        }
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        {friends.some(f => 
                          f.requester_id === profile.user_id || f.addressee_id === profile.user_id
                        ) ? 'Already Friends' : 
                        pendingRequests.some(r => 
                          (r.requester_id === user?.id && r.addressee_id === profile.user_id) ||
                          (r.addressee_id === user?.id && r.requester_id === profile.user_id)
                        ) ? 'Request Sent' : 'Send Request'}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}