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
import { Plus, Upload, X } from 'lucide-react';

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

interface WineFormData {
  name: string;
  producer: string;
  vintage: number | null;
  wine_type: string;
  country_id: string;
  region_id: string;
  appellation_id: string;
  grape_variety_ids: string[];
  alcohol_content: number | null;
  // Cellar specific fields
  quantity?: number;
  purchase_date?: string;
  purchase_price?: number;
  storage_location?: string;
  notes?: string;
  cellar_tracker_id?: string;
  image_url?: string;
}

export default function AddWineDialog({ addToCellar = false, onWineAdded }: AddWineDialogProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [countries, setCountries] = useState<Country[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [appellations, setAppellations] = useState<Appellation[]>([]);
  const [grapeVarieties, setGrapeVarieties] = useState<GrapeVariety[]>([]);
  const [filteredRegions, setFilteredRegions] = useState<Region[]>([]);
  const [filteredAppellations, setFilteredAppellations] = useState<Appellation[]>([]);

  const [formData, setFormData] = useState<WineFormData>({
    name: '',
    producer: '',
    vintage: null,
    wine_type: '',
    country_id: '',
    region_id: '',
    appellation_id: '',
    grape_variety_ids: [],
    alcohol_content: null,
    ...(addToCellar ? {
      quantity: 1,
      purchase_date: '',
      purchase_price: null,
      storage_location: '',
      notes: '',
      cellar_tracker_id: '',
      image_url: ''
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
      setAppellations(appellationsRes.data || []);
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
      setFormData(prev => ({ ...prev, region_id: '', appellation_id: '' }));
    } else {
      setFilteredRegions([]);
    }
  }, [formData.country_id, regions]);

  // Filter appellations when region changes
  useEffect(() => {
    if (formData.region_id) {
      const filtered = appellations.filter(appellation => appellation.region_id === formData.region_id);
      setFilteredAppellations(filtered);
      setFormData(prev => ({ ...prev, appellation_id: '' }));
    } else {
      setFilteredAppellations([]);
    }
  }, [formData.region_id, appellations]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      // First create the wine entry
      const wineData = {
        name: formData.name,
        producer: formData.producer,
        vintage: formData.vintage,
        wine_type: formData.wine_type as "red" | "white" | "rose" | "sparkling" | "dessert" | "fortified",
        country_id: formData.country_id || null,
        region_id: formData.region_id || null,
        appellation_id: formData.appellation_id || null,
        grape_variety_ids: formData.grape_variety_ids,
        alcohol_content: formData.alcohol_content,
        cellar_tracker_id: formData.cellar_tracker_id
      };

      const { data: wine, error: wineError } = await supabase
        .from('wines')
        .insert(wineData)
        .select()
        .single();

      if (wineError) throw wineError;

      // If adding to cellar, create cellar entry
      if (addToCellar) {
        const cellarData = {
          user_id: user.id,
          wine_id: wine.id,
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
        description: addToCellar ? "Wine added to your cellar!" : "Wine created successfully!",
      });

      // Reset form
      setFormData({
        name: '',
        producer: '',
        vintage: null,
        wine_type: '',
        country_id: '',
        region_id: '',
        appellation_id: '',
        grape_variety_ids: [],
        alcohol_content: null,
        ...(addToCellar ? {
          quantity: 1,
          purchase_date: '',
          purchase_price: null,
          storage_location: '',
          notes: '',
          cellar_tracker_id: '',
          image_url: ''
        } : {})
      });
      setImageFile(null);
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="country">Country *</Label>
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
            <Label htmlFor="grape_varieties">Grape Varieties</Label>
            <Select 
              value="" 
              onValueChange={(value) => {
                if (!formData.grape_variety_ids.includes(value)) {
                  setFormData({ 
                    ...formData, 
                    grape_variety_ids: [...formData.grape_variety_ids, value] 
                  });
                }
              }}
            >
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
            {formData.grape_variety_ids.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.grape_variety_ids.map((grapeId) => {
                  const grape = grapeVarieties.find(g => g.id === grapeId);
                  return grape ? (
                    <span
                      key={grapeId}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-sm"
                    >
                      {grape.name}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => setFormData({
                          ...formData,
                          grape_variety_ids: formData.grape_variety_ids.filter(id => id !== grapeId)
                        })}
                      />
                    </span>
                  ) : null;
                })}
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
                value={formData.cellar_tracker_id || ''}
                onChange={(e) => setFormData({ ...formData, cellar_tracker_id: e.target.value })}
                placeholder="e.g. 12345"
              />
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
                    <Label htmlFor="purchase_price">Purchase Price</Label>
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
                    placeholder="Any additional notes..."
                  />
                </div>
              </div>
            </>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Adding...' : (addToCellar ? 'Add to Cellar' : 'Add Wine')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}