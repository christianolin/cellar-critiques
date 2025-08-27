import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { Plus, Search, Star, Calendar, Grid, List, ArrowUpDown, Filter } from 'lucide-react';
import Layout from '@/components/Layout';
import AddRatingDialog from '@/components/AddRatingDialog';
import EditRatingDialog from '@/components/EditRatingDialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

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
  // Detailed rating fields
  appearance_color: string | null;
  appearance_intensity: string | null;
  appearance_clarity: string | null;
  appearance_viscosity: string | null;
  appearance_comments: string | null;
  aroma_condition: string | null;
  aroma_intensity: string | null;
  aroma_primary: string | null;
  aroma_secondary: string | null;
  aroma_tertiary: string | null;
  aroma_comments: string | null;
  palate_sweetness: string | null;
  palate_acidity: string | null;
  palate_tannin: string | null;
  palate_body: string | null;
  palate_flavor_primary: string | null;
  palate_flavor_secondary: string | null;
  palate_flavor_tertiary: string | null;
  palate_complexity: string | null;
  palate_finish: string | null;
  palate_balance: string | null;
  palate_comments: string | null;
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

export default function Ratings() {
  const { user } = useAuth();
  const [ratings, setRatings] = useState<WineRating[]>([]);
  const [friendsRatings, setFriendsRatings] = useState<WineRating[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table');
  const [filters, setFilters] = useState<{
    vintage: string;
    wine_type: string;
    region: string;
    appellation: string;
    country: string;
    producer: string;
  }>({
    vintage: '',
    wine_type: '',  
    region: '',
    appellation: '',
    country: '',
    producer: ''
  });
  const [sortKey, setSortKey] = useState<'name' | 'producer' | 'vintage' | 'type' | 'rating' | 'tasted'>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const toggleSort = (key: 'name' | 'producer' | 'vintage' | 'type' | 'rating' | 'tasted') => {
    if (sortKey === key) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

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
            regions:region_id ( name ),
            appellations:appellation_id ( name )
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
            regions:region_id ( name ),
            appellations:appellation_id ( name )
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

  const filteredRatings = ratings.filter(rating => {
    // Search term filter
    const matchesSearch = searchTerm === '' || 
      rating.wines.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rating.wines.producer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rating.wines.regions?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rating.wines.countries?.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Column filters
    const matchesVintage = filters.vintage === '' || rating.wines.vintage?.toString() === filters.vintage;
    const matchesType = filters.wine_type === '' || rating.wines.wine_type === filters.wine_type;
    const matchesRegion = filters.region === '' || 
      rating.wines.regions?.name === filters.region ||
      rating.wines.countries?.name === filters.region;
    const matchesCountry = filters.country === '' || rating.wines.countries?.name === filters.country;
    const matchesAppellation = filters.appellation === '' || rating.wines.appellations?.name === filters.appellation;
    const matchesProducer = filters.producer === '' || rating.wines.producer === filters.producer;
    
    return matchesSearch && matchesVintage && matchesType && matchesRegion && matchesCountry && matchesAppellation && matchesProducer;
  });

  const filteredFriendsRatings = friendsRatings.filter(rating => {
    // Search term filter
    const matchesSearch = searchTerm === '' || 
      rating.wines.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rating.wines.producer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rating.wines.regions?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rating.wines.countries?.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Column filters
    const matchesVintage = filters.vintage === '' || rating.wines.vintage?.toString() === filters.vintage;
    const matchesType = filters.wine_type === '' || rating.wines.wine_type === filters.wine_type;
    const matchesRegion = filters.region === '' || 
      rating.wines.regions?.name === filters.region ||
      rating.wines.countries?.name === filters.region;
    const matchesCountry = filters.country === '' || rating.wines.countries?.name === filters.country;
    const matchesAppellation = filters.appellation === '' || rating.wines.appellations?.name === filters.appellation;
    const matchesProducer = filters.producer === '' || rating.wines.producer === filters.producer;
    
    return matchesSearch && matchesVintage && matchesType && matchesRegion && matchesCountry && matchesAppellation && matchesProducer;
  });

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

  const sortedRatings = [...filteredRatings].sort((a, b) => {
    let aVal: any;
    let bVal: any;
    switch (sortKey) {
      case 'name': aVal = a.wines.name; bVal = b.wines.name; break;
      case 'producer': aVal = a.wines.producer; bVal = b.wines.producer; break;
      case 'vintage': aVal = a.wines.vintage ?? 0; bVal = b.wines.vintage ?? 0; break;
      case 'type': aVal = a.wines.wine_type; bVal = b.wines.wine_type; break;
      case 'rating': aVal = a.rating; bVal = b.rating; break;
      case 'tasted': aVal = a.tasting_date ? new Date(a.tasting_date).getTime() : 0; bVal = b.tasting_date ? new Date(b.tasting_date).getTime() : 0; break;
      default: aVal = 0; bVal = 0;
    }
    const cmp = typeof aVal === 'number' && typeof bVal === 'number'
      ? aVal - bVal
      : String(aVal).localeCompare(String(bVal));
    return sortDir === 'asc' ? cmp : -cmp;
  });

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
            <AddRatingDialog onRatingAdded={() => {
              fetchRatings();
              fetchFriendsRatings();
            }} />
          </div>
        </div>

        <div className="mb-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search ratings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {/* Filters */}
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filters:</span>
            </div>
            
            <select 
              value={filters.vintage} 
              onChange={(e) => setFilters({...filters, vintage: e.target.value})}
              className="px-3 py-1 text-sm border border-input bg-background rounded-md"
            >
              <option value="">All Vintages</option>
              {Array.from(new Set([...ratings, ...friendsRatings].map(r => r.wines.vintage).filter(Boolean)))
                .sort((a, b) => (b as number) - (a as number))
                .map(vintage => (
                <option key={vintage} value={vintage?.toString()}>{vintage}</option>
              ))}
            </select>
            
            <select 
              value={filters.wine_type} 
              onChange={(e) => setFilters({...filters, wine_type: e.target.value})}
              className="px-3 py-1 text-sm border border-input bg-background rounded-md"
            >
              <option value="">All Types</option>
              {Array.from(new Set([...ratings, ...friendsRatings].map(r => r.wines.wine_type))).sort().map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            
            <select 
              value={filters.region} 
              onChange={(e) => setFilters({...filters, region: e.target.value})}
              className="px-3 py-1 text-sm border border-input bg-background rounded-md"
            >
              <option value="">All Regions</option>
              {Array.from(new Set([...ratings, ...friendsRatings].map(r => r.wines.regions?.name || r.wines.countries?.name).filter(Boolean))).sort().map(region => (
                <option key={region} value={region}>{region}</option>
              ))}
            </select>
            
            <select 
              value={filters.country} 
              onChange={(e) => setFilters({...filters, country: e.target.value})}
              className="px-3 py-1 text-sm border border-input bg-background rounded-md"
            >
              <option value="">All Countries</option>
              {Array.from(new Set([...ratings, ...friendsRatings].map(r => r.wines.countries?.name).filter(Boolean))).sort().map(country => (
                <option key={country} value={country}>{country}</option>
              ))}
            </select>
            
            <select 
              value={filters.appellation} 
              onChange={(e) => setFilters({...filters, appellation: e.target.value})}
              className="px-3 py-1 text-sm border border-input bg-background rounded-md"
            >
              <option value="">All Appellations</option>
              {Array.from(new Set([...ratings, ...friendsRatings].map(r => r.wines.appellations?.name).filter(Boolean))).sort().map(appellation => (
                <option key={appellation} value={appellation}>{appellation}</option>
              ))}
            </select>
            
            <select 
              value={filters.producer} 
              onChange={(e) => setFilters({...filters, producer: e.target.value})}
              className="px-3 py-1 text-sm border border-input bg-background rounded-md"
            >
              <option value="">All Producers</option>
              {Array.from(new Set([...ratings, ...friendsRatings].map(r => r.wines.producer))).sort().map(producer => (
                <option key={producer} value={producer}>{producer}</option>
              ))}
            </select>
            
            {(filters.vintage || filters.wine_type || filters.region || filters.country || filters.appellation || filters.producer) && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setFilters({vintage: '', wine_type: '', region: '', appellation: '', country: '', producer: ''})}
              >
                Clear Filters
              </Button>
            )}
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
                  <AddRatingDialog onRatingAdded={() => {
                    fetchRatings();
                    fetchFriendsRatings();
                  }} />
                </CardContent>
              </Card>
            ) : viewMode === 'table' ? (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="cursor-pointer select-none hover:bg-muted" onClick={() => toggleSort('name')}>
                        <div className="flex items-center gap-1">
                          Wine <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </TableHead>
                      <TableHead className="cursor-pointer select-none hover:bg-muted" onClick={() => toggleSort('producer')}>
                        <div className="flex items-center gap-1">
                          Producer <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </TableHead>
                      <TableHead className="cursor-pointer select-none hover:bg-muted" onClick={() => toggleSort('vintage')}>
                        <div className="flex items-center gap-1">
                          Vintage <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </TableHead>
                      <TableHead className="cursor-pointer select-none hover:bg-muted" onClick={() => toggleSort('type')}>
                        <div className="flex items-center gap-1">
                          Type <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </TableHead>
                      <TableHead className="cursor-pointer select-none hover:bg-muted" onClick={() => toggleSort('rating')}>
                        <div className="flex items-center gap-1">
                          Rating <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </TableHead>
                      <TableHead className="cursor-pointer select-none hover:bg-muted" onClick={() => toggleSort('tasted')}>
                        <div className="flex items-center gap-1">
                          Tasted <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </TableHead>
                      <TableHead>Color</TableHead>
                      <TableHead>Body</TableHead>
                      <TableHead>Sweetness</TableHead>
                      <TableHead>Serving Temp</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedRatings.map((rating) => (
                      <TableRow key={rating.id}>
                        <TableCell className="font-medium">{rating.wines.name}</TableCell>
                        <TableCell>{rating.wines.producer}</TableCell>
                        <TableCell>{rating.wines.vintage || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge className={getWineTypeColor(rating.wines.wine_type)}>
                            {rating.wines.wine_type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getRatingColor(rating.rating)}>
                            {rating.rating}/100
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {rating.tasting_date ? new Date(rating.tasting_date).toLocaleDateString() : 'N/A'}
                        </TableCell>
                        <TableCell>{rating.color || 'N/A'}</TableCell>
                        <TableCell>{rating.body || 'N/A'}</TableCell>
                        <TableCell>{rating.sweetness || 'N/A'}</TableCell>
                        <TableCell>
                          {rating.serving_temp_min && rating.serving_temp_max 
                            ? `${rating.serving_temp_min}-${rating.serving_temp_max}°C`
                            : 'N/A'
                          }
                        </TableCell>
                        <TableCell>
                          <span className="truncate max-w-[200px]" title={rating.tasting_notes || undefined}>
                            {rating.tasting_notes || 'No notes'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <EditRatingDialog rating={rating} onUpdated={fetchRatings} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredRatings.map((rating) => (
                  <div key={rating.id} className="space-y-2">
                    <RatingCard rating={rating} />
                    <div>
                      <EditRatingDialog rating={rating} onUpdated={fetchRatings} />
                    </div>
                  </div>
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