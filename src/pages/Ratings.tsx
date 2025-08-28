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
import { ColumnSelector, type ColumnConfig } from '@/components/ColumnSelector';

interface WineRating {
  id: string;
  rating: number;
  tasting_notes: string | null;
  food_pairing: string | null;
  tasting_date: string | null;
  created_at: string;
  updated_at: string;
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

  // Column visibility state for ratings table
  const ratingsColumns: ColumnConfig[] = [
    { key: 'wine_name', label: 'Wine Name', defaultVisible: true },
    { key: 'producer', label: 'Producer', defaultVisible: true },
    { key: 'vintage', label: 'Vintage', defaultVisible: true },
    { key: 'wine_type', label: 'Type', defaultVisible: true },
    { key: 'rating', label: 'Rating', defaultVisible: true },
    { key: 'tasting_date', label: 'Tasting Date', defaultVisible: true },
    { key: 'tasting_notes', label: 'Tasting Notes', defaultVisible: true },
    { key: 'country', label: 'Country', defaultVisible: false },
    { key: 'region', label: 'Region', defaultVisible: false },
    { key: 'appellation', label: 'Appellation', defaultVisible: false },
    { key: 'food_pairing', label: 'Food Pairing', defaultVisible: false },
    { key: 'appearance_color', label: 'Appearance Color', defaultVisible: false },
    { key: 'aroma_intensity', label: 'Aroma Intensity', defaultVisible: false },
    { key: 'palate_body', label: 'Body', defaultVisible: false },
    { key: 'palate_acidity', label: 'Acidity', defaultVisible: false },
    { key: 'palate_tannin', label: 'Tannin', defaultVisible: false },
    { key: 'palate_finish', label: 'Finish', defaultVisible: false },
  ];

  const getDefaultRatingsVisibleColumns = () => 
    ratingsColumns.filter(col => col.defaultVisible !== false).map(col => col.key);

  const [visibleRatingsColumns, setVisibleRatingsColumns] = useState<string[]>(() => {
    const saved = localStorage.getItem('ratingsVisibleColumns');
    return saved ? JSON.parse(saved) : getDefaultRatingsVisibleColumns();
  });

  const handleRatingsColumnToggle = (columnKey: string) => {
    const newVisibleColumns = visibleRatingsColumns.includes(columnKey)
      ? visibleRatingsColumns.filter(key => key !== columnKey)
      : [...visibleRatingsColumns, columnKey];
    
    setVisibleRatingsColumns(newVisibleColumns);
    localStorage.setItem('ratingsVisibleColumns', JSON.stringify(newVisibleColumns));
  };

  const resetRatingsColumns = () => {
    const defaultColumns = getDefaultRatingsVisibleColumns();
    setVisibleRatingsColumns(defaultColumns);
    localStorage.setItem('ratingsVisibleColumns', JSON.stringify(defaultColumns));
  };

  const addToCellar = async (wineId: string, wineName: string) => {
    if (!user) return;

    try {
      // Check if wine already exists in cellar
      const { data: existingEntry } = await supabase
        .from('wine_cellar')
        .select('*')
        .eq('user_id', user.id)
        .eq('wine_id', wineId)
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
            wine_id: wineId,
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

  useEffect(() => {
    if (user) {
      fetchRatings();
    }
  }, [user]);

  const fetchRatings = async () => {
    try {
      const { data, error } = await supabase
        .from('wine_ratings')
        .select(`
          id,
          user_id,
          wine_database_id,
          wine_vintage_id,
          rating,
          tasting_date,
          tasting_notes,
          food_pairing,
          created_at,
          updated_at,
          appearance_color,
          appearance_intensity,
          appearance_clarity,
          appearance_viscosity,
          appearance_comments,
          aroma_condition,
          aroma_intensity,
          aroma_primary,
          aroma_secondary,
          aroma_tertiary,
          aroma_comments,
          palate_sweetness,
          palate_acidity,
          palate_tannin,
          palate_body,
          palate_flavor_primary,
          palate_flavor_secondary,
          palate_flavor_tertiary,
          palate_finish,
          palate_complexity,
          palate_balance,
          palate_comments,
          wine_database (
            id,
            name,
            wine_type,
            producers ( name ),
            countries ( name ),
            regions ( name ),
            appellations ( name )
          ),
          wine_vintages (
            id,
            vintage,
            alcohol_content,
            image_url
          )
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform data to match interface
      const transformedData = (data || []).map((rating: any) => ({
        ...rating,
        wines: {
          id: rating.wine_database?.id || '',
          name: rating.wine_database?.name || 'Unknown Wine',
          producer: rating.wine_database?.producers?.name || 'Unknown Producer',
          vintage: rating.wine_vintages?.vintage || null,
          wine_type: rating.wine_database?.wine_type || 'red',
          countries: rating.wine_database?.countries,
          regions: rating.wine_database?.regions,
          appellations: rating.wine_database?.appellations,
        }
      }));
      
      setRatings(transformedData);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load your ratings",
        variant: "destructive",
      });
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

          <div className="flex gap-2 pt-2">
            <EditRatingDialog rating={rating} onUpdated={fetchRatings} />
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => addToCellar(rating.wines.id, rating.wines.name)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add to Cellar
            </Button>
          </div>
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
            <AddRatingDialog onRatingAdded={fetchRatings} />
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
              {Array.from(new Set(ratings.map(r => r.wines.vintage).filter(Boolean)))
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
              {Array.from(new Set(ratings.map(r => r.wines.wine_type))).sort().map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            
            <select 
              value={filters.country} 
              onChange={(e) => setFilters({...filters, country: e.target.value})}
              className="px-3 py-1 text-sm border border-input bg-background rounded-md"
            >
              <option value="">All Countries</option>
              {Array.from(new Set(ratings.map(r => r.wines.countries?.name).filter(Boolean))).sort().map(country => (
                <option key={country} value={country}>{country}</option>
              ))}
            </select>
            
            <select 
              value={filters.region} 
              onChange={(e) => setFilters({...filters, region: e.target.value})}
              className="px-3 py-1 text-sm border border-input bg-background rounded-md"
            >
              <option value="">All Regions</option>
              {Array.from(new Set(ratings.map(r => r.wines.regions?.name || r.wines.countries?.name).filter(Boolean))).sort().map(region => (
                <option key={region} value={region}>{region}</option>
              ))}
            </select>
            
            <select 
              value={filters.appellation} 
              onChange={(e) => setFilters({...filters, appellation: e.target.value})}
              className="px-3 py-1 text-sm border border-input bg-background rounded-md"
            >
              <option value="">All Appellations</option>
              {Array.from(new Set(ratings.map(r => r.wines.appellations?.name).filter(Boolean))).sort().map(appellation => (
                <option key={appellation} value={appellation}>{appellation}</option>
              ))}
            </select>
            
            <select 
              value={filters.producer} 
              onChange={(e) => setFilters({...filters, producer: e.target.value})}
              className="px-3 py-1 text-sm border border-input bg-background rounded-md"
            >
              <option value="">All Producers</option>
              {Array.from(new Set(ratings.map(r => r.wines.producer))).sort().map(producer => (
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
                  <AddRatingDialog onRatingAdded={fetchRatings} />
                </CardContent>
              </Card>
            ) : viewMode === 'table' ? (
              <div className="space-y-4">
                <div className="flex justify-end">
                  <ColumnSelector
                    columns={ratingsColumns}
                    visibleColumns={visibleRatingsColumns}
                    onColumnToggle={handleRatingsColumnToggle}
                    onResetColumns={resetRatingsColumns}
                  />
                </div>
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {visibleRatingsColumns.includes('rating') && (
                          <TableHead className="cursor-pointer select-none hover:bg-muted" onClick={() => toggleSort('rating')}>
                            <div className="flex items-center gap-1">
                              Rating <ArrowUpDown className="h-3 w-3" />
                            </div>
                          </TableHead>
                        )}
                        {visibleRatingsColumns.includes('wine_name') && (
                          <TableHead className="cursor-pointer select-none hover:bg-muted" onClick={() => toggleSort('name')}>
                            <div className="flex items-center gap-1">
                              Wine <ArrowUpDown className="h-3 w-3" />
                            </div>
                          </TableHead>
                        )}
                        {visibleRatingsColumns.includes('producer') && (
                          <TableHead className="cursor-pointer select-none hover:bg-muted" onClick={() => toggleSort('producer')}>
                            <div className="flex items-center gap-1">
                              Producer <ArrowUpDown className="h-3 w-3" />
                            </div>
                          </TableHead>
                        )}
                        {visibleRatingsColumns.includes('vintage') && (
                          <TableHead className="cursor-pointer select-none hover:bg-muted" onClick={() => toggleSort('vintage')}>
                            <div className="flex items-center gap-1">
                              Vintage <ArrowUpDown className="h-3 w-3" />
                            </div>
                          </TableHead>
                        )}
                        {visibleRatingsColumns.includes('wine_type') && (
                          <TableHead className="cursor-pointer select-none hover:bg-muted" onClick={() => toggleSort('type')}>
                            <div className="flex items-center gap-1">
                              Type <ArrowUpDown className="h-3 w-3" />
                            </div>
                          </TableHead>
                        )}
                        {visibleRatingsColumns.includes('tasting_date') && (
                          <TableHead className="cursor-pointer select-none hover:bg-muted" onClick={() => toggleSort('tasted')}>
                            <div className="flex items-center gap-1">
                              Date <ArrowUpDown className="h-3 w-3" />
                            </div>
                          </TableHead>
                        )}
                        {visibleRatingsColumns.includes('region') && (
                          <TableHead>Region</TableHead>
                        )}
                        {visibleRatingsColumns.includes('country') && (
                          <TableHead>Country</TableHead>
                        )}
                        {visibleRatingsColumns.includes('appellation') && (
                          <TableHead>Appellation</TableHead>
                        )}
                        {visibleRatingsColumns.includes('food_pairing') && (
                          <TableHead>Food Pairing</TableHead>
                        )}
                        {visibleRatingsColumns.includes('tasting_notes') && (
                          <TableHead>Tasting Notes</TableHead>
                        )}
                        {visibleRatingsColumns.includes('appearance_color') && (
                          <TableHead>Appearance</TableHead>
                        )}
                        {visibleRatingsColumns.includes('aroma_intensity') && (
                          <TableHead>Aroma</TableHead>
                        )}
                        {visibleRatingsColumns.includes('palate_body') && (
                          <TableHead>Body</TableHead>
                        )}
                        {visibleRatingsColumns.includes('palate_acidity') && (
                          <TableHead>Acidity</TableHead>
                        )}
                        {visibleRatingsColumns.includes('palate_tannin') && (
                          <TableHead>Tannin</TableHead>
                        )}
                        {visibleRatingsColumns.includes('palate_finish') && (
                          <TableHead>Finish</TableHead>
                        )}
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedRatings.map((rating) => (
                        <TableRow key={rating.id}>
                          {visibleRatingsColumns.includes('rating') && (
                            <TableCell>
                              <Badge className={getRatingColor(rating.rating)}>
                                {rating.rating}/100
                              </Badge>
                            </TableCell>
                          )}
                          {visibleRatingsColumns.includes('wine_name') && (
                            <TableCell className="font-medium">{rating.wines.name}</TableCell>
                          )}
                          {visibleRatingsColumns.includes('producer') && (
                            <TableCell>{rating.wines.producer}</TableCell>
                          )}
                          {visibleRatingsColumns.includes('vintage') && (
                            <TableCell>{rating.wines.vintage || 'NV'}</TableCell>
                          )}
                          {visibleRatingsColumns.includes('wine_type') && (
                            <TableCell>
                              <Badge className={getWineTypeColor(rating.wines.wine_type)}>
                                {rating.wines.wine_type}
                              </Badge>
                            </TableCell>
                          )}
                          {visibleRatingsColumns.includes('tasting_date') && (
                            <TableCell>
                              {rating.tasting_date 
                                ? new Date(rating.tasting_date).toLocaleDateString()
                                : 'N/A'
                              }
                            </TableCell>
                          )}
                          {visibleRatingsColumns.includes('region') && (
                            <TableCell>
                              {rating.wines.regions?.name || 'N/A'}
                            </TableCell>
                          )}
                          {visibleRatingsColumns.includes('country') && (
                            <TableCell>
                              {rating.wines.countries?.name || 'N/A'}
                            </TableCell>
                          )}
                          {visibleRatingsColumns.includes('appellation') && (
                            <TableCell>
                              {rating.wines.appellations?.name || 'N/A'}
                            </TableCell>
                          )}
                          {visibleRatingsColumns.includes('food_pairing') && (
                            <TableCell>
                              <div className="max-w-32 truncate" title={rating.food_pairing || ''}>
                                {rating.food_pairing || 'N/A'}
                              </div>
                            </TableCell>
                          )}
                          {visibleRatingsColumns.includes('tasting_notes') && (
                            <TableCell>
                              <div className="max-w-48 truncate" title={rating.tasting_notes || ''}>
                                {rating.tasting_notes || 'No notes'}
                              </div>
                            </TableCell>
                          )}
                          {visibleRatingsColumns.includes('appearance_color') && (
                            <TableCell>
                              {rating.appearance_color || 'N/A'}
                            </TableCell>
                          )}
                          {visibleRatingsColumns.includes('aroma_intensity') && (
                            <TableCell>
                              {rating.aroma_intensity || 'N/A'}
                            </TableCell>
                          )}
                          {visibleRatingsColumns.includes('palate_body') && (
                            <TableCell>
                              {rating.palate_body || 'N/A'}
                            </TableCell>
                          )}
                          {visibleRatingsColumns.includes('palate_acidity') && (
                            <TableCell>
                              {rating.palate_acidity || 'N/A'}
                            </TableCell>
                          )}
                          {visibleRatingsColumns.includes('palate_tannin') && (
                            <TableCell>
                              {rating.palate_tannin || 'N/A'}
                            </TableCell>
                          )}
                          {visibleRatingsColumns.includes('palate_finish') && (
                            <TableCell>
                              {rating.palate_finish || 'N/A'}
                            </TableCell>
                          )}
                           <TableCell>
                            <div className="flex gap-2">
                              <EditRatingDialog rating={rating} onUpdated={fetchRatings} />
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => addToCellar(rating.wines.id, rating.wines.name)}
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                Add to Cellar
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredRatings.map((rating) => (
                  <RatingCard key={rating.id} rating={rating} />
                ))}
              </div>
            )}
      </div>
    </Layout>
  );
}