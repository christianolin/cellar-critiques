import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wine, Users, Star, Plus } from 'lucide-react';
import Layout from '@/components/Layout';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to auth
  }

  return (
    <Layout>
      <div className="container mx-auto py-8 pb-20 md:pb-8">
        <div className="mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-2">
              Welcome to Cellar Critiques
            </h1>
          <p className="text-xl text-muted-foreground">
            Discover, collect, and rate wines with fellow enthusiasts
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/cellar')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wine className="h-6 w-6 text-primary" />
                My Wine Cellar
              </CardTitle>
              <CardDescription>
                Manage your wine collection and track your bottles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="ghost" className="w-full">
                View Cellar
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/friends')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-6 w-6 text-primary" />
                Friends & Community
              </CardTitle>
              <CardDescription>
                Connect with other wine enthusiasts and share discoveries
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="ghost" className="w-full">
                Explore Community
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/ratings')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-6 w-6 text-primary" />
                Wine Ratings
              </CardTitle>
              <CardDescription>
                Rate wines using the Robert Parker 100-point system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="ghost" className="w-full">
                View Ratings
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-6 w-6 text-primary" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button className="w-full" onClick={() => navigate('/cellar')}>
                Add New Wine
              </Button>
              <Button variant="outline" className="w-full" onClick={() => navigate('/ratings')}>
                Rate a Wine
              </Button>
              <Button variant="outline" className="w-full" onClick={() => navigate('/friends')}>
                Invite Friends
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Index;
