import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Search, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { SearchableSelect } from '@/components/ui/searchable-select';

interface WineSearchResult {
  id: string;
  name: string;
  wine_type: string;
  alcohol_content?: number | null;
  description?: string | null;
  producer_id: string;
  country_id: string;
  region_id?: string | null;
  appellation_id?: string | null;
  producers?: { name: string } | null;
  countries?: { name: string } | null;
  regions?: { name: string } | null;
  appellations?: { name: string } | null;
}

interface WineSearchDialogProps {
  onWineSelect: (wine: WineSearchResult) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

export default function WineSearchDialog({ onWineSelect, open: externalOpen, onOpenChange: externalOnOpenChange, trigger }: WineSearchDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = externalOnOpenChange || setInternalOpen;

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedCountry, setSelectedCountry] = useState('all');
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [selectedAppellation, setSelectedAppellation] = useState('all');
  const [selectedProducer, setSelectedProducer] = useState('all');
  const [results, setResults] = useState<WineSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [countries, setCountries] = useState<{value: string; label: string}[]>([]);
  const [regions, setRegions] = useState<{value: string; label: string}[]>([]);
  const [appellations, setAppellations] = useState<{value: string; label: string}[]>([]);
  const [producers, setProducers] = useState<{value: string; label: string}[]>([]);
  const itemsPerPage = 20;

  useEffect(() => {
    if (open) {
      loadCountries();
      loadRegions();
      loadAppellations();
      loadProducers();
      searchWines();
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      setCurrentPage(1);
      searchWines();
    }
  }, [searchTerm, selectedType, selectedCountry, selectedRegion, selectedAppellation, selectedProducer]);

  useEffect(() => {
    if (open) {
      searchWines();
    }
  }, [currentPage]);

  const loadCountries = async () => {
    try {
      const { data, error } = await supabase
        .from('countries')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      const countryOptions = (data || []).map(country => ({
        value: country.id,
        label: country.name
      }));
      setCountries(countryOptions);
    } catch (error) {
      console.error('Error loading countries:', error);
    }
  };

  const loadRegions = async () => {
    try {
      const { data, error } = await supabase
        .from('regions')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      const regionOptions = (data || []).map(region => ({
        value: region.id,
        label: region.name
      }));
      setRegions(regionOptions);
    } catch (error) {
      console.error('Error loading regions:', error);
    }
  };

  const loadAppellations = async () => {
    try {
      const { data, error } = await supabase
        .from('appellations')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      const appellationOptions = (data || []).map(appellation => ({
        value: appellation.id,
        label: appellation.name
      }));
      setAppellations(appellationOptions);
    } catch (error) {
      console.error('Error loading appellations:', error);
    }
  };

  const loadProducers = async () => {
    try {
      const { data, error } = await supabase
        .from('producers')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      const producerOptions = (data || []).map(producer => ({
        value: producer.id,
        label: producer.name
      }));
      setProducers(producerOptions);
    } catch (error) {
      console.error('Error loading producers:', error);
    }
  };

  const searchWines = async () => {
    try {
      setSearching(true);
      
      let query = supabase
        .from('wine_database')
        .select(`
          id, name, wine_type, alcohol_content, description,
          producer_id, country_id, region_id, appellation_id,
          producers ( name ),
          countries ( name ),
          regions ( name ),
          appellations ( name )
        `, { count: 'exact' });

      // Apply filters
      if (searchTerm) {
        query = query.ilike('name', `%${searchTerm}%`);
      }
      
      if (selectedType !== 'all') {
        query = query.eq('wine_type', selectedType);
      }
      
      if (selectedCountry !== 'all') {
        query = query.eq('country_id', selectedCountry);
      }
      
      if (selectedRegion !== 'all') {
        query = query.eq('region_id', selectedRegion);
      }
      
      if (selectedAppellation !== 'all') {
        query = query.eq('appellation_id', selectedAppellation);
      }
      
      if (selectedProducer !== 'all') {
        query = query.eq('producer_id', selectedProducer);
      }

      // Apply pagination
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;
      
      query = query.range(from, to).order('name');
      
      const { data, error, count } = await query;
      
      if (error) throw error;
      
      setResults((data as any) || []);
      setTotalPages(Math.ceil((count || 0) / itemsPerPage));
    } catch (error) {
      console.error('Error searching wines:', error);
      toast({ title: 'Error', description: 'Failed to search wine database', variant: 'destructive' });
    } finally {
      setSearching(false);
    }
  };

  // Remove the filtering logic since it's now done server-side

  const handleWineSelect = (wine: WineSearchResult) => {
    onWineSelect(wine);
    setOpen(false);
    setSearchTerm('');
    setSelectedType('all');
    setSelectedCountry('all');
    setSelectedRegion('all');
    setSelectedAppellation('all');
    setSelectedProducer('all');
    setCurrentPage(1);
    setResults([]);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && (
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
      )}
      {!trigger && (
        <DialogTrigger asChild>
          <Button variant="outline">
            <Search className="h-4 w-4 mr-2" />
            Search Wine Database
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Wine Database Search</DialogTitle>
          <DialogDescription>Search our curated wine database to auto-fill wine information</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Wine name, producer, or region..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="type">Wine Type</Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent className="z-[60]" side="bottom">
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="red">Red</SelectItem>
                  <SelectItem value="white">White</SelectItem>
                  <SelectItem value="rose">Rosé</SelectItem>
                  <SelectItem value="sparkling">Sparkling</SelectItem>
                  <SelectItem value="dessert">Dessert</SelectItem>
                  <SelectItem value="fortified">Fortified</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="country">Country</Label>
              <SearchableSelect
                options={[{value: 'all', label: 'All countries'}, ...countries]}
                value={selectedCountry}
                onValueChange={setSelectedCountry}
                placeholder="All countries"
                searchPlaceholder="Search countries..."
              />
            </div>
            <div>
              <Label htmlFor="region">Region</Label>
              <SearchableSelect
                options={[{value: 'all', label: 'All regions'}, ...regions]}
                value={selectedRegion}
                onValueChange={setSelectedRegion}
                placeholder="All regions"
                searchPlaceholder="Search regions..."
              />
            </div>
            <div>
              <Label htmlFor="appellation">Appellation</Label>
              <SearchableSelect
                options={[{value: 'all', label: 'All appellations'}, ...appellations]}
                value={selectedAppellation}
                onValueChange={setSelectedAppellation}
                placeholder="All appellations"
                searchPlaceholder="Search appellations..."
              />
            </div>
            <div>
              <Label htmlFor="producer">Producer</Label>
              <SearchableSelect
                options={[{value: 'all', label: 'All producers'}, ...producers]}
                value={selectedProducer}
                onValueChange={setSelectedProducer}
                placeholder="All producers"
                searchPlaceholder="Search producers..."
              />
            </div>
          </div>

          <Button onClick={searchWines} disabled={searching} className="w-full">
            <Search className="h-4 w-4 mr-2" />
            {searching ? 'Searching...' : 'Search Database'}
          </Button>

          {searching ? (
            <div className="text-center py-8">
              <div className="text-sm text-muted-foreground">Searching wines...</div>
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-sm text-muted-foreground">No wines found matching your criteria</div>
            </div>
          ) : (
            <>
              <div className="grid gap-3 max-h-96 overflow-y-auto">
                {results.map((wine) => (
                  <Card key={wine.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleWineSelect(wine)}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm">{wine.name}</h4>
                          <p className="text-sm text-muted-foreground">{wine.producers?.name || ''}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="text-xs">{wine.wine_type}</Badge>
                            {wine.countries?.name && (
                              <Badge variant="secondary" className="text-xs">{wine.countries.name}</Badge>
                            )}
                            {wine.regions?.name && (
                              <Badge variant="secondary" className="text-xs">{wine.regions.name}</Badge>
                            )}
                            {wine.appellations?.name && (
                              <Badge variant="secondary" className="text-xs">{wine.appellations.name}</Badge>
                            )}
                          </div>
                          {wine.alcohol_content && (
                            <p className="text-xs text-muted-foreground mt-1">{wine.alcohol_content}% ABV</p>
                          )}
                          {wine.description && (
                            <p className="text-xs text-muted-foreground mt-1">{wine.description}</p>
                          )}
                        </div>
                        <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0 ml-2" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {totalPages > 1 && (
                <Pagination className="mt-4">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
                        className={currentPage <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                    
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                      return (
                        <PaginationItem key={pageNum}>
                          <PaginationLink
                            onClick={() => setCurrentPage(pageNum)}
                            isActive={currentPage === pageNum}
                            className="cursor-pointer"
                          >
                            {pageNum}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })}
                    
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => currentPage < totalPages && setCurrentPage(currentPage + 1)}
                        className={currentPage >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
