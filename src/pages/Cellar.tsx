import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { Plus, Wine, Search } from 'lucide-react';
import Layout from '@/components/Layout';
import AddWineDialog from '@/components/AddWineDialog';

interface WineInCellar {
  id: string;
  quantity: number;
  purchase_date: string | null;
  purchase_price: number | null;
  storage_location: string | null;
  notes: string | null;
  wines: {
    id: string;
    name: string;
    producer: string;
    vintage: number | null;
    region: string | null;
    country: string;
    wine_type: string;
    grape_varieties: string[] | null;
  };
}

export default function Cellar() {
  const { user } = useAuth();
  const [wines, setWines] = useState<WineInCellar[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (user) {
      fetchCellarWines();
    }
  }, [user]);

  const fetchCellarWines = async () => {
    try {
      const { data, error } = await supabase
        .from('wine_cellar')
        .select(`
          *,
          wines (
            id,
            name,
            producer,
            vintage,
            region,
            country,
            wine_type,
            grape_varieties
          )
        `)
        .eq('user_id', user?.id);

      if (error) throw error;
      setWines(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load your wine cellar",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredWines = wines.filter(wine =>
    wine.wines.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    wine.wines.producer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    wine.wines.region?.toLowerCase().includes(searchTerm.toLowerCase())
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
              My Wine Cellar
            </h1>
            <p className="text-muted-foreground mt-2">
              {wines.length} bottles in your collection
            </p>
          </div>
          <AddWineDialog addToCellar onWineAdded={fetchCellarWines} />
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
              <p className="text-muted-foreground text-center mb-4">
                {wines.length === 0 
                  ? "Your cellar is empty. Start building your collection!" 
                  : "No wines match your search criteria."
                }
              </p>
              <AddWineDialog addToCellar onWineAdded={fetchCellarWines} />
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredWines.map((cellarEntry) => {
              const wine = cellarEntry.wines;
              return (
                <Card key={cellarEntry.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{wine.name}</CardTitle>
                        <CardDescription>
                          {wine.producer} • {wine.vintage}
                        </CardDescription>
                      </div>
                      <Badge className={getWineTypeColor(wine.wine_type)}>
                        {wine.wine_type}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Region:</span>
                        <span>{wine.region || wine.country}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Quantity:</span>
                        <span>{cellarEntry.quantity} bottles</span>
                      </div>
                      {wine.grape_varieties && wine.grape_varieties.length > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Grapes:</span>
                          <span className="text-right">
                            {wine.grape_varieties.join(', ')}
                          </span>
                        </div>
                      )}
                      {cellarEntry.purchase_price && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Purchase:</span>
                          <span>${cellarEntry.purchase_price}</span>
                        </div>
                      )}
                      {cellarEntry.storage_location && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Location:</span>
                          <span>{cellarEntry.storage_location}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}