import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { Wine, Search, ArrowLeft, Star } from 'lucide-react';
import Layout from '@/components/Layout';

interface CellarWine {
  id: string;
  quantity: number;
  purchase_price: number | null;
  purchase_date: string | null;
  wines: {
    id: string;
    name: string;
    producer: string;
    vintage: number | null;
    wine_type: string;
    countries?: { name: string };
    regions?: { name: string };
    appellations?: { name: string };
  };
}

interface Profile {
  id: string;
  user_id: string;
  username: string;
  display_name: string | null;
}

export default function FriendCellar() {
  const { friendId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [cellarWines, setCellarWines] = useState<CellarWine[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (friendId && user) {
      fetchFriendProfile();
      fetchFriendCellar();
    }
  }, [friendId, user]);

  const fetchFriendProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', friendId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load friend's profile",
        variant: "destructive",
      });
      navigate('/friends');
    }
  };

  const fetchFriendCellar = async () => {
    try {
      const { data, error } = await supabase
        .from('wine_cellar')
        .select(`
          id,
          quantity,
          purchase_price,
          purchase_date,
          wines (
            id,
            name,
            producer,
            vintage,
            wine_type,
            countries:country_id ( name ),
            regions:region_id ( name ),
            appellations:appellation_id ( name )
          )
        `)
        .eq('user_id', friendId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCellarWines(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load friend's cellar",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredWines = cellarWines.filter(cellarWine => {
    const wine = cellarWine.wines;
    return searchTerm === '' || 
      wine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      wine.producer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      wine.regions?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      wine.countries?.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const getWineTypeColor = (type: string) => {
    const colors = {
      red: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      white: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      rose: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300',
      sparkling: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      dessert: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      fortified: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
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
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/friends')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Friends
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                <Wine className="h-8 w-8 text-primary" />
                {profile?.display_name || profile?.username}'s Cellar
              </h1>
              <p className="text-muted-foreground mt-2">
                {filteredWines.length} wines • Total bottles: {filteredWines.reduce((sum, w) => sum + w.quantity, 0)}
              </p>
            </div>
          </div>
          <Link to={`/friends/${friendId}/ratings`}>
            <Button variant="outline" className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              View Ratings
            </Button>
          </Link>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search wines..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {filteredWines.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Wine className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No wines found</h3>
              <p className="text-muted-foreground text-center">
                {cellarWines.length === 0 
                  ? `${profile?.display_name || profile?.username} hasn't added any wines to their cellar yet.`
                  : "No wines match your search criteria."
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredWines.map((cellarWine) => (
              <Card key={cellarWine.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{cellarWine.wines.name}</CardTitle>
                      <CardDescription>
                        {cellarWine.wines.producer} • {cellarWine.wines.vintage || 'NV'}
                      </CardDescription>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge variant="secondary">
                        {cellarWine.quantity} bottle{cellarWine.quantity !== 1 ? 's' : ''}
                      </Badge>
                      <Badge className={getWineTypeColor(cellarWine.wines.wine_type)}>
                        {cellarWine.wines.wine_type}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {(cellarWine.wines.regions?.name || cellarWine.wines.countries?.name) && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Region:</span>
                        <span>{cellarWine.wines.regions?.name || cellarWine.wines.countries?.name}</span>
                      </div>
                    )}
                    
                    {cellarWine.wines.appellations?.name && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Appellation:</span>
                        <span>{cellarWine.wines.appellations.name}</span>
                      </div>
                    )}

                    {cellarWine.purchase_date && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Purchased:</span>
                        <span>{new Date(cellarWine.purchase_date).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}