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
import { Edit, X } from 'lucide-react';

interface EditWineDialogProps {
  cellarEntry: any;
  onWineUpdated?: () => void;
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
  alcohol_content: number | null;
  image_url: string | null;
  // Cellar specific fields
  quantity: number;
  purchase_date: string;
  purchase_price: number | null;
  storage_location: string;
  notes: string;
  cellar_tracker_id: string;
}

export default function EditWineDialog({ cellarEntry, onWineUpdated }: EditWineDialogProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [countries, setCountries] = useState<Country[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [appellations, setAppellations] = useState<Appellation[]>([]);
  const [grapeVarieties, setGrapeVarieties] = useState<GrapeVariety[]>([]);
  const [filteredRegions, setFilteredRegions] = useState<Region[]>([]);
  const [filteredAppellations, setFilteredAppellations] = useState<Appellation[]>([]);

  const [formData, setFormData] = useState<WineFormData>({
    name: cellarEntry.wines.name,
    producer: cellarEntry.wines.producer,
    vintage: cellarEntry.wines.vintage,
    wine_type: cellarEntry.wines.wine_type,
    bottle_size: cellarEntry.wines.bottle_size || '750ml',
    country_id: cellarEntry.wines.country_id || '',
    region_id: cellarEntry.wines.region_id || '',
    appellation_id: cellarEntry.wines.appellation_id || '',
    grape_varieties: [],
    alcohol_content: cellarEntry.wines.alcohol_content,
    image_url: cellarEntry.wines.image_url || null,
    quantity: cellarEntry.quantity,
    purchase_date: cellarEntry.purchase_date || '',
    purchase_price: cellarEntry.purchase_price,
    storage_location: cellarEntry.storage_location || '',
    notes: cellarEntry.notes || '',
    cellar_tracker_id: cellarEntry.wines.cellar_tracker_id || '',
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
      setAppellations(appellationsRes.data || []);
      setGrapeVarieties(grapeVarietiesRes.data || []);

      // Initialize grape varieties with percentages from existing data
      if (cellarEntry.wines.grape_variety_ids && cellarEntry.wines.grape_variety_ids.length > 0) {
        const selectedGrapes = grapeVarietiesRes.data?.filter(grape => 
          cellarEntry.wines.grape_variety_ids.includes(grape.id)
        ).map(grape => ({
          ...grape,
          percentage: Math.floor(100 / cellarEntry.wines.grape_variety_ids.length)
        })) || [];
        
        setFormData(prev => ({ ...prev, grape_varieties: selectedGrapes }));
      }
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
    } else {
      setFilteredRegions([]);
    }
  }, [formData.country_id, regions]);

  // Filter appellations when region changes
  useEffect(() => {
    if (formData.region_id) {
      const filtered = appellations.filter(appellation => appellation.region_id === formData.region_id);
      setFilteredAppellations(filtered);
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
      // Update wine entry
      const wineData = {
        name: formData.name,
        producer: formData.producer,
        vintage: formData.vintage,
        wine_type: formData.wine_type as "red" | "white" | "rose" | "sparkling" | "dessert" | "fortified",
        bottle_size: formData.bottle_size,
        country_id: formData.country_id || null,
        region_id: formData.region_id || null,
        appellation_id: formData.appellation_id || null,
        grape_variety_ids: formData.grape_varieties.map(g => g.id),
        alcohol_content: formData.alcohol_content,
        cellar_tracker_id: formData.cellar_tracker_id,
        image_url: formData.image_url
      };

      const { error: wineError } = await supabase
        .from('wines')
        .update(wineData)
        .eq('id', cellarEntry.wines.id);

      if (wineError) throw wineError;

      // Update cellar entry
      const cellarData = {
        quantity: formData.quantity,
        purchase_date: formData.purchase_date || null,
        purchase_price: formData.purchase_price,
        storage_location: formData.storage_location,
        notes: formData.notes,
      };

      const { error: cellarError } = await supabase
        .from('wine_cellar')
        .update(cellarData)
        .eq('id', cellarEntry.id);

      if (cellarError) throw cellarError;

      toast({
        title: "Success",
        description: "Wine updated successfully!",
      });

      setOpen(false);
      onWineUpdated?.();
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update wine",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Edit className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Wine</DialogTitle>
          <DialogDescription>
            Update wine and cellar information
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4">
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
              <Input
                id="producer"
                value={formData.producer}
                onChange={(e) => setFormData({ ...formData, producer: e.target.value })}
                required
              />
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="country">Country</Label>
              <Select 
                value={formData.country_id} 
                onValueChange={(value) => setFormData({ ...formData, country_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((country) => (
                    <SelectItem key={country.id} value={country.id}>
                      {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="region">Region</Label>
              <Select 
                value={formData.region_id} 
                onValueChange={(value) => setFormData({ ...formData, region_id: value })}
                disabled={!formData.country_id}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select region" />
                </SelectTrigger>
                <SelectContent>
                  {filteredRegions.map((region) => (
                    <SelectItem key={region.id} value={region.id}>
                      {region.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="appellation">Appellation/Classification</Label>
            <Select 
              value={formData.appellation_id} 
              onValueChange={(value) => setFormData({ ...formData, appellation_id: value })}
              disabled={!formData.region_id}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select appellation" />
              </SelectTrigger>
              <SelectContent>
                {filteredAppellations.map((appellation) => (
                  <SelectItem key={appellation.id} value={appellation.id}>
                    {appellation.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            
            {formData.grape_varieties.length > 0 && (
              <div className="space-y-2 mt-2">
                {formData.grape_varieties.map((grape) => (
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
                  Total: {formData.grape_varieties.reduce((sum, g) => sum + g.percentage, 0)}%
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
                value={formData.alcohol_content || ''}
                onChange={(e) => setFormData({ ...formData, alcohol_content: e.target.value ? parseFloat(e.target.value) : null })}
              />
            </div>
            <div>
              <Label htmlFor="cellar_tracker_id">CellarTracker ID</Label>
              <Input
                id="cellar_tracker_id"
                value={formData.cellar_tracker_id}
                onChange={(e) => setFormData({ ...formData, cellar_tracker_id: e.target.value })}
                placeholder="e.g. 12345"
              />
            </div>
          </div>

          {/* Cellar Information */}
          <div className="border-t pt-4">
            <h4 className="font-semibold mb-3">Cellar Information</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
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
                  value={formData.purchase_date}
                  onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="storage_location">Storage Location</Label>
                <Input
                  id="storage_location"
                  value={formData.storage_location}
                  onChange={(e) => setFormData({ ...formData, storage_location: e.target.value })}
                  placeholder="e.g. Rack A, Bin 5"
                />
              </div>
            </div>

            <div className="mt-4">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional cellar notes..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={loading || !formData.name || !formData.producer || !formData.wine_type}>
              {loading ? 'Updating Wine...' : 'Update Wine'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}