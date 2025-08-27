import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { Plus, Wine, Search, Grid, List, BarChart3, TrendingUp, DollarSign } from 'lucide-react';
import Layout from '@/components/Layout';
import AddWineDialog from '@/components/AddWineDialog';
import EditWineDialog from '@/components/EditWineDialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import QuantityControl from '@/components/QuantityControl';

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
    wine_type: string;
    countries?: { name: string; };
    regions?: { name: string; };
    appellations?: { name: string; };
  };
}

export default function Cellar() {
  const { user } = useAuth();
  const [wines, setWines] = useState<WineInCellar[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table');

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
            wine_type,
            countries:country_id ( name ),
            regions:region_id ( name ),
            appellations:appellation_id ( name )
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

  const calculateStats = () => {
    const totalBottles = wines.reduce((sum, wine) => sum + wine.quantity, 0);
    const totalValue = wines.reduce((sum, wine) => sum + (wine.purchase_price || 0) * wine.quantity, 0);
    const totalLiters = totalBottles * 0.75; // Assuming 750ml bottles
    
    const typeStats = wines.reduce((acc, wine) => {
      const type = wine.wines.wine_type;
      acc[type] = (acc[type] || 0) + wine.quantity;
      return acc;
    }, {} as Record<string, number>);

    const typePercentages = Object.entries(typeStats).map(([type, count]) => ({
      type,
      count,
      percentage: Math.round((count / totalBottles) * 100)
    }));

    return {
      totalBottles,
      totalValue,
      totalLiters,
      typePercentages
    };
  };

  const stats = calculateStats();

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
              {stats.totalBottles} bottles in your collection
            </p>
          </div>
          <div className="flex gap-2">
            <div className="flex border rounded-lg p-1">
              <Button
                variant={viewMode === 'cards' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('cards')}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'table' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('table')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
            <AddWineDialog addToCellar onWineAdded={fetchCellarWines} />
          </div>
        </div>

        {/* KPI Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-2xl font-bold">{stats.totalBottles}</div>
                  <p className="text-xs text-muted-foreground">Total Bottles</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Wine className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-2xl font-bold">{stats.totalLiters.toFixed(1)}L</div>
                  <p className="text-xs text-muted-foreground">Total Volume</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-2xl font-bold">{stats.totalValue.toFixed(0)} DKK</div>
                  <p className="text-xs text-muted-foreground">Total Value</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-lg font-bold">
                    {stats.typePercentages.map(t => `${t.percentage}% ${t.type}`).join(', ')}
                  </div>
                  <p className="text-xs text-muted-foreground">Wine Types</p>
                </div>
              </div>
            </CardContent>
          </Card>
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

        <Tabs defaultValue="cellar" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="cellar">Wine Cellar ({stats.totalBottles})</TabsTrigger>
            <TabsTrigger value="consumed">Consumed Archive</TabsTrigger>
          </TabsList>
          
          <TabsContent value="cellar">
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
            ) : viewMode === 'table' ? (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Wine</TableHead>
                  <TableHead>Producer</TableHead>
                  <TableHead>Vintage</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Region</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Price (DKK)</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredWines.map((cellarEntry) => {
                  const wine = cellarEntry.wines;
                  return (
                    <TableRow key={cellarEntry.id}>
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
                        <QuantityControl cellarEntry={cellarEntry} onUpdate={fetchCellarWines} />
                      </TableCell>
                      <TableCell>
                        {cellarEntry.purchase_price ? `${cellarEntry.purchase_price} DKK` : 'N/A'}
                      </TableCell>
                      <TableCell>{cellarEntry.storage_location || 'N/A'}</TableCell>
                      <TableCell>
                        <EditWineDialog cellarEntry={cellarEntry} onWineUpdated={fetchCellarWines} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
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
                        <span>{wine.regions?.name || wine.countries?.name || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Quantity:</span>
                        <QuantityControl cellarEntry={cellarEntry} onUpdate={fetchCellarWines} />
                      </div>
                      {cellarEntry.purchase_price && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Purchase:</span>
                          <span>{cellarEntry.purchase_price} DKK</span>
                        </div>
                      )}
                      {cellarEntry.storage_location && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Location:</span>
                          <span>{cellarEntry.storage_location}</span>
                        </div>
                      )}
                      <div className="flex justify-end pt-2">
                        <EditWineDialog cellarEntry={cellarEntry} onWineUpdated={fetchCellarWines} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
          </TabsContent>
          
          <TabsContent value="consumed">
            <ConsumedWines />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}