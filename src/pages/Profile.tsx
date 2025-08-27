import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { User, Camera, Save } from 'lucide-react';
import Layout from '@/components/Layout';

interface ProfileData {
  username: string;
  display_name: string;
  bio: string;
  location: string;
  avatar_url: string;
  birth_year: number | null;
}

export default function Profile() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData>({
    username: '',
    display_name: '',
    bio: '',
    location: '',
    avatar_url: '',
    birth_year: null,
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setProfileData({
          username: data.username || '',
          display_name: data.display_name || '',
          bio: data.bio || '',
          location: data.location || '',
          avatar_url: data.avatar_url || '',
          birth_year: data.birth_year || null,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load profile data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          username: profileData.username || user.email || '',
          display_name: profileData.display_name,
          bio: profileData.bio,
          location: profileData.location,
          avatar_url: profileData.avatar_url,
          birth_year: profileData.birth_year,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Profile updated successfully!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="h-64 bg-muted rounded-lg"></div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto py-8 pb-20 md:pb-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <User className="h-8 w-8 text-primary" />
            My Profile
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage your personal information and preferences
          </p>
        </div>

        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>
              Update your profile details and photo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar Section */}
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={profileData.avatar_url} />
                <AvatarFallback>
                  <User className="h-8 w-8" />
                </AvatarFallback>
              </Avatar>
              <div>
                <Label htmlFor="avatar_url">Profile Picture URL</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="avatar_url"
                    placeholder="https://example.com/photo.jpg"
                    value={profileData.avatar_url}
                    onChange={(e) => setProfileData({ ...profileData, avatar_url: e.target.value })}
                  />
                  <Button variant="outline" size="sm">
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Add a URL to your profile picture
                </p>
              </div>
            </div>

            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={profileData.username}
                  onChange={(e) => setProfileData({ ...profileData, username: e.target.value })}
                  placeholder="Your username"
                />
              </div>
              <div>
                <Label htmlFor="display_name">Display Name</Label>
                <Input
                  id="display_name"
                  value={profileData.display_name}
                  onChange={(e) => setProfileData({ ...profileData, display_name: e.target.value })}
                  placeholder="Your display name"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="birth_year">Birth Year</Label>
                <Input
                  id="birth_year"
                  type="number"
                  min="1900"
                  max="2010"
                  value={profileData.birth_year || ''}
                  onChange={(e) => setProfileData({ 
                    ...profileData, 
                    birth_year: e.target.value ? parseInt(e.target.value) : null 
                  })}
                  placeholder="1990"
                />
              </div>
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={profileData.location}
                  onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                  placeholder="City, Country"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={profileData.bio}
                onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                placeholder="Tell us about yourself, your wine journey, favorite regions..."
                className="min-h-[100px]"
              />
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Profile'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Additional Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Wine Preferences</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Coming soon: Set your favorite wine types, regions, and tasting preferences.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Privacy Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Coming soon: Control who can see your ratings and cellar.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}