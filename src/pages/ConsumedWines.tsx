import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { Search, Wine, Calendar, StickyNote } from 'lucide-react';
import Layout from '@/components/Layout';

interface ConsumedWine {
  id: string;
  quantity: number;
  consumed_at: string;
  notes: string | null;
  wines: {
    id: string;
    name: string;
    producer: string;
    vintage: number | null;
    wine_type: string;
    countries?: { name: string; };
    regions?: { name: string; };
  };
  wine_ratings?: {
    rating: number;
  } | null;
}

export default function ConsumedWines() {
  const { user } = useAuth();
  const [consumedWines, setConsumedWines] = useState<ConsumedWine[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (user) {
      fetchConsumedWines();
    }
  }, [user]);

  const fetchConsumedWines = async () => {
    try {
      const { data, error } = await supabase
        .from('wine_consumptions')
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
          ),
          wine_ratings:rating_id (
            rating
          )
        `)
        .eq('user_id', user?.id)
        .order('consumed_at', { ascending: false });

      if (error) throw error;
      setConsumedWines(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load consumed wines",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredWines = consumedWines.filter(wine =>
    wine.wines.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    wine.wines.producer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    wine.wines.regions?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    wine.wines.countries?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            <Wine className="h-8 w-8 text-primary" />
            Consumed Wines Archive
          </h1>
          <p className="text-muted-foreground mt-2">
            {consumedWines.reduce((sum, wine) => sum + wine.quantity, 0)} bottles consumed
          </p>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search consumed wines..."
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
              <h3 className="text-lg font-semibold mb-2">No consumed wines</h3>
              <p className="text-muted-foreground text-center">
                {consumedWines.length === 0 
                  ? "You haven't consumed any wines yet." 
                  : "No consumed wines match your search criteria."
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Wine</TableHead>
                  <TableHead>Producer</TableHead>
                  <TableHead>Vintage</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Region</TableHead>
                  <TableHead>Consumed Date</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredWines.map((consumption) => {
                  const wine = consumption.wines;
                  return (
                    <TableRow key={consumption.id}>
                      <TableCell className="font-medium">{wine.name}</TableCell>
                      <TableCell>{wine.producer}</TableCell>
                      <TableCell>{wine.vintage || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge className={getWineTypeColor(wine.wine_type)}>
                          {wine.wine_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {wine.regions?.name || wine.countries?.name || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          {new Date(consumption.consumed_at).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>{consumption.quantity}</TableCell>
                      <TableCell>
                        {consumption.wine_ratings?.rating ? (
                          <Badge variant="outline">{consumption.wine_ratings.rating}/100</Badge>
                        ) : (
                          <span className="text-muted-foreground">Not rated</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {consumption.notes ? (
                          <div className="flex items-center gap-1">
                            <StickyNote className="h-3 w-3 text-muted-foreground" />
                            <span className="truncate max-w-[200px]" title={consumption.notes}>
                              {consumption.notes}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">No notes</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </Layout>
  );
}