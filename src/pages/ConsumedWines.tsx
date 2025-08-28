
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { Wine, Search, Calendar, Plus } from 'lucide-react';
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
    countries?: { name: string };
    regions?: { name: string };
  };
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

  const addToCellar = async (wineId: string, wineName: string) => {
    if (!user) return;

    try {
      // Check if wine already exists in cellar
      const { data: existingEntry } = await supabase
        .from('wine_cellar')
        .select('*')
        .eq('user_id', user.id)
        .eq('wine_database_id', wineId)
        .single();

      if (existingEntry) {
        // Update quantity
        const { error } = await supabase
          .from('wine_cellar')
          .update({ quantity: existingEntry.quantity + 1 })
          .eq('id', existingEntry.id);

        if (error) throw error;
      } else {
        // Create new entry
        const { error } = await supabase
          .from('wine_cellar')
          .insert({
            user_id: user.id,
            wine_database_id: wineId,
            quantity: 1,
          });

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: `${wineName} added to your cellar`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add wine to cellar",
        variant: "destructive",
      });
    }
  };

  const filteredWines = consumedWines.filter(consumption =>
    consumption.wines.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    consumption.wines.producer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    consumption.wines.regions?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    consumption.wines.countries?.name.toLowerCase().includes(searchTerm.toLowerCase())
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
              <Wine className="h-8 w-8 text-primary" />
              Consumed Wines
            </h1>
            <p className="text-muted-foreground mt-2">
              Your wine consumption history
            </p>
          </div>
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
                  ? "Start consuming wines from your cellar to see them here!" 
                  : "No wines match your search criteria."
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredWines.map((consumption) => (
              <Card key={consumption.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{consumption.wines.name}</CardTitle>
                      <CardDescription>
                        {consumption.wines.producer} • {consumption.wines.vintage}
                      </CardDescription>
                    </div>
                    <Badge className={getWineTypeColor(consumption.wines.wine_type)}>
                      {consumption.wines.wine_type}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {consumption.wines.regions?.name || consumption.wines.countries?.name ? (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Region:</span>
                        <span>{consumption.wines.regions?.name || consumption.wines.countries?.name}</span>
                      </div>
                    ) : null}
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Consumed:</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(consumption.consumed_at).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Quantity:</span>
                      <span>{consumption.quantity} bottle{consumption.quantity > 1 ? 's' : ''}</span>
                    </div>
                    
                    {consumption.notes && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Notes:</span>
                        <p className="mt-1 text-foreground">{consumption.notes}</p>
                      </div>
                    )}

                    <div className="pt-2">
                      <Button 
                        size="sm" 
                        className="w-full"
                        onClick={() => addToCellar(consumption.wines.id, consumption.wines.name)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add to Cellar
                      </Button>
                    </div>
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
