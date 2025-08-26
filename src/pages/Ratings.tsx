import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { Plus, Search, Star, Calendar } from 'lucide-react';
import Layout from '@/components/Layout';
import AddWineDialog from '@/components/AddWineDialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface WineRating {
  id: string;
  rating: number;
  tasting_notes: string | null;
  food_pairing: string | null;
  tasting_date: string | null;
  created_at: string;
  color: string | null;
  body: string | null;
  sweetness: string | null;
  serving_temp_min: number | null;
  serving_temp_max: number | null;
  wines: {
    id: string;
    name: string;
    producer: string;
    vintage: number | null;
    wine_type: string;
    countries?: { name: string };
    regions?: { name: string };
  };
}

export default function Ratings() {
  const { user } = useAuth();
  const [ratings, setRatings] = useState<WineRating[]>([]);
  const [friendsRatings, setFriendsRatings] = useState<WineRating[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (user) {
      fetchRatings();
      fetchFriendsRatings();
    }
  }, [user]);

  const fetchRatings = async () => {
    try {
      const { data, error } = await supabase
        .from('wine_ratings')
        .select(`
          *,
          wines (
            id,
            name,
            producer,
            vintage,
            wine_type,
            countries:country_id ( name ),
            regions:region_id ( name )
          )
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRatings(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load your ratings",
        variant: "destructive",
      });
    }
  };

  const fetchFriendsRatings = async () => {
    try {
      const { data, error } = await supabase
        .from('wine_ratings')
        .select(`
          *,
          wines (
            id,
            name,
            producer,
            vintage,
            wine_type,
            countries:country_id ( name ),
            regions:region_id ( name )
          )
        `)
        .neq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setFriendsRatings(data || []);
    } catch (error) {
      console.error('Error loading friends ratings:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRatings = ratings.filter(rating =>
    rating.wines.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rating.wines.producer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rating.wines.regions?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rating.wines.countries?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredFriendsRatings = friendsRatings.filter(rating =>
    rating.wines.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rating.wines.producer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rating.wines.regions?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rating.wines.countries?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRatingColor = (rating: number) => {
    if (rating >= 95) return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
    if (rating >= 90) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    if (rating >= 85) return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    if (rating >= 80) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
  };

  const getRatingLabel = (rating: number) => {
    if (rating >= 96) return 'Extraordinary';
    if (rating >= 94) return 'Outstanding';
    if (rating >= 90) return 'Excellent';
    if (rating >= 85) return 'Very Good';
    if (rating >= 80) return 'Good';
    if (rating >= 70) return 'Average';
    return 'Below Average';
  };

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

  const RatingCard = ({ rating, showUser = false }: { rating: WineRating; showUser?: boolean }) => (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-lg">{rating.wines.name}</CardTitle>
            <CardDescription>
              {rating.wines.producer} • {rating.wines.vintage}
            </CardDescription>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge className={getRatingColor(rating.rating)}>
              {rating.rating}/100
            </Badge>
            <Badge className={getWineTypeColor(rating.wines.wine_type)}>
              {rating.wines.wine_type}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 text-yellow-500 fill-current" />
            <span className="text-sm font-medium">{getRatingLabel(rating.rating)}</span>
          </div>
          
          {rating.wines.regions?.name || rating.wines.countries?.name ? (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Region:</span>
              <span>{rating.wines.regions?.name || rating.wines.countries?.name}</span>
            </div>
          ) : null}
          
          {rating.tasting_date && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tasted:</span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(rating.tasting_date).toLocaleDateString()}
              </span>
            </div>
          )}
          
          {rating.tasting_notes && (
            <div className="text-sm">
              <span className="text-muted-foreground">Notes:</span>
              <p className="mt-1 text-foreground">{rating.tasting_notes}</p>
            </div>
          )}
          
          {rating.food_pairing && (
            <div className="text-sm">
              <span className="text-muted-foreground">Food Pairing:</span>
              <p className="mt-1 text-foreground">{rating.food_pairing}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Layout>
      <div className="container mx-auto py-8 pb-20 md:pb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Star className="h-8 w-8 text-primary" />
              Wine Ratings
            </h1>
            <p className="text-muted-foreground mt-2">
              Robert Parker 100-point system
            </p>
          </div>
          <AddWineDialog onWineAdded={() => {
            fetchRatings();
            fetchFriendsRatings();
          }} />
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search ratings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Tabs defaultValue="my-ratings" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="my-ratings">My Ratings ({ratings.length})</TabsTrigger>
            <TabsTrigger value="community">Community Ratings</TabsTrigger>
          </TabsList>

          <TabsContent value="my-ratings" className="space-y-6">
            {filteredRatings.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Star className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No ratings yet</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    {ratings.length === 0 
                      ? "Start rating wines you've tasted!" 
                      : "No ratings match your search criteria."
                    }
                  </p>
                  <AddWineDialog onWineAdded={() => {
                    fetchRatings();
                    fetchFriendsRatings();
                  }} />
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredRatings.map((rating) => (
                  <RatingCard key={rating.id} rating={rating} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="community" className="space-y-6">
            {filteredFriendsRatings.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Star className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No community ratings</h3>
                  <p className="text-muted-foreground text-center">
                    Connect with friends to see their ratings!
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredFriendsRatings.map((rating) => (
                  <RatingCard key={rating.id} rating={rating} showUser />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}