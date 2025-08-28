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
import { Plus, X, Search } from 'lucide-react';
import WineSearchDialog from '@/components/WineSearchDialog';
import { SearchableSelect } from '@/components/ui/searchable-select';
import ProducerSelect from '@/components/ProducerSelect';

interface AddWineDialogProps {
  addToCellar?: boolean;
  onWineAdded?: () => void;
}

interface Country {
  id: string;
  name: string;
  code: string;
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

interface GrapeWithPercentage {
  id: string;
  name: string;
  type: string;
  percentage: number;
}

interface WineFormData {
  name: string;
  producer: string;
  vintage: number | null;
  wine_type: string;
  bottle_size: string;
  country_id: string;
  region_id: string;
  appellation_id: string;
  grape_varieties: GrapeWithPercentage[];
  alcohol_content: number | null; // moved to wine_vintages on save
  image_url: string | null;
  // Cellar specific fields
  quantity?: number;
  purchase_date?: string;
  purchase_price?: number;
  storage_location?: string;
  notes?: string;
  wine_database_id?: string; // selected canonical wine
}

export default function AddWineDialog({ addToCellar = false, onWineAdded }: AddWineDialogProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [countries, setCountries] = useState<Country[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [appellations, setAppellation] = useState<Appellation[]>([]);
  const [grapeVarieties, setGrapeVarieties] = useState<GrapeVariety[]>([]);
  const [filteredRegions, setFilteredRegions] = useState<Region[]>([]);
  const [filteredAppellations, setFilteredAppellations] = useState<Appellation[]>([]);

  const [formData, setFormData] = useState<WineFormData>({
    name: '',
    producer: '',
    vintage: null,
    wine_type: '',
    bottle_size: '750ml',
    country_id: '',
    region_id: '',
    appellation_id: '',
    grape_varieties: [],
    alcohol_content: null,
    image_url: null,
    ...(addToCellar ? {
      quantity: 1,
      purchase_date: '',
      purchase_price: null,
      storage_location: '',
      notes: ''
    } : {})
  });

  // Load master data
  useEffect(() => {
    loadMasterData();
  }, []);

  const loadMasterData = async () => {
    try {
      const [countriesRes, regionsRes, appellationsRes, grapeVarietiesRes] = await Promise.all([
        supabase.from('countries').select('*').order('name'),
        supabase.from('regions').select('*').order('name'),
        supabase.from('appellations').select('*').order('name'),
        supabase.from('grape_varieties').select('*').order('name')
      ]);

      if (countriesRes.error) throw countriesRes.error;
      if (regionsRes.error) throw regionsRes.error;
      if (appellationsRes.error) throw appellationsRes.error;
      if (grapeVarietiesRes.error) throw grapeVarietiesRes.error;

      setCountries(countriesRes.data || []);
      setRegions(regionsRes.data || []);
      setAppellation(appellationsRes.data || []);
      setGrapeVarieties(grapeVarietiesRes.data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load wine data",
        variant: "destructive",
      });
    }
  };

  // Filter regions when country changes
  useEffect(() => {
    if (formData.country_id) {
      const filtered = regions.filter(region => region.country_id === formData.country_id);
      setFilteredRegions(filtered);
      setFormData(prev => {
        const regionValid = prev.region_id && filtered.some(r => r.id === prev.region_id);
        return { 
          ...prev, 
          region_id: regionValid ? prev.region_id : '', 
          appellation_id: regionValid ? prev.appellation_id : '' 
        };
      });
    } else {
      setFilteredRegions([]);
    }
  }, [formData.country_id, regions]);

  // Filter appellations when region changes
  useEffect(() => {
    if (formData.region_id) {
      const filtered = appellations.filter(appellation => appellation.region_id === formData.region_id);
      setFilteredAppellations(filtered);
      setFormData(prev => {
        const appellationValid = prev.appellation_id && filtered.some(a => a.id === prev.appellation_id);
        return { ...prev, appellation_id: appellationValid ? prev.appellation_id : '' };
      });
    } else {
      setFilteredAppellations([]);
    }
  }, [formData.region_id, appellations]);

  const addGrapeVariety = (grapeId: string) => {
    const grape = grapeVarieties.find(g => g.id === grapeId);
    if (grape && !formData.grape_varieties.find(g => g.id === grapeId)) {
      const newGrapes = [...formData.grape_varieties, { ...grape, percentage: 0 }];
      const evenPercentage = Math.floor(100 / newGrapes.length);
      const updatedGrapes = newGrapes.map(g => ({ ...g, percentage: evenPercentage }));
      setFormData({ ...formData, grape_varieties: updatedGrapes });
    }
  };

  const removeGrapeVariety = (grapeId: string) => {
    const remainingGrapes = formData.grape_varieties.filter(g => g.id !== grapeId);
    if (remainingGrapes.length > 0) {
      const evenPercentage = Math.floor(100 / remainingGrapes.length);
      const updatedGrapes = remainingGrapes.map(g => ({ ...g, percentage: evenPercentage }));
      setFormData({ ...formData, grape_varieties: updatedGrapes });
    } else {
      setFormData({ ...formData, grape_varieties: [] });
    }
  };

  const updateGrapePercentage = (grapeId: string, percentage: number) => {
    setFormData({
      ...formData,
      grape_varieties: formData.grape_varieties.map(g => 
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

      setFormData({ ...formData, image_url: publicUrl });
      
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      // 1) Ensure a wine_database row exists (use selected if provided)
      let wineDatabaseId = formData.wine_database_id;
      if (!wineDatabaseId) {
        // resolve producer_id by name (create producer if missing)
        let producerId: string | undefined;
        if (formData.producer) {
          const { data: prod } = await supabase.from('producers').select('id').ilike('name', formData.producer).limit(1).maybeSingle();
          if (prod?.id) producerId = prod.id;
          else {
            const { data: newProd } = await supabase.from('producers').insert({ name: formData.producer }).select('id').single();
            producerId = newProd?.id;
          }
        }
        const { data: wineDb, error: wineDbErr } = await supabase
          .from('wine_database')
          .insert({
            name: formData.name,
            wine_type: formData.wine_type,
            producer_id: producerId!,
            country_id: formData.country_id || null,
            region_id: formData.region_id || null,
            appellation_id: formData.appellation_id || null,
          })
          .select('id')
          .single();
        if (wineDbErr) throw wineDbErr;
        wineDatabaseId = wineDb?.id;
      }

      // TODO: Create wine_vintage entry when types are updated
      // This will store vintage-specific metadata like alcohol_content and grape composition
      let wineVintageId: string | undefined;

      // If adding to cellar, create cellar entry
      if (addToCellar) {
        const cellarData = {
          user_id: user.id,
          wine_id: wineDatabaseId,
          quantity: formData.quantity,
          purchase_date: formData.purchase_date || null,
          purchase_price: formData.purchase_price,
          storage_location: formData.storage_location,
          notes: formData.notes,
        };

        const { error: cellarError } = await supabase
          .from('wine_cellar')
          .insert(cellarData);

        if (cellarError) throw cellarError;
      }

      toast({
        title: "Success",
        description: addToCellar ? "Wine added to your cellar!" : "Wine saved to database!",
      });

      // Reset form
      setFormData({
        name: '',
        producer: '',
        vintage: null,
        wine_type: '',
        bottle_size: '750ml',
        country_id: '',
        region_id: '',
        appellation_id: '',
        grape_varieties: [],
        alcohol_content: null,
        image_url: null,
        wine_database_id: undefined,
        ...(addToCellar ? {
          quantity: 1,
          purchase_date: '',
          purchase_price: null,
          storage_location: '',
          notes: ''
        } : {})
      });
      setOpen(false);
      onWineAdded?.();
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add wine",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          {addToCellar ? 'Add Wine to Cellar' : 'Add Wine'}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Wine</DialogTitle>
          <DialogDescription>
            Add wine information. Fields marked with * are required.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-medium">Wine Information</h4>
              <WineSearchDialog 
                onWineSelect={(wine) => {
                setFormData({
                  ...formData,
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
            <div>
              <Label htmlFor="name">Wine Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="producer">Producer *</Label>
              <ProducerSelect
                value={formData.producer}
                onChange={(name) => setFormData({ ...formData, producer: name })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="wine_type">Wine Type *</Label>
              <Select value={formData.wine_type} onValueChange={(value) => setFormData({ ...formData, wine_type: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select wine type" />
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
              <Select value={formData.bottle_size} onValueChange={(value) => setFormData({ ...formData, bottle_size: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select bottle size" />
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
                value={formData.vintage || ''}
                onChange={(e) => setFormData({ ...formData, vintage: e.target.value ? parseInt(e.target.value) : null })}
              />
            </div>
            <div>
              <Label htmlFor="alcohol_content">Alcohol Content (%)</Label>
              <Input
                id="alcohol_content"
                type="number"
                step="0.1"
                min="0"
                max="50"
                value={formData.alcohol_content || ''}
                onChange={(e) => setFormData({ ...formData, alcohol_content: e.target.value ? parseFloat(e.target.value) : null })}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="country">Country *</Label>
              <SearchableSelect
                options={countries.map(country => ({value: country.id, label: country.name}))}
                value={formData.country_id}
                onValueChange={(value) => setFormData({ ...formData, country_id: value })}
                placeholder="Select country"
                searchPlaceholder="Search countries..."
              />
            </div>
            <div>
              <Label htmlFor="region">Region</Label>
              <SearchableSelect
                options={(formData.country_id ? filteredRegions : regions).map(region => ({ value: region.id, label: region.name }))}
                value={formData.region_id}
                onValueChange={(value) => {
                  const selectedRegion = regions.find(r => r.id === value);
                  setFormData({
                    ...formData,
                    region_id: value,
                    country_id: selectedRegion?.country_id || formData.country_id,
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
                options={(formData.region_id ? filteredAppellations : appellations).map(appellation => ({ value: appellation.id, label: appellation.name }))}
                value={formData.appellation_id}
                onValueChange={(value) => {
                  const selectedApp = appellations.find(a => a.id === value);
                  const selectedRegion = selectedApp ? regions.find(r => r.id === selectedApp.region_id) : undefined;
                  setFormData({
                    ...formData,
                    appellation_id: value,
                    region_id: selectedRegion?.id || formData.region_id,
                    country_id: selectedRegion?.country_id || formData.country_id,
                  });
                }}
                placeholder="Select appellation"
                searchPlaceholder="Search appellations..."
                allowNone={true}
              />
            </div>
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
              {formData.image_url && (
                <div className="flex items-center gap-2">
                  <img src={formData.image_url} alt="Wine preview" className="w-16 h-16 object-cover rounded" />
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={() => setFormData({ ...formData, image_url: null })}
                  >
                    Remove
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Cellar Information */}
          {addToCellar && (
            <>
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">Cellar Information</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      value={formData.quantity || ''}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value ? parseInt(e.target.value) : 1 })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="purchase_price">Purchase Price (DKK)</Label>
                    <Input
                      id="purchase_price"
                      type="number"
                      step="0.01"
                      value={formData.purchase_price || ''}
                      onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value ? parseFloat(e.target.value) : null })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <Label htmlFor="purchase_date">Purchase Date</Label>
                    <Input
                      id="purchase_date"
                      type="date"
                      value={formData.purchase_date || ''}
                      onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="storage_location">Storage Location</Label>
                    <Input
                      id="storage_location"
                      value={formData.storage_location || ''}
                      onChange={(e) => setFormData({ ...formData, storage_location: e.target.value })}
                      placeholder="e.g. Rack A, Bin 5"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes || ''}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Additional cellar notes..."
                  />
                </div>
              </div>
            </>
          )}

          <DialogFooter>
            <Button type="submit" disabled={loading || !formData.name || !formData.producer || !formData.wine_type || !formData.country_id}>
              {loading ? (addToCellar ? 'Adding to Cellar...' : 'Creating Wine...') : (addToCellar ? 'Add to Cellar' : 'Create Wine')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}