import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { Plus, Wine, Search, Grid, List, BarChart3, TrendingUp, DollarSign, Filter, ArrowUpDown } from 'lucide-react';
import Layout from '@/components/Layout';
import AddWineDialog from '@/components/AddWineDialog';
import EditWineDialog from '@/components/EditWineDialog';
import DeleteConsumptionDialog from '@/components/DeleteConsumptionDialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import QuantityControl from '@/components/QuantityControl';
import { ColumnSelector, type ColumnConfig } from '@/components/ColumnSelector';

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
    bottle_size: string | null;
    image_url: string | null;
    country?: { name: string; };
    region?: { name: string; };
    appellation?: { name: string; };
  };
}

export default function Cellar() {
  const { user } = useAuth();
  const [wines, setWines] = useState<WineInCellar[]>([]);
  const [consumedWines, setConsumedWines] = useState<any[]>([]);
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

  // Column visibility state for cellar table
  const cellarColumns: ColumnConfig[] = [
    { key: 'name', label: 'Wine Name', defaultVisible: true },
    { key: 'producer', label: 'Producer', defaultVisible: true },
    { key: 'vintage', label: 'Vintage', defaultVisible: true },
    { key: 'type', label: 'Type', defaultVisible: true },
    { key: 'quantity', label: 'Quantity', defaultVisible: true },
    { key: 'price', label: 'Price', defaultVisible: true },
    { key: 'location', label: 'Storage Location', defaultVisible: false },
    { key: 'country', label: 'Country', defaultVisible: false },
    { key: 'region', label: 'Region', defaultVisible: true },
    { key: 'appellation', label: 'Appellation', defaultVisible: false },
    { key: 'purchase_date', label: 'Purchase Date', defaultVisible: false },
    { key: 'bottle_size', label: 'Bottle Size', defaultVisible: false },
    { key: 'notes', label: 'Notes', defaultVisible: false },
  ];

  const getDefaultVisibleColumns = () => 
    cellarColumns.filter(col => col.defaultVisible !== false).map(col => col.key);

  const [visibleCellarColumns, setVisibleCellarColumns] = useState<string[]>(() => {
    const saved = localStorage.getItem('cellarVisibleColumns');
    return saved ? JSON.parse(saved) : getDefaultVisibleColumns();
  });

  // Column visibility state for consumed table
  const consumedColumns: ColumnConfig[] = [
    { key: 'name', label: 'Wine Name', defaultVisible: true },
    { key: 'producer', label: 'Producer', defaultVisible: true },
    { key: 'vintage', label: 'Vintage', defaultVisible: true },
    { key: 'type', label: 'Type', defaultVisible: false },
    { key: 'consumed_date', label: 'Consumed Date', defaultVisible: true },
    { key: 'quantity', label: 'Quantity', defaultVisible: true },
    { key: 'notes', label: 'Notes', defaultVisible: false },
  ];

  const [visibleConsumedColumns, setVisibleConsumedColumns] = useState<string[]>(() => {
    const saved = localStorage.getItem('consumedVisibleColumns');
    return saved ? JSON.parse(saved) : consumedColumns.filter(col => col.defaultVisible !== false).map(col => col.key);
  });

  const handleCellarColumnToggle = (columnKey: string) => {
    const newVisibleColumns = visibleCellarColumns.includes(columnKey)
      ? visibleCellarColumns.filter(key => key !== columnKey)
      : [...visibleCellarColumns, columnKey];
    
    setVisibleCellarColumns(newVisibleColumns);
    localStorage.setItem('cellarVisibleColumns', JSON.stringify(newVisibleColumns));
  };

  const handleConsumedColumnToggle = (columnKey: string) => {
    const newVisibleColumns = visibleConsumedColumns.includes(columnKey)
      ? visibleConsumedColumns.filter(key => key !== columnKey)
      : [...visibleConsumedColumns, columnKey];
    
    setVisibleConsumedColumns(newVisibleColumns);
    localStorage.setItem('consumedVisibleColumns', JSON.stringify(newVisibleColumns));
  };

  const resetCellarColumns = () => {
    const defaultColumns = getDefaultVisibleColumns();
    setVisibleCellarColumns(defaultColumns);
    localStorage.setItem('cellarVisibleColumns', JSON.stringify(defaultColumns));
  };

  const resetConsumedColumns = () => {
    const defaultColumns = consumedColumns.filter(col => col.defaultVisible !== false).map(col => col.key);
    setVisibleConsumedColumns(defaultColumns);
    localStorage.setItem('consumedVisibleColumns', JSON.stringify(defaultColumns));
  };

  useEffect(() => {
    if (user) {
      fetchCellarWines();
      fetchConsumedWines();
    }
  }, [user]);

  const fetchCellarWines = async () => {
    try {
      const { data, error } = await supabase
        .from('wine_cellar')
        .select(`
          *,
          wine_database:wine_database_id (
            id,
            name,
            wine_type,
            producer:producer_id ( name ),
            country:country_id ( name ),
            region:region_id ( name ),
            appellation:appellation_id ( name )
          ),
          vintage:wine_vintage_id (
            id,
            vintage,
            alcohol_content,
            image_url
          )
        `)
        .eq('user_id', user?.id);

      if (error) throw error;
      
      console.log('Raw cellar data:', data);
      
      // Handle case where no cellar entries exist yet
      if (!data || data.length === 0) {
        console.log('No cellar entries found - user likely has no wines yet');
        setWines([]);
        return;
      }
      
      const mapped = (data || []).map((row: any) => {
        // Back-compat: expose vintage on wine_database
        if (row.vintage?.vintage && row.wine_database) {
          row.wine_database.vintage = row.vintage.vintage;
        }
        // Back-compat: expose producer string
        if (row.wine_database?.producer?.name) {
          row.wine_database.producer = row.wine_database.producer.name;
        }
        // Create wines property for backward compatibility
        row.wines = row.wine_database;
        return row;
      });
      
      console.log('Mapped cellar data:', mapped);
      setWines(mapped);
    } catch (error) {
      console.error('Error loading cellar:', error);
      toast({
        title: "Error",
        description: `Failed to load your wine cellar: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchConsumedWines = async () => {
    try {
      const { data, error } = await supabase
        .from('wine_consumptions')
        .select(`
          *,
          wine_database:wine_database_id (
            id,
            name,
            wine_type,
            producer:producer_id ( name )
          ),
          vintage:wine_vintage_id ( id, vintage )
        `)
        .eq('user_id', user?.id)
        .order('consumed_at', { ascending: false });

      if (error) throw error;
      
      // Handle case where no consumed wines exist yet
      if (!data || data.length === 0) {
        console.log('No consumed wines found - user likely has no consumption history yet');
        setConsumedWines([]);
        return;
      }
      
      const mapped = (data || []).map((row: any) => {
        if (row.vintage?.vintage && row.wine_database) row.wine_database.vintage = row.vintage.vintage;
        if (row.wine_database?.producer?.name) row.wine_database.producer = row.wine_database.producer.name;
        // Create wines property for backward compatibility
        row.wines = row.wine_database;
        return row;
      });
      setConsumedWines(mapped);
    } catch (error) {
      console.error('Failed to load consumed wines:', error);
    }
  };

  const addToCellar = async (wineId: string, wineName: string) => {
    if (!user || !wineId) return;
    try {
      const { data: existing, error: existingError } = await supabase
        .from('wine_cellar')
        .select('*')
        .eq('user_id', user.id)
        .eq('wine_database_id', wineId)
        .maybeSingle();

      if (existingError && existingError.code !== 'PGRST116') throw existingError;

      if (existing) {
        const { error } = await supabase
          .from('wine_cellar')
          .update({ quantity: existing.quantity + 1 })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
                 const { error } = await supabase
           .from('wine_cellar')
           .insert({ user_id: user.id, wine_database_id: wineId, quantity: 1 });
        if (error) throw error;
      }

      toast({ title: 'Success', description: `${wineName} added to your cellar` });
      fetchCellarWines();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to add wine to cellar', variant: 'destructive' });
    }
  };

  const filteredWines = wines.filter(wine => {
    // Search term filter
    const matchesSearch = searchTerm === '' || 
      wine.wines.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      wine.wines.producer.toLowerCase().includes(searchTerm.toLowerCase()) ||
             wine.wines.region?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
       wine.wines.country?.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Column filters
    const matchesVintage = filters.vintage === '' || wine.wines.vintage?.toString() === filters.vintage;
    const matchesType = filters.wine_type === '' || wine.wines.wine_type === filters.wine_type;
         const matchesRegion = filters.region === '' || 
       wine.wines.region?.name === filters.region ||
       wine.wines.country?.name === filters.region;
     const matchesCountry = filters.country === '' || wine.wines.country?.name === filters.country;
     const matchesAppellation = filters.appellation === '' || wine.wines.appellation?.name === filters.appellation;
    const matchesProducer = filters.producer === '' || wine.wines.producer === filters.producer;
    
    return matchesSearch && matchesVintage && matchesType && matchesRegion && matchesCountry && matchesAppellation && matchesProducer;
  });

  const [sortKey, setSortKey] = useState<'name' | 'producer' | 'vintage' | 'wine_type' | 'region' | 'quantity' | 'purchase_price'>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const toggleSort = (key: 'name' | 'producer' | 'vintage' | 'wine_type' | 'region' | 'quantity' | 'purchase_price') => {
    if (sortKey === key) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const sortedWines = [...filteredWines].sort((a, b) => {
    let aVal: any;
    let bVal: any;
    switch (sortKey) {
      case 'name': aVal = a.wines.name; bVal = b.wines.name; break;
      case 'producer': aVal = a.wines.producer; bVal = b.wines.producer; break;
      case 'vintage': aVal = a.wines.vintage ?? 0; bVal = b.wines.vintage ?? 0; break;
      case 'wine_type': aVal = a.wines.wine_type; bVal = b.wines.wine_type; break;
             case 'region': aVal = a.wines.region?.name || a.wines.country?.name || ''; bVal = b.wines.region?.name || b.wines.country?.name || ''; break;
      case 'quantity': aVal = a.quantity; bVal = b.quantity; break;
      case 'purchase_price': aVal = a.purchase_price || 0; bVal = b.purchase_price || 0; break;
      default: aVal = 0; bVal = 0;
    }
    const cmp = typeof aVal === 'number' && typeof bVal === 'number'
      ? aVal - bVal
      : String(aVal).localeCompare(String(bVal));
    return sortDir === 'asc' ? cmp : -cmp;
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

  const calculateStats = () => {
    const totalBottles = wines.reduce((sum, wine) => sum + wine.quantity, 0);
    const totalValue = wines.reduce((sum, wine) => sum + (wine.purchase_price || 0) * wine.quantity, 0);
    
    // Convert bottle sizes to liters
    const getBottleSizeInLiters = (size: string) => {
      const sizeMap: Record<string, number> = {
        'Split (187.5ml)': 0.1875,
        'Half Bottle (375ml)': 0.375,
        'Bottle (750ml)': 0.75,
        'Liter (1L)': 1.0,
        'Magnum (1.5L)': 1.5,
        'Double Magnum (3L)': 3.0,
        'Jeroboam (4.5L)': 4.5,
        'Imperial (6L)': 6.0,
        'Salmanazar (9L)': 9.0,
        'Balthazar (12L)': 12.0,
        'Nebuchadnezzar (15L)': 15.0,
        'Melchior (18L)': 18.0
      };
      return sizeMap[size] || 0.75; // Default to 750ml if size not found
    };
    
    const totalLiters = wines.reduce((sum, wine) => {
      const bottleSize = wine.wines.bottle_size || 'Bottle (750ml)';
      const litersPerBottle = getBottleSizeInLiters(bottleSize);
      return sum + (litersPerBottle * wine.quantity);
    }, 0);
    
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

        <div className="mb-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search wines..."
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
              {Array.from(new Set(wines.map(w => w.wines.vintage).filter(Boolean)))
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
              {Array.from(new Set(wines.map(w => w.wines.wine_type))).sort().map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            
            <select 
              value={filters.country} 
              onChange={(e) => setFilters({...filters, country: e.target.value})}
              className="px-3 py-1 text-sm border border-input bg-background rounded-md"
            >
              <option value="">All Countries</option>
              {Array.from(new Set(wines.map(w => w.wines.country?.name).filter(Boolean))).sort().map(country => (
                <option key={country} value={country}>{country}</option>
              ))}
            </select>
            
            <select 
              value={filters.region} 
              onChange={(e) => setFilters({...filters, region: e.target.value})}
              className="px-3 py-1 text-sm border border-input bg-background rounded-md"
            >
              <option value="">All Regions</option>
                             {Array.from(new Set(wines.map(w => w.wines.region?.name || w.wines.country?.name).filter(Boolean))).sort().map(region => (
                <option key={region} value={region}>{region}</option>
              ))}
            </select>
            
            <select 
              value={filters.appellation} 
              onChange={(e) => setFilters({...filters, appellation: e.target.value})}
              className="px-3 py-1 text-sm border border-input bg-background rounded-md"
            >
              <option value="">All Appellations</option>
              {Array.from(new Set(wines.map(w => w.wines.appellation?.name).filter(Boolean))).sort().map(appellation => (
                <option key={appellation} value={appellation}>{appellation}</option>
              ))}
            </select>
            
            <select 
              value={filters.producer} 
              onChange={(e) => setFilters({...filters, producer: e.target.value})}
              className="px-3 py-1 text-sm border border-input bg-background rounded-md"
            >
              <option value="">All Producers</option>
              {Array.from(new Set(wines.map(w => w.wines.producer))).sort().map(producer => (
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
              <div className="space-y-4">
                <div className="flex justify-end">
                  <ColumnSelector
                    columns={cellarColumns}
                    visibleColumns={visibleCellarColumns}
                    onColumnToggle={handleCellarColumnToggle}
                    onResetColumns={resetCellarColumns}
                  />
                </div>
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {visibleCellarColumns.includes('name') && (
                          <TableHead className="cursor-pointer select-none hover:bg-muted" onClick={() => toggleSort('name')}>
                            <div className="flex items-center gap-1">
                              Wine <ArrowUpDown className="h-3 w-3" />
                            </div>
                          </TableHead>
                        )}
                        {visibleCellarColumns.includes('producer') && (
                          <TableHead className="cursor-pointer select-none hover:bg-muted" onClick={() => toggleSort('producer')}>
                            <div className="flex items-center gap-1">
                              Producer <ArrowUpDown className="h-3 w-3" />
                            </div>
                          </TableHead>
                        )}
                        {visibleCellarColumns.includes('vintage') && (
                          <TableHead className="cursor-pointer select-none hover:bg-muted" onClick={() => toggleSort('vintage')}>
                            <div className="flex items-center gap-1">
                              Vintage <ArrowUpDown className="h-3 w-3" />
                            </div>
                          </TableHead>
                        )}
                        {visibleCellarColumns.includes('type') && (
                          <TableHead className="cursor-pointer select-none hover:bg-muted" onClick={() => toggleSort('wine_type')}>
                            <div className="flex items-center gap-1">
                              Type <ArrowUpDown className="h-3 w-3" />
                            </div>
                          </TableHead>
                        )}
                        {visibleCellarColumns.includes('region') && (
                          <TableHead className="cursor-pointer select-none hover:bg-muted" onClick={() => toggleSort('region')}>
                            <div className="flex items-center gap-1">
                              Region <ArrowUpDown className="h-3 w-3" />
                            </div>
                          </TableHead>
                        )}
                        {visibleCellarColumns.includes('country') && (
                          <TableHead>Country</TableHead>
                        )}
                        {visibleCellarColumns.includes('appellation') && (
                          <TableHead>Appellation</TableHead>
                        )}
                        {visibleCellarColumns.includes('quantity') && (
                          <TableHead className="cursor-pointer select-none hover:bg-muted" onClick={() => toggleSort('quantity')}>
                            <div className="flex items-center gap-1">
                              Quantity <ArrowUpDown className="h-3 w-3" />
                            </div>
                          </TableHead>
                        )}
                        {visibleCellarColumns.includes('price') && (
                          <TableHead className="cursor-pointer select-none hover:bg-muted" onClick={() => toggleSort('purchase_price')}>
                            <div className="flex items-center gap-1">
                              Price (DKK) <ArrowUpDown className="h-3 w-3" />
                            </div>
                          </TableHead>
                        )}
                        {visibleCellarColumns.includes('purchase_date') && (
                          <TableHead>Purchase Date</TableHead>
                        )}
                        {visibleCellarColumns.includes('bottle_size') && (
                          <TableHead>Bottle Size</TableHead>
                        )}
                        {visibleCellarColumns.includes('location') && (
                          <TableHead>Storage Location</TableHead>
                        )}
                        {visibleCellarColumns.includes('notes') && (
                          <TableHead>Notes</TableHead>
                        )}
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedWines.map((cellarEntry) => {
                        const wine = cellarEntry.wines;
                        return (
                          <TableRow key={cellarEntry.id}>
                            {visibleCellarColumns.includes('name') && (
                              <TableCell className="font-medium">{wine.name}</TableCell>
                            )}
                            {visibleCellarColumns.includes('producer') && (
                              <TableCell>{wine.producer}</TableCell>
                            )}
                            {visibleCellarColumns.includes('vintage') && (
                              <TableCell>{wine.vintage || 'N/A'}</TableCell>
                            )}
                            {visibleCellarColumns.includes('type') && (
                              <TableCell>
                                <Badge className={getWineTypeColor(wine.wine_type)}>
                                  {wine.wine_type}
                                </Badge>
                              </TableCell>
                            )}
                            {visibleCellarColumns.includes('region') && (
                              <TableCell>
                                {wine.region?.name || 'N/A'}
                              </TableCell>
                            )}
                            {visibleCellarColumns.includes('country') && (
                              <TableCell>
                                {wine.country?.name || 'N/A'}
                              </TableCell>
                            )}
                            {visibleCellarColumns.includes('appellation') && (
                              <TableCell>
                                {wine.appellation?.name || 'N/A'}
                              </TableCell>
                            )}
                            {visibleCellarColumns.includes('quantity') && (
                              <TableCell>
                                <QuantityControl 
                                  cellarId={cellarEntry.id}
                                  wineId={cellarEntry.wines.id}
                                  wineName={wine.name}
                                  currentQuantity={cellarEntry.quantity}
                                  onQuantityChange={fetchCellarWines}
                                  wineData={wine}
                                />
                              </TableCell>
                            )}
                            {visibleCellarColumns.includes('price') && (
                              <TableCell>
                                {cellarEntry.purchase_price ? `${cellarEntry.purchase_price} DKK` : 'N/A'}
                              </TableCell>
                            )}
                            {visibleCellarColumns.includes('purchase_date') && (
                              <TableCell>
                                {cellarEntry.purchase_date ? new Date(cellarEntry.purchase_date).toLocaleDateString() : 'N/A'}
                              </TableCell>
                            )}
                            {visibleCellarColumns.includes('bottle_size') && (
                              <TableCell>
                                {wine.bottle_size || 'N/A'}
                              </TableCell>
                            )}
                            {visibleCellarColumns.includes('location') && (
                              <TableCell>{cellarEntry.storage_location || 'N/A'}</TableCell>
                            )}
                            {visibleCellarColumns.includes('notes') && (
                              <TableCell>
                                <div className="max-w-32 truncate" title={cellarEntry.notes || ''}>
                                  {cellarEntry.notes || 'N/A'}
                                </div>
                              </TableCell>
                            )}
                            <TableCell>
                              <EditWineDialog cellarEntry={cellarEntry} onWineUpdated={fetchCellarWines} />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredWines.map((cellarEntry) => {
              const wine = cellarEntry.wines;
              return (
                <Card key={cellarEntry.id} className="hover:shadow-lg transition-shadow">
                  {wine.image_url && (
                    <div className="w-full h-48 overflow-hidden rounded-t-lg">
                      <img 
                        src={wine.image_url} 
                        alt={wine.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
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
                        <span>{wine.region?.name || wine.country?.name || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Quantity:</span>
                        <QuantityControl 
                          cellarId={cellarEntry.id}
                          wineId={cellarEntry.wines.id}
                          wineName={wine.name}
                          currentQuantity={cellarEntry.quantity}
                          onQuantityChange={fetchCellarWines}
                          wineData={wine}
                        />
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
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Consumed Wines</h3>
                <ColumnSelector
                  columns={consumedColumns}
                  visibleColumns={visibleConsumedColumns}
                  onColumnToggle={handleConsumedColumnToggle}
                  onResetColumns={resetConsumedColumns}
                />
              </div>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {visibleConsumedColumns.includes('name') && (
                        <TableHead>Wine</TableHead>
                      )}
                      {visibleConsumedColumns.includes('producer') && (
                        <TableHead>Producer</TableHead>
                      )}
                      {visibleConsumedColumns.includes('vintage') && (
                        <TableHead>Vintage</TableHead>
                      )}
                      {visibleConsumedColumns.includes('type') && (
                        <TableHead>Type</TableHead>
                      )}
                      {visibleConsumedColumns.includes('consumed_date') && (
                        <TableHead>Consumed Date</TableHead>
                      )}
                      {visibleConsumedColumns.includes('quantity') && (
                        <TableHead>Quantity</TableHead>
                      )}
                      {visibleConsumedColumns.includes('notes') && (
                        <TableHead>Notes</TableHead>
                      )}
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {consumedWines.map((consumption) => (
                      <TableRow key={consumption.id}>
                        {visibleConsumedColumns.includes('name') && (
                          <TableCell>
                            <div className="font-medium">{consumption.wines?.name || 'Unknown Wine'}</div>
                          </TableCell>
                        )}
                        {visibleConsumedColumns.includes('producer') && (
                          <TableCell>{consumption.wines?.producer || 'Unknown Producer'}</TableCell>
                        )}
                        {visibleConsumedColumns.includes('vintage') && (
                          <TableCell>{consumption.wines?.vintage || 'NV'}</TableCell>
                        )}
                        {visibleConsumedColumns.includes('type') && (
                          <TableCell>
                            <Badge className={getWineTypeColor(consumption.wines?.wine_type || '')}>
                              {consumption.wines?.wine_type || 'Unknown'}
                            </Badge>
                          </TableCell>
                        )}
                        {visibleConsumedColumns.includes('consumed_date') && (
                          <TableCell>
                            {new Date(consumption.consumed_at).toLocaleDateString()}
                          </TableCell>
                        )}
                        {visibleConsumedColumns.includes('quantity') && (
                          <TableCell>{consumption.quantity}</TableCell>
                        )}
                        {visibleConsumedColumns.includes('notes') && (
                          <TableCell>
                            <div className="max-w-32 truncate" title={consumption.notes || ''}>
                              {consumption.notes || 'N/A'}
                            </div>
                          </TableCell>
                        )}
                        <TableCell>
                          <div className="flex gap-2">
                                                         <Button 
                               size="sm" 
                               onClick={() => consumption.wine_database_id ? addToCellar(consumption.wine_database_id, consumption.wines?.name || 'Unknown Wine') : null}
                               disabled={!consumption.wine_database_id}
                             >
                              Add to Cellar
                            </Button>
                            <DeleteConsumptionDialog
                              consumptionId={consumption.id}
                              wineName={consumption.wines?.name || 'Unknown Wine'}
                              onDeleted={() => { fetchConsumedWines(); fetchCellarWines(); }}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}