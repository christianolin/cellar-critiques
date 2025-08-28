import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { Plus, PlusCircle, X, Wine, Search } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import WineSearchDialog from '@/components/WineSearchDialog';
import { SearchableSelect } from '@/components/ui/searchable-select';
import ProducerSelect from '@/components/ProducerSelect';

interface Wine {
  id: string;
  name: string;
  producer: string;
  vintage: number | null;
  wine_type: string;
  bottle_size?: string | null;
  alcohol_content?: number | null;
  country_id?: string | null;
  region_id?: string | null;
  appellation_id?: string | null;
  image_url?: string | null;
}

interface Country {
  id: string;
  name: string;
}

interface Region {
  id: string;
  name: string;
  country_id: string;
}

interface Appellation {
  id: string;
  name: string;
  region_id: string;
}

interface GrapeVariety {
  id: string;
  name: string;
  type: string;
}

interface AddRatingDialogProps {
  onRatingAdded?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
  prefilledWine?: any; // Wine data to pre-fill the form
}

export default function AddRatingDialog({ onRatingAdded, open: externalOpen, onOpenChange: externalOnOpenChange, trigger, prefilledWine }: AddRatingDialogProps) {
  const { user } = useAuth();
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = externalOnOpenChange || setInternalOpen;
  const [cellarWines, setCellarWines] = useState<Wine[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [appellations, setAppellations] = useState<Appellation[]>([]);
  const [grapeVarieties, setGrapeVarieties] = useState<GrapeVariety[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedWine, setSelectedWine] = useState<string>('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [mode, setMode] = useState<'cellar' | 'new'>('cellar');
  
  const [formData, setFormData] = useState({
    rating: 85,
    tasting_date: new Date().toISOString().split('T')[0],
    tasting_notes: '',
    food_pairing: '',
    // Detailed rating fields
    appearance_color: '',
    appearance_intensity: '',
    appearance_clarity: '',
    appearance_viscosity: '',
    appearance_comments: '',
    aroma_condition: '',
    aroma_intensity: '',
    aroma_primary: '',
    aroma_secondary: '',
    aroma_tertiary: '',
    aroma_comments: '',
    palate_sweetness: '',
    palate_acidity: '',
    palate_tannin: '',
    palate_body: '',
    palate_flavor_primary: '',
    palate_flavor_secondary: '',
    palate_flavor_tertiary: '',
    palate_complexity: '',
    palate_finish: '',
    palate_balance: '',
    palate_comments: '',
  });

  // New wine form data
  const [newWineData, setNewWineData] = useState({
    name: '',
    producer: '',
    vintage: null as number | null,
    wine_type: 'red' as 'red' | 'white' | 'rose' | 'sparkling' | 'dessert' | 'fortified',
    alcohol_content: null as number | null, // stored on wine_vintages
    bottle_size: '750ml',
    country_id: '',
    region_id: '',
    appellation_id: '',
    grape_varieties: [] as { id: string; name: string; type: string; percentage: number }[],
    image_url: null as string | null,
    wine_database_id: undefined as string | undefined,
  });
  useEffect(() => {
    if (open) {
      fetchCellarWines();
      fetchMasterData();
      
      // Handle pre-filled wine data from cellar
      if (prefilledWine) {
        setMode('new');
        setNewWineData({
          name: prefilledWine.name || '',
          producer: prefilledWine.producer || '',
          vintage: prefilledWine.vintage || null,
          wine_type: prefilledWine.wine_type || 'red',
          alcohol_content: prefilledWine.alcohol_content || null,
          bottle_size: prefilledWine.bottle_size || '750ml',
          country_id: prefilledWine.country_id || '',
          region_id: prefilledWine.region_id || '',
          appellation_id: prefilledWine.appellation_id || '',
          grape_varieties: [],
          image_url: prefilledWine.image_url || null,
          wine_database_id: prefilledWine.wine_database_id || undefined,
        });
      }
    }
  }, [open, prefilledWine]);

  // Get selected wine data for prefilling
  const selectedWineData = cellarWines.find(wine => wine.id === selectedWine);

  // Handle cellar wine selection - pre-fill the new wine form
  useEffect(() => {
    if (selectedWineData && mode === 'cellar') {
      setMode('new');
      setNewWineData({
        name: selectedWineData.name || '',
        producer: selectedWineData.producer || '',
        vintage: selectedWineData.vintage || null,
        wine_type: (selectedWineData.wine_type as 'red' | 'white' | 'rose' | 'sparkling' | 'dessert' | 'fortified') || 'red',
        alcohol_content: selectedWineData.alcohol_content || null,
        bottle_size: selectedWineData.bottle_size || '750ml',
        country_id: selectedWineData.country_id || '',
        region_id: selectedWineData.region_id || '',
        appellation_id: selectedWineData.appellation_id || '',
        grape_varieties: [],
        image_url: selectedWineData.image_url || null,
        wine_database_id: selectedWineData.id,
      });
    }
  }, [selectedWineData, mode]);

  const fetchCellarWines = async () => {
    try {
      const { data, error } = await supabase
        .from('wine_cellar')
        .select(`
          id,
          wine_database_id,
          wine_vintage_id,
          wine_database (
            id,
            name,
            wine_type,
            country_id,
            region_id,
            appellation_id,
            producers (
              name
            )
          ),
          wine_vintages (
            id,
            vintage,
            alcohol_content,
            image_url
          )
        `)
        .eq('user_id', user?.id);

      if (error) throw error;
      
      // Transform data to match Wine interface
      const wines = (data || []).map((entry: any) => ({
        id: entry.wine_database_id,
        name: entry.wine_database?.name || '',
        producer: entry.wine_database?.producers?.name || '',
        vintage: entry.wine_vintages?.vintage || null,
        wine_type: entry.wine_database?.wine_type || '',
        bottle_size: '750ml', // Default bottle size
        alcohol_content: entry.wine_vintages?.alcohol_content || null,
        country_id: entry.wine_database?.country_id || null,
        region_id: entry.wine_database?.region_id || null,
        appellation_id: entry.wine_database?.appellation_id || null,
        image_url: entry.wine_vintages?.image_url || null,
      }));
      
      // Remove duplicates based on wine_database_id
      const unique = Array.from(new Map(wines.map((wine: any) => [wine.id, wine])).values());
      setCellarWines(unique as Wine[]);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load your cellar wines', variant: 'destructive' });
    }
  };

  const fetchMasterData = async () => {
    try {
      const [countriesRes, regionsRes, appellationsRes, grapeVarietiesRes] = await Promise.all([
        supabase.from('countries').select('id, name').order('name'),
        supabase.from('regions').select('id, name, country_id').order('name'),
        supabase.from('appellations').select('id, name, region_id').order('name'),
        supabase.from('grape_varieties').select('id, name, type').order('name')
      ]);

      setCountries(countriesRes.data || []);
      setRegions(regionsRes.data || []);
      setAppellations(appellationsRes.data || []);
      setGrapeVarieties(grapeVarietiesRes.data || []);
    } catch (error) {
      toast({ title: "Error", description: "Failed to load master data", variant: "destructive" });
    }
  };

  const createOrSelectWine = async () => {
    try {
      // 1) Ensure wine_database exists (or use provided id)
      let wineDatabaseId = newWineData.wine_database_id;
      if (!wineDatabaseId) {
        // resolve producer_id by name
        let producerId: string | undefined;
        if (newWineData.producer) {
          const { data: prod } = await supabase.from('producers').select('id').ilike('name', newWineData.producer).limit(1).maybeSingle();
          if (prod?.id) producerId = prod.id;
          else {
            const { data: newProd } = await supabase.from('producers').insert({ name: newWineData.producer }).select('id').single();
            producerId = newProd?.id;
          }
        }
        const { data: wineDb, error: wineDbErr } = await supabase
          .from('wine_database')
          .insert({
            name: newWineData.name,
            wine_type: newWineData.wine_type,
            producer_id: producerId!,
            country_id: newWineData.country_id || null,
            region_id: newWineData.region_id || null,
            appellation_id: newWineData.appellation_id || null,
          })
          .select('id')
          .single();
        if (wineDbErr) throw wineDbErr;
        wineDatabaseId = wineDb?.id;
      }

      return { wineDatabaseId: wineDatabaseId!, wineVintageId: null };
    } catch (error) {
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    let wineDatabaseId: string | undefined;
    let wineVintageId: string | null | undefined;

    if (mode === 'new') {
      if (!newWineData.name || !newWineData.producer) {
        toast({ title: "Error", description: "Wine name and producer are required", variant: "destructive" });
        return;
      }
      setLoading(true);
      try {
        const ids = await createOrSelectWine();
        wineDatabaseId = ids.wineDatabaseId;
        wineVintageId = ids.wineVintageId;
      } catch (error) {
        toast({ title: "Error", description: "Failed to create wine", variant: "destructive" });
        setLoading(false);
        return;
      }
    } else if (!selectedWine) {
      toast({ title: "Error", description: "Please select a wine", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('wine_ratings')
        .insert({
          user_id: user.id,
          wine_id: wineDatabaseId || newWineData.wine_database_id || '',
          rating: formData.rating,
          tasting_date: formData.tasting_date,
          tasting_notes: formData.tasting_notes || null,
          food_pairing: formData.food_pairing || null,
          appearance_color: formData.appearance_color || null,
          appearance_intensity: formData.appearance_intensity || null,
          appearance_clarity: formData.appearance_clarity || null,
          appearance_viscosity: formData.appearance_viscosity || null,
          appearance_comments: formData.appearance_comments || null,
          aroma_condition: formData.aroma_condition || null,
          aroma_intensity: formData.aroma_intensity || null,
          aroma_primary: formData.aroma_primary || null,
          aroma_secondary: formData.aroma_secondary || null,
          aroma_tertiary: formData.aroma_tertiary || null,
          aroma_comments: formData.aroma_comments || null,
          palate_sweetness: formData.palate_sweetness || null,
          palate_acidity: formData.palate_acidity || null,
          palate_tannin: formData.palate_tannin || null,
          palate_body: formData.palate_body || null,
          palate_flavor_primary: formData.palate_flavor_primary || null,
          palate_flavor_secondary: formData.palate_flavor_secondary || null,
          palate_flavor_tertiary: formData.palate_flavor_tertiary || null,
          palate_complexity: formData.palate_complexity || null,
          palate_finish: formData.palate_finish || null,
          palate_balance: formData.palate_balance || null,
          palate_comments: formData.palate_comments || null,
        });

      if (error) throw error;

      // Remove consumption entry creation temporarily until types are updated
      // This feature will be re-added once wine_consumptions table structure is confirmed

      toast({ title: "Success", description: "Rating added successfully and wine added to consumed archive!" });
      setOpen(false);
      resetForm();
      onRatingAdded?.();
    } catch (error) {
      toast({ title: "Error", description: "Failed to add rating", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedWine('');
    setMode('cellar');
    setFormData({
      rating: 85,
      tasting_date: new Date().toISOString().split('T')[0],
      tasting_notes: '',
      food_pairing: '',
      appearance_color: '',
      appearance_intensity: '',
      appearance_clarity: '',
      appearance_viscosity: '',
      appearance_comments: '',
      aroma_condition: '',
      aroma_intensity: '',
      aroma_primary: '',
      aroma_secondary: '',
      aroma_tertiary: '',
      aroma_comments: '',
      palate_sweetness: '',
      palate_acidity: '',
      palate_tannin: '',
      palate_body: '',
      palate_flavor_primary: '',
      palate_flavor_secondary: '',
      palate_flavor_tertiary: '',
      palate_complexity: '',
      palate_finish: '',
      palate_balance: '',
      palate_comments: '',
    });
    setNewWineData({
      name: '',
      producer: '',
      vintage: null,
      wine_type: 'red',
      alcohol_content: null,
      bottle_size: '750ml',
      country_id: '',
      region_id: '',
      appellation_id: '',
      grape_varieties: [],
      image_url: null,
      wine_database_id: undefined,
    });
  };

  const filteredRegions = regions.filter(region => 
    !newWineData.country_id || region.country_id === newWineData.country_id
  );

  const filteredAppellations = appellations.filter(appellation => 
    !newWineData.region_id || appellation.region_id === newWineData.region_id
  );

  const addGrapeVariety = (grapeId: string) => {
    const grape = grapeVarieties.find(g => g.id === grapeId);
    if (grape && !newWineData.grape_varieties.find(g => g.id === grapeId)) {
      const newGrapes = [...newWineData.grape_varieties, { ...grape, percentage: 0 }];
      const evenPercentage = Math.floor(100 / newGrapes.length);
      const updatedGrapes = newGrapes.map(g => ({ ...g, percentage: evenPercentage }));
      setNewWineData({ ...newWineData, grape_varieties: updatedGrapes });
    }
  };

  const removeGrapeVariety = (grapeId: string) => {
    const remainingGrapes = newWineData.grape_varieties.filter(g => g.id !== grapeId);
    if (remainingGrapes.length > 0) {
      const evenPercentage = Math.floor(100 / remainingGrapes.length);
      const updatedGrapes = remainingGrapes.map(g => ({ ...g, percentage: evenPercentage }));
      setNewWineData({ ...newWineData, grape_varieties: updatedGrapes });
    } else {
      setNewWineData({ ...newWineData, grape_varieties: [] });
    }
  };

  const updateGrapePercentage = (grapeId: string, percentage: number) => {
    setNewWineData({
      ...newWineData,
      grape_varieties: newWineData.grape_varieties.map(g => 
        g.id === grapeId ? { ...g, percentage } : g
      )
    });
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    setUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `wine-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('wine-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('wine-images')
        .getPublicUrl(fileName);

      setNewWineData({ ...newWineData, image_url: publicUrl });
      
      toast({
        title: "Success",
        description: "Image uploaded successfully",
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setUploadingImage(false);
    }
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
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Rating
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Wine Rating</DialogTitle>
          <DialogDescription>
            Rate a wine using the detailed evaluation system
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="wine" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="wine">Wine Info</TabsTrigger>
              <TabsTrigger value="rating">Rating</TabsTrigger>
              <TabsTrigger value="appearance">Appearance</TabsTrigger>
              <TabsTrigger value="aroma">Aroma</TabsTrigger>
              <TabsTrigger value="palate">Palate</TabsTrigger>
            </TabsList>

            <TabsContent value="wine" className="space-y-4">
              <h3 className="text-lg font-semibold">Wine Selection</h3>
              
              {/* Hide toggle buttons when wine data is pre-filled */}
              {!prefilledWine && !selectedWineData && (
                <div className="flex gap-2 mb-4">
                  <Button
                    type="button"
                    variant={mode === 'cellar' ? 'default' : 'outline'}
                    onClick={() => setMode('cellar')}
                  >
                    <Wine className="h-4 w-4 mr-2" />
                    Select from Cellar
                  </Button>
                  <Button
                    type="button"
                    variant={mode === 'new' ? 'default' : 'outline'}
                    onClick={() => setMode('new')}
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add New Wine
                  </Button>
                </div>
              )}

              {mode === 'cellar' ? (
                <div>
                  <Label htmlFor="wine">Select Wine *</Label>
                      <SearchableSelect
                        options={[{value: 'cellar', label: 'Select from Cellar'}, ...cellarWines.map(wine => ({
                          value: wine.id, 
                          label: `${wine.name} - ${wine.producer} ${wine.vintage ? `(${wine.vintage})` : ''}`
                        }))]}
                        value={selectedWine}
                        onValueChange={setSelectedWine}
                        placeholder="Choose wine from your cellar"
                        searchPlaceholder="Search cellar wines..."
                      />
                  <p className="text-xs text-muted-foreground mt-1">
                    Select from wines in your cellar
                  </p>

                  {selectedWineData && (
                    <div className="mt-4 p-4 bg-muted rounded-lg">
                      <h4 className="font-medium mb-2">Wine Information (from your cellar)</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div><strong>Name:</strong> {selectedWineData.name}</div>
                        <div><strong>Producer:</strong> {selectedWineData.producer}</div>
                        <div><strong>Vintage:</strong> {selectedWineData.vintage || 'N/A'}</div>
                        <div><strong>Type:</strong> {selectedWineData.wine_type}</div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                  <div className="space-y-4">
                   <div className="flex justify-between items-center">
                     <h4 className="font-medium">Wine Information</h4>
                     <WineSearchDialog 
                          onWineSelect={(wine) => {
                            setNewWineData({
                              ...newWineData,
                              name: wine.name,
                              producer: wine.producers?.name || '',
                              vintage: null,
                              wine_type: wine.wine_type as any,
                              alcohol_content: wine.alcohol_content || null,
                              country_id: wine.country_id || '',
                              region_id: wine.region_id || '',
                              appellation_id: wine.appellation_id || '',
                            });
                          }}
                       trigger={
                         <Button type="button" variant="outline" size="sm">
                           <Search className="h-4 w-4 mr-2" />
                           Search Wine Database
                         </Button>
                       }
                     />
                   </div>
                   <p className="text-sm text-muted-foreground">
                     Fill in the wine details or use the search above to auto-fill from our wine database
                   </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Wine Name *</Label>
                      <Input
                        id="name"
                        value={newWineData.name}
                        onChange={(e) => setNewWineData({ ...newWineData, name: e.target.value })}
                        placeholder="e.g., Château Margaux"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="producer">Producer *</Label>
                      <ProducerSelect
                        value={newWineData.producer}
                        onChange={(name) => setNewWineData({ ...newWineData, producer: name })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="wine_type">Wine Type *</Label>
                      <Select
                        value={newWineData.wine_type}
                        onValueChange={(value: any) => setNewWineData({ ...newWineData, wine_type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
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
                      <Label htmlFor="bottle_size">Bottle Size</Label>
                      <Select
                        value={newWineData.bottle_size}
                        onValueChange={(value) => setNewWineData({ ...newWineData, bottle_size: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="187.5ml">Split/Piccolo (187.5ml)</SelectItem>
                          <SelectItem value="375ml">Half Bottle/Demi (375ml)</SelectItem>
                          <SelectItem value="750ml">Standard Bottle (750ml)</SelectItem>
                          <SelectItem value="1000ml">Liter (1000ml)</SelectItem>
                          <SelectItem value="1500ml">Magnum (1500ml)</SelectItem>
                          <SelectItem value="3000ml">Double Magnum/Jeroboam (3L)</SelectItem>
                          <SelectItem value="4500ml">Rehoboam (4.5L)</SelectItem>
                          <SelectItem value="6000ml">Imperial/Methuselah (6L)</SelectItem>
                          <SelectItem value="9000ml">Salmanazar (9L)</SelectItem>
                          <SelectItem value="12000ml">Balthazar (12L)</SelectItem>
                          <SelectItem value="15000ml">Nebuchadnezzar (15L)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="vintage">Vintage</Label>
                      <Input
                        id="vintage"
                        type="number"
                        min="1800"
                        max="2030"
                        value={newWineData.vintage ?? ''}
                        onChange={(e) => setNewWineData({ ...newWineData, vintage: e.target.value ? parseInt(e.target.value) : null })}
                        placeholder="e.g., 2020"
                      />
                    </div>
                    <div>
                      <Label htmlFor="wine_image">Wine Image</Label>
                      <div className="space-y-2">
                        <Input
                          id="wine_image"
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          disabled={uploadingImage}
                        />
                        {uploadingImage && <p className="text-sm text-muted-foreground">Uploading...</p>}
                        {newWineData.image_url && (
                          <div className="flex items-center gap-2">
                            <img src={newWineData.image_url} alt="Wine preview" className="w-16 h-16 object-cover rounded" />
                            <Button 
                              type="button" 
                              variant="outline" 
                              size="sm"
                              onClick={() => setNewWineData({ ...newWineData, image_url: null })}
                            >
                              Remove
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                     <div>
                       <Label htmlFor="country">Country *</Label>
                       <SearchableSelect
                         options={countries.map(country => ({value: country.id, label: country.name}))}
                         value={newWineData.country_id}
                         onValueChange={(value) => setNewWineData({ ...newWineData, country_id: value, region_id: '', appellation_id: '' })}
                         placeholder="Select country"
                         searchPlaceholder="Search countries..."
                       />
                     </div>
                     <div>
                       <Label htmlFor="region">Region</Label>
                       <SearchableSelect
                         options={(newWineData.country_id ? filteredRegions : regions).map(region => ({value: region.id, label: region.name}))}
                         value={newWineData.region_id}
                         onValueChange={(value) => {
                           const selectedRegion = regions.find(r => r.id === value);
                           setNewWineData({ 
                             ...newWineData, 
                             region_id: value, 
                             country_id: selectedRegion?.country_id || newWineData.country_id,
                             appellation_id: ''
                           });
                         }}
                         placeholder="Select region"
                         searchPlaceholder="Search regions..."
                         allowNone={true}
                       />
                     </div>
                     <div>
                       <Label htmlFor="appellation">Appellation</Label>
                       <SearchableSelect
                         options={(newWineData.region_id ? filteredAppellations : appellations).map(appellation => ({value: appellation.id, label: appellation.name}))}
                         value={newWineData.appellation_id}
                         onValueChange={(value) => {
                           const selectedApp = appellations.find(a => a.id === value);
                           const selectedRegion = selectedApp ? regions.find(r => r.id === selectedApp.region_id) : undefined;
                           setNewWineData({ 
                             ...newWineData, 
                             appellation_id: value,
                             region_id: selectedRegion?.id || newWineData.region_id,
                             country_id: selectedRegion?.country_id || newWineData.country_id,
                           });
                         }}
                         placeholder="Select appellation"
                         searchPlaceholder="Search appellations..."
                         allowNone={true}
                       />
                     </div>
                  </div>

                  <div>
                    <Label htmlFor="grape_varieties">Grape Varieties with Percentages</Label>
                    <Select value="" onValueChange={addGrapeVariety}>
                      <SelectTrigger>
                        <SelectValue placeholder="Add grape varieties" />
                      </SelectTrigger>
                      <SelectContent>
                        {grapeVarieties.map((grape) => (
                          <SelectItem key={grape.id} value={grape.id}>
                            {grape.name} ({grape.type})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    {newWineData.grape_varieties.length > 0 && (
                      <div className="space-y-2 mt-2">
                        {newWineData.grape_varieties.map((grape) => (
                          <div key={grape.id} className="flex items-center gap-2 p-2 bg-secondary rounded-md">
                            <span className="flex-1 text-sm">{grape.name}</span>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              value={grape.percentage}
                              onChange={(e) => updateGrapePercentage(grape.id, parseInt(e.target.value) || 0)}
                              className="w-20"
                              placeholder="%"
                            />
                            <span className="text-sm">%</span>
                            <X
                              className="h-4 w-4 cursor-pointer"
                              onClick={() => removeGrapeVariety(grape.id)}
                            />
                          </div>
                        ))}
                        <div className="text-xs text-muted-foreground">
                          Total: {newWineData.grape_varieties.reduce((sum, g) => sum + g.percentage, 0)}%
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="alcohol_content">Alcohol Content (%)</Label>
                      <Input
                        id="alcohol_content"
                        type="number"
                        step="0.1"
                        min="0"
                        max="50"
                        value={newWineData.alcohol_content ?? ''}
                        onChange={(e) => setNewWineData({ ...newWineData, alcohol_content: e.target.value ? parseFloat(e.target.value) : null })}
                      />
                    </div>
                    <div>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="rating" className="space-y-4">
              <h3 className="text-lg font-semibold">Rating Information</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="rating">Rating (50-100) *</Label>
                  <Input
                    id="rating"
                    type="number"
                    min="50"
                    max="100"
                    value={formData.rating}
                    onChange={(e) => setFormData({ ...formData, rating: parseInt(e.target.value) || 85 })}
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    60-69: Major flaws, poor | 70-79: Small flaws, average | 80-84: Above average | 85-89: Good/very good | 90-94: Superior & exceptional | 95-100: Benchmark wines, classics
                  </p>
                </div>
                <div>
                  <Label htmlFor="tasting_date">Tasting Date</Label>
                  <Input
                    id="tasting_date"
                    type="date"
                    value={formData.tasting_date}
                    onChange={(e) => setFormData({ ...formData, tasting_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tasting_notes">Tasting Notes</Label>
                  <Textarea
                    id="tasting_notes"
                    value={formData.tasting_notes}
                    onChange={(e) => setFormData({ ...formData, tasting_notes: e.target.value })}
                    placeholder="Overall impression and notes..."
                  />
                </div>
                <div>
                  <Label htmlFor="food_pairing">Food Pairing</Label>
                  <Textarea
                    id="food_pairing"
                    value={formData.food_pairing}
                    onChange={(e) => setFormData({ ...formData, food_pairing: e.target.value })}
                    placeholder="Suggested pairings..."
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="appearance" className="space-y-4">
              <h3 className="text-lg font-semibold">Appearance</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="appearance_color">Color</Label>
                  <Select value={formData.appearance_color} onValueChange={(value) => setFormData({ ...formData, appearance_color: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select color" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="straw_green">Straw/Green-yellow</SelectItem>
                      <SelectItem value="yellow">Yellow</SelectItem>
                      <SelectItem value="gold">Gold</SelectItem>
                      <SelectItem value="brown">Brown</SelectItem>
                      <SelectItem value="amber">Amber</SelectItem>
                      <SelectItem value="copper">Copper</SelectItem>
                      <SelectItem value="salmon">Salmon</SelectItem>
                      <SelectItem value="pink">Pink</SelectItem>
                      <SelectItem value="ruby_red">Ruby red</SelectItem>
                      <SelectItem value="purple">Purple</SelectItem>
                      <SelectItem value="garnet_red">Garnet red</SelectItem>
                      <SelectItem value="golden_brown">Golden brown/brick</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="appearance_intensity">Color Intensity</Label>
                  <Select value={formData.appearance_intensity} onValueChange={(value) => setFormData({ ...formData, appearance_intensity: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select intensity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pale">Pale</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="deep">Deep</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="appearance_clarity">Clarity</Label>
                  <Select value={formData.appearance_clarity} onValueChange={(value) => setFormData({ ...formData, appearance_clarity: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select clarity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="crystal_clear">Crystal clear</SelectItem>
                      <SelectItem value="transparent">Transparent</SelectItem>
                      <SelectItem value="slightly_transparent">Slightly transparent</SelectItem>
                      <SelectItem value="opaque">Completely opaque</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="appearance_viscosity">Viscosity</Label>
                  <Select value={formData.appearance_viscosity} onValueChange={(value) => setFormData({ ...formData, appearance_viscosity: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select viscosity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="thin_light">Thin/Light</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="thick_heavy">Thick/Heavy</SelectItem>
                      <SelectItem value="syrupy">Syrupy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="appearance_comments">Appearance Comments</Label>
                <Textarea
                  id="appearance_comments"
                  value={formData.appearance_comments}
                  onChange={(e) => setFormData({ ...formData, appearance_comments: e.target.value })}
                  placeholder="Additional notes about appearance..."
                />
              </div>
            </TabsContent>

            <TabsContent value="aroma" className="space-y-4">
              <h3 className="text-lg font-semibold">Aroma</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="aroma_condition">Condition</Label>
                  <Select value={formData.aroma_condition} onValueChange={(value) => setFormData({ ...formData, aroma_condition: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select condition" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="clean">Clean</SelectItem>
                      <SelectItem value="faulty">Faulty (cork, oxidation, etc.)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="aroma_intensity">Aroma Intensity</Label>
                  <Select value={formData.aroma_intensity} onValueChange={(value) => setFormData({ ...formData, aroma_intensity: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select intensity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="aroma_primary">Primary Aromas</Label>
                <Textarea
                  id="aroma_primary"
                  value={formData.aroma_primary}
                  onChange={(e) => setFormData({ ...formData, aroma_primary: e.target.value })}
                  placeholder="Fruit (citrus, tree, tropical, red, black, dried), Floral (rose, lavender, elderflower), Green/Herbal (green pepper, grass, black tea, tomato leaf), Spice (pepper, eucalyptus), Noble rot (beeswax, ginger, caramel), Earth (petroleum, gravel, clay, volcanic stone, humus, slate)..."
                />
              </div>

              <div>
                <Label htmlFor="aroma_secondary">Secondary Aromas</Label>
                <Textarea
                  id="aroma_secondary"
                  value={formData.aroma_secondary}
                  onChange={(e) => setFormData({ ...formData, aroma_secondary: e.target.value })}
                  placeholder="Fermentation (bread, mushroom, truffle, beer, hazelnut, chocolate, butter)..."
                />
              </div>

              <div>
                <Label htmlFor="aroma_tertiary">Tertiary Aromas</Label>
                <Textarea
                  id="aroma_tertiary"
                  value={formData.aroma_tertiary}
                  onChange={(e) => setFormData({ ...formData, aroma_tertiary: e.target.value })}
                  placeholder="General aging (leather, cocoa, coffee, tobacco, nuts), Oak aging (vanilla, smoke, coconut, cigar box, cellar, baking spices, dill, wood, toffee/caramel)..."
                />
              </div>

              <div>
                <Label htmlFor="aroma_comments">Aroma Comments</Label>
                <Textarea
                  id="aroma_comments"
                  value={formData.aroma_comments}
                  onChange={(e) => setFormData({ ...formData, aroma_comments: e.target.value })}
                  placeholder="Specify the aromas in detail..."
                />
              </div>
            </TabsContent>

            <TabsContent value="palate" className="space-y-4">
              <h3 className="text-lg font-semibold">Palate</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="palate_sweetness">Sweetness</Label>
                  <Select value={formData.palate_sweetness} onValueChange={(value) => setFormData({ ...formData, palate_sweetness: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select sweetness" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dry">Dry</SelectItem>
                      <SelectItem value="off_dry">Off-dry</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="sweet">Sweet</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="palate_acidity">Acidity</Label>
                  <Select value={formData.palate_acidity} onValueChange={(value) => setFormData({ ...formData, palate_acidity: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select acidity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium_minus">Medium (-)</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="medium_plus">Medium (+)</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="palate_tannin">Tannin</Label>
                  <Select value={formData.palate_tannin} onValueChange={(value) => setFormData({ ...formData, palate_tannin: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select tannin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium_minus">Medium (-)</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="medium_plus">Medium (+)</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="palate_body">Body</Label>
                  <Select value={formData.palate_body} onValueChange={(value) => setFormData({ ...formData, palate_body: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select body" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium_minus">Medium (-)</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="medium_plus">Medium (+)</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="palate_flavor_primary">Primary Flavors</Label>
                <Textarea
                  id="palate_flavor_primary"
                  value={formData.palate_flavor_primary}
                  onChange={(e) => setFormData({ ...formData, palate_flavor_primary: e.target.value })}
                  placeholder="Fruit (citrus, tree, tropical, red, black, dried), Floral (rose, lavender, elderflower), Green/Herbal (green pepper, grass, black tea, tomato leaf), Spice (pepper, eucalyptus), Noble rot (beeswax, ginger, caramel), Earth (petroleum, gravel, clay, volcanic stone, humus, slate)..."
                />
              </div>

              <div>
                <Label htmlFor="palate_flavor_secondary">Secondary Flavors</Label>
                <Textarea
                  id="palate_flavor_secondary"
                  value={formData.palate_flavor_secondary}
                  onChange={(e) => setFormData({ ...formData, palate_flavor_secondary: e.target.value })}
                  placeholder="Fermentation (bread, mushroom, truffle, beer, hazelnut, chocolate, butter)..."
                />
              </div>

              <div>
                <Label htmlFor="palate_flavor_tertiary">Tertiary Flavors</Label>
                <Textarea
                  id="palate_flavor_tertiary"
                  value={formData.palate_flavor_tertiary}
                  onChange={(e) => setFormData({ ...formData, palate_flavor_tertiary: e.target.value })}
                  placeholder="General aging (leather, cocoa, coffee, tobacco, nuts), Oak aging (vanilla, smoke, coconut, cigar box, cellar, baking spices, dill, wood, toffee/caramel)..."
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="palate_complexity">Complexity</Label>
                  <Select value={formData.palate_complexity} onValueChange={(value) => setFormData({ ...formData, palate_complexity: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select complexity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium_minus">Medium (-)</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="medium_plus">Medium (+)</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="palate_finish">Finish</Label>
                  <Select value={formData.palate_finish} onValueChange={(value) => setFormData({ ...formData, palate_finish: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select finish" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="very_short">Very short</SelectItem>
                      <SelectItem value="short">Short</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="long">Long</SelectItem>
                      <SelectItem value="very_long">Very long</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="palate_balance">Balance</Label>
                  <Select value={formData.palate_balance} onValueChange={(value) => setFormData({ ...formData, palate_balance: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select balance" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="completely_unbalanced">Completely unbalanced</SelectItem>
                      <SelectItem value="poor">Poor</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="good">Good</SelectItem>
                      <SelectItem value="perfectly_balanced">Perfectly balanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="palate_comments">Palate Comments</Label>
                <Textarea
                  id="palate_comments"
                  value={formData.palate_comments}
                  onChange={(e) => setFormData({ ...formData, palate_comments: e.target.value })}
                  placeholder="Specify the flavors in detail..."
                />
              </div>
            </TabsContent>
          </Tabs>

          {/* Serving Temperature */}
          <div className="grid grid-cols-2 gap-4">
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Adding...' : 'Add Rating'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
