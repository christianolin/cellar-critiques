import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
  producer_id: string; // selected producer id
  vintage: number | null;
  wine_type: string;
  bottle_size: string;
  country_id: string;
  region_id: string;
  appellation_id: string;
  grape_varieties: GrapeWithPercentage[];
  alcohol_content: number | null;
  image_url: string | null;
  // Cellar specific fields
  quantity?: number;
  purchase_date?: string;
  purchase_price?: number | null;
  storage_location?: string;
  notes?: string;
  wine_database_id?: string;
}

export default function AddWineDialog({ addToCellar = false, onWineAdded }: AddWineDialogProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [mode, setMode] = useState<'new' | 'existing'>('new');

  const [countries, setCountries] = useState<Country[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [appellations, setAppellation] = useState<Appellation[]>([]);
  const [grapeVarieties, setGrapeVarieties] = useState<GrapeVariety[]>([]);
  const [filteredRegions, setFilteredRegions] = useState<Region[]>([]);
  const [filteredAppellations, setFilteredAppellations] = useState<Appellation[]>([]);

  const [formData, setFormData] = useState<WineFormData>({
    name: '',
    producer_id: '',
    vintage: null,
    wine_type: '',
    bottle_size: '750ml',
    country_id: '',
    region_id: '',
    appellation_id: '',
    grape_varieties: [],
    alcohol_content: null,
    image_url: null,
    ...(addToCellar
      ? {
          quantity: 1,
          purchase_date: '',
          purchase_price: null,
          storage_location: '',
          notes: '',
        }
      : {}),
  });

  // Load master data
  useEffect(() => {
    void loadMasterData();
  }, []);

  const loadMasterData = async () => {
    try {
      const [countriesRes, regionsRes, appellationsRes, grapeVarietiesRes] = await Promise.all([
        supabase.from('countries').select('*').order('name'),
        supabase.from('regions').select('*').order('name'),
        supabase.from('appellations').select('*').order('name'),
        supabase.from('grape_varieties').select('*').order('name'),
      ]);

      if (countriesRes.error) throw countriesRes.error;
      if (regionsRes.error) throw regionsRes.error;
      if (appellationsRes.error) throw appellationsRes.error;
      if (grapeVarietiesRes.error) throw grapeVarietiesRes.error;

      setCountries(countriesRes.data || []);
      setRegions(regionsRes.data || []);
      setAppellation(appellationsRes.data || []);
      setGrapeVarieties(grapeVarietiesRes.data || []);
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to load wine data',
        variant: 'destructive',
      });
    }
  };

  // Filter regions when country changes
  useEffect(() => {
    if (formData.country_id) {
      const filtered = regions.filter((region) => region.country_id === formData.country_id);
      setFilteredRegions(filtered);
      setFormData((prev) => {
        const regionValid = prev.region_id && filtered.some((r) => r.id === prev.region_id);
        return {
          ...prev,
          region_id: regionValid ? prev.region_id : '',
          appellation_id: regionValid ? prev.appellation_id : '',
        };
      });
    } else {
      setFilteredRegions([]);
    }
  }, [formData.country_id, regions]);

  // Filter appellations when region changes
  useEffect(() => {
    if (formData.region_id) {
      const filtered = appellations.filter((appellation) => appellation.region_id === formData.region_id);
      setFilteredAppellations(filtered);
      setFormData((prev) => {
        const appellationValid =
          prev.appellation_id && filtered.some((a) => a.id === prev.appellation_id);
        return { ...prev, appellation_id: appellationValid ? prev.appellation_id : '' };
      });
    } else {
      setFilteredAppellations([]);
    }
  }, [formData.region_id, appellations]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please select an image file',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please select an image smaller than 5MB',
        variant: 'destructive',
      });
      return;
    }

    setUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `wine-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage.from('wine-images').upload(fileName, file);
      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from('wine-images').getPublicUrl(fileName);

      setFormData({ ...formData, image_url: publicUrl });

      toast({
        title: 'Success',
        description: 'Image uploaded successfully',
      });
    } catch {
      toast({
        title: 'Upload failed',
        description: 'Failed to upload image',
        variant: 'destructive',
      });
    } finally {
      setUploadingImage(false);
    }
  };

const validateForm = () =>
    Boolean(
      formData.name &&
      (mode === 'existing' || formData.producer_id) &&
      formData.wine_type &&
      formData.country_id
    );

  const addGrapeVariety = (grapeId: string) => {
    const grape = grapeVarieties.find((g) => g.id === grapeId);
    if (grape && !formData.grape_varieties.find((g) => g.id === grapeId)) {
      const newGrapes = [...formData.grape_varieties, { ...grape, percentage: 0 }];
      const evenPercentage = Math.floor(100 / newGrapes.length);
      const updatedGrapes = newGrapes.map((g) => ({ ...g, percentage: evenPercentage }));
      setFormData({ ...formData, grape_varieties: updatedGrapes });
    }
  };

  const removeGrapeVariety = (grapeId: string) => {
    const remainingGrapes = formData.grape_varieties.filter((g) => g.id !== grapeId);
    if (remainingGrapes.length > 0) {
      const evenPercentage = Math.floor(100 / remainingGrapes.length);
      const updatedGrapes = remainingGrapes.map((g) => ({ ...g, percentage: evenPercentage }));
      setFormData({ ...formData, grape_varieties: updatedGrapes });
    } else {
      setFormData({ ...formData, grape_varieties: [] });
    }
  };

  const updateGrapePercentage = (grapeId: string, percentage: number) => {
    setFormData({
      ...formData,
      grape_varieties: formData.grape_varieties.map((g) =>
        g.id === grapeId ? { ...g, percentage } : g
      ),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: 'Authentication Error',
        description: 'You must be logged in to add wines',
        variant: 'destructive',
      });
      return;
    }

    if (!validateForm()) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      // 1) Use existing wine_database ID if provided, otherwise create new entry
      let wineDatabaseId = formData.wine_database_id;

      if (!wineDatabaseId) {
        if (!formData.producer_id) {
          throw new Error('Please select a producer');
        }

        const { data: wineDb, error: wineDbErr } = await supabase
          .from('wine_database')
          .insert({
            name: formData.name,
            wine_type: formData.wine_type,
            producer_id: formData.producer_id,
            country_id: formData.country_id || null,
            region_id: formData.region_id || null,
            appellation_id: formData.appellation_id || null,
          })
          .select('id')
          .single();

        if (wineDbErr) {
          console.error('Error creating wine_database entry:', wineDbErr);
          throw new Error(`Failed to create wine database entry: ${wineDbErr.message}`);
        }

        wineDatabaseId = wineDb?.id;
      } else {
        // Wine database ID exists, verify it's valid
        const { data: existingWine, error: verifyError } = await supabase
          .from('wine_database')
          .select('id')
          .eq('id', wineDatabaseId)
          .single();

        if (verifyError || !existingWine) {
          throw new Error('Selected wine database entry not found');
        }
      }

      // 2) Create wine_vintage entry for vintage-specific metadata
      let wineVintageId: string | undefined;
      if (formData.vintage || formData.alcohol_content || formData.image_url || formData.grape_varieties.length > 0) {
        const vintageData = {
          wine_database_id: wineDatabaseId,
          vintage: formData.vintage || new Date().getFullYear(),
          alcohol_content: formData.alcohol_content,
          image_url: formData.image_url,
        };

        const { data: vintage, error: vintageErr } = await supabase
          .from('wine_vintages')
          .insert(vintageData)
          .select('id')
          .single();

        if (vintageErr) {
          console.error('Error creating wine_vintage entry:', vintageErr);
          throw new Error(`Failed to create wine vintage entry: ${vintageErr.message}`);
        }

        wineVintageId = vintage?.id;

        // 3) Create wine_vintage_grapes entries for grape composition
        if (formData.grape_varieties.length > 0 && wineVintageId) {
          const grapeEntries = formData.grape_varieties.map(grape => ({
            wine_vintage_id: wineVintageId,
            grape_variety_id: grape.id,
            percentage: grape.percentage || 0,
          }));

          const { error: grapesErr } = await supabase
            .from('wine_vintage_grapes')
            .insert(grapeEntries);

          if (grapesErr) {
            console.error('Error creating wine_vintage_grapes entries:', grapesErr);
            throw new Error(`Failed to create grape composition entries: ${grapesErr.message}`);
          }
        }
      }

      // If adding to cellar, create cellar entry
      if (addToCellar) {
        const cellarData = {
          user_id: user.id,
          wine_database_id: wineDatabaseId,
          wine_vintage_id: wineVintageId || null,
          quantity: formData.quantity,
          purchase_date: formData.purchase_date || null,
          purchase_price: formData.purchase_price,
          storage_location: formData.storage_location,
          notes: formData.notes,
        };

        const { error: cellarError } = await supabase.from('wine_cellar').insert(cellarData);

        if (cellarError) {
          console.error('Error adding to cellar:', cellarError);
          throw new Error(`Failed to add wine to cellar: ${cellarError.message}`);
        }
      }

      toast({
        title: 'Success',
        description: addToCellar ? 'Wine added to your cellar!' : 'Wine saved to database!',
      });

      // Reset form
      setFormData({
        name: '',
        producer_id: '',
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
        ...(addToCellar
          ? {
              quantity: 1,
              purchase_date: '',
              purchase_price: null,
              storage_location: '',
              notes: '',
            }
          : {}),
      });
      setOpen(false);
      onWineAdded?.();
    } catch (error) {
      console.error('Error adding wine:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({
        title: 'Error',
        description: `Failed to add wine: ${errorMessage}`,
        variant: 'destructive',
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
          <DialogDescription>Add wine information. Fields marked with * are required.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4">
            <h4 className="font-medium">Wine Selection</h4>

            {/* Wine selection mode */}
            <div className="flex gap-2 mb-4">
              <Button
                type="button"
                variant={mode === 'new' ? 'default' : 'outline'}
                onClick={() => {
                  setMode('new');
                  setFormData({
                    name: '',
                    producer_id: '',
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
                    ...(addToCellar
                      ? {
                          quantity: 1,
                          purchase_date: '',
                          purchase_price: null,
                          storage_location: '',
                          notes: '',
                        }
                      : {}),
                  });
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add New Wine
              </Button>

              <Button
                type="button"
                variant={mode === 'existing' ? 'default' : 'outline'}
                onClick={() => setMode('existing')}
              >
                <Search className="h-4 w-4 mr-2" />
                Select from Wine Database
              </Button>
            </div>

            {mode === 'existing' ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h5 className="font-medium">Select Existing Wine</h5>

                  <WineSearchDialog
                    onWineSelect={(wine) => {
                      setFormData({
                        ...formData,
                        wine_database_id: wine.id,
                        name: wine.name,
                        producer_id: wine.producer_id,
                        wine_type: wine.wine_type,
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

                {/* Additional vintage fields for existing wine */}
                {formData.wine_database_id && (
                  <div className="space-y-4 border-t pt-4">
                    <h5 className="font-medium">Wine Details</h5>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="vintage">Vintage</Label>
                        <Input
                          id="vintage"
                          type="number"
                          value={formData.vintage || ''}
                          onChange={(e) => setFormData({
                            ...formData,
                            vintage: e.target.value ? parseInt(e.target.value, 10) : null,
                          })}
                        />
                      </div>

                      <div>
                        <Label htmlFor="alcohol_content">Alcohol Content (%)</Label>
                        <Input
                          id="alcohol_content"
                          type="number"
                          step="0.1"
                          value={formData.alcohol_content || ''}
                          onChange={(e) => setFormData({
                            ...formData,
                            alcohol_content: e.target.value ? parseFloat(e.target.value) : null,
                          })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Grape Composition</Label>
                      <SearchableSelect
                        options={grapeVarieties.map((g) => ({ value: g.id, label: g.name }))}
                        value={''}
                        onValueChange={(val) => {
                          if (val) addGrapeVariety(val);
                        }}
                        placeholder="Add grape variety"
                        searchPlaceholder="Search grapes..."
                      />
                      {formData.grape_varieties.length > 0 && (
                        <div className="space-y-2">
                          {formData.grape_varieties.map((g) => (
                            <div key={g.id} className="flex items-center gap-2">
                              <div className="flex-1">{g.name}</div>
                              <Input
                                type="number"
                                min={0}
                                max={100}
                                value={g.percentage}
                                onChange={(e) => updateGrapePercentage(g.id, parseInt(e.target.value || '0', 10))}
                              />
                              <Button type="button" variant="outline" size="icon" onClick={() => removeGrapeVariety(g.id)}>
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <h5 className="font-medium">New Wine Information</h5>

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
                    value={formData.producer_id}
                    onChange={(id) => setFormData({ ...formData, producer_id: id })}
                  />
                </div>

                <div>
                  <Label htmlFor="wine_type">Wine Type *</Label>
                  <Select
                    value={formData.wine_type}
                    onValueChange={(value) => setFormData({ ...formData, wine_type: value })}
                  >
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
                  <Label htmlFor="country">Country *</Label>
                  <SearchableSelect
                    options={countries.map((country) => ({ value: country.id, label: country.name }))}
                    value={formData.country_id}
                    onValueChange={(value) => setFormData({ ...formData, country_id: value })}
                    placeholder="Select country"
                    searchPlaceholder="Search countries..."
                  />
                </div>
                <div>
                  <Label htmlFor="region">Region</Label>
                  <SearchableSelect
                    options={filteredRegions.map((r) => ({ value: r.id, label: r.name }))}
                    value={formData.region_id}
                    onValueChange={(value) => setFormData({ ...formData, region_id: value, appellation_id: '' })}
                    placeholder="Select region"
                    searchPlaceholder="Search regions..."
                    allowNone
                    noneLabel="None"
                  />
                </div>
                <div>
                  <Label htmlFor="appellation">Appellation</Label>
                  <SearchableSelect
                    options={filteredAppellations.map((a) => ({ value: a.id, label: a.name }))}
                    value={formData.appellation_id}
                    onValueChange={(value) => setFormData({ ...formData, appellation_id: value })}
                    placeholder="Select appellation"
                    searchPlaceholder="Search appellations..."
                    allowNone
                    noneLabel="None"
                  />
                </div>
              </div>
            )}

            {/* Cellar Information for add to cellar mode */}
            {addToCellar && (
              <div className="space-y-4 border-t pt-4">
                <h4 className="font-semibold">Cellar Information</h4>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      value={formData.quantity || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        quantity: e.target.value ? parseInt(e.target.value, 10) : 1,
                      })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="purchase_price">Purchase Price</Label>
                    <Input
                      id="purchase_price"
                      type="number"
                      step="0.01"
                      value={formData.purchase_price || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        purchase_price: e.target.value ? parseFloat(e.target.value) : null,
                      })}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="storage_location">Storage Location</Label>
                  <Input
                    id="storage_location"
                    value={formData.storage_location || ''}
                    onChange={(e) => setFormData({ ...formData, storage_location: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes || ''}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="submit" disabled={loading || !validateForm()}>
              {loading ? 'Adding...' : addToCellar ? 'Add to Cellar' : 'Create Wine'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
