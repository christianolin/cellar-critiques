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
import ProducerSelect from '@/components/ProducerSelect';
import { SearchableSelect } from '@/components/ui/searchable-select';

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
  quantity: number;
  purchase_date: string;
  purchase_price: number | null;
  storage_location: string;
  notes: string;
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
    name: cellarEntry.wine_database?.name || '',
    producer: cellarEntry.wine_database?.producer?.name || '',
    vintage: cellarEntry.vintage?.vintage || null,
    wine_type: cellarEntry.wine_database?.wine_type || '',
    bottle_size: '750ml',
    country_id: cellarEntry.wine_database?.country_id || '',
    region_id: cellarEntry.wine_database?.region_id || '',
    appellation_id: cellarEntry.wine_database?.appellation_id || '',
    grape_varieties: [],
    alcohol_content: cellarEntry.vintage?.alcohol_content || null,
    image_url: cellarEntry.vintage?.image_url || null,
    quantity: cellarEntry.quantity,
    purchase_date: cellarEntry.purchase_date || '',
    purchase_price: cellarEntry.purchase_price,
    notes: cellarEntry.notes || '',
    storage_location: cellarEntry.storage_location || '',
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

      // Load existing grape varieties for this wine vintage
      if (cellarEntry.wine_vintage_id) {
        const { data: existingGrapes } = await supabase
          .from('wine_vintage_grapes')
          .select(`
            grape_variety_id,
            percentage,
            grape_varieties (id, name, type)
          `)
          .eq('wine_vintage_id', cellarEntry.wine_vintage_id);

        if (existingGrapes) {
          const grapeVarietiesWithPercentage = existingGrapes.map(g => ({
            id: g.grape_variety_id,
            name: g.grape_varieties.name,
            type: g.grape_varieties.type,
            percentage: g.percentage || 0
          }));
          setFormData(prev => ({ ...prev, grape_varieties: grapeVarietiesWithPercentage }));
        }
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
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
      // Update wine_database entry
      let producerId: string | undefined;
      if (formData.producer) {
        const { data: prod } = await supabase.from('producers').select('id').ilike('name', formData.producer).limit(1).maybeSingle();
        if (prod?.id) producerId = prod.id;
        else {
          const { data: newProd } = await supabase.from('producers').insert({ name: formData.producer }).select('id').single();
          producerId = newProd?.id;
        }
      }
      
      const wineData = {
        name: formData.name,
        wine_type: formData.wine_type as "red" | "white" | "rose" | "sparkling" | "dessert" | "fortified",
        producer_id: producerId,
        country_id: formData.country_id || null,
        region_id: formData.region_id || null,
        appellation_id: formData.appellation_id || null,
      };

      const { error: wineError } = await supabase
        .from('wine_database')
        .update(wineData)
        .eq('id', cellarEntry.wine_database_id);

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

      // Update or create wine vintage and grape varieties
      let vintageId = cellarEntry.wine_vintage_id;
      
      if (formData.vintage || formData.alcohol_content || formData.image_url || formData.grape_varieties.length > 0) {
        if (vintageId) {
          // Update existing vintage
          const { error: vintageError } = await supabase
            .from('wine_vintages')
            .update({
              vintage: formData.vintage,
              alcohol_content: formData.alcohol_content,
              image_url: formData.image_url,
            })
            .eq('id', vintageId);

          if (vintageError) throw vintageError;
        } else {
          // Create new vintage
          const { data: newVintage, error: vintageError } = await supabase
            .from('wine_vintages')
            .insert({
              wine_database_id: cellarEntry.wine_database_id,
              vintage: formData.vintage,
              alcohol_content: formData.alcohol_content,
              image_url: formData.image_url,
            })
            .select('id')
            .single();

          if (vintageError) throw vintageError;
          vintageId = newVintage.id;

          // Update cellar entry with new vintage ID
          await supabase
            .from('wine_cellar')
            .update({ wine_vintage_id: vintageId })
            .eq('id', cellarEntry.id);
        }

        // Update grape varieties if they exist
        if (formData.grape_varieties.length > 0 && vintageId) {
          // Remove existing grape varieties
          await supabase
            .from('wine_vintage_grapes')
            .delete()
            .eq('wine_vintage_id', vintageId);

          // Add new grape varieties
          const grapeData = formData.grape_varieties.map(grape => ({
            wine_vintage_id: vintageId,
            grape_variety_id: grape.id,
            percentage: grape.percentage,
          }));

          const { error: grapeError } = await supabase
            .from('wine_vintage_grapes')
            .insert(grapeData);

          if (grapeError) throw grapeError;
        }
      }

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
        <Button variant="outline" size="sm">
          <Edit className="h-4 w-4 mr-2" /> Edit
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
            <div>
              <Label>Master Data Fields (Read-only)</Label>
              <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="font-medium">Name:</span> {formData.name}</div>
                  <div><span className="font-medium">Producer:</span> {formData.producer}</div>
                  <div><span className="font-medium">Type:</span> {formData.wine_type}</div>
                  <div><span className="font-medium">Country:</span> {countries.find(c => c.id === formData.country_id)?.name || 'N/A'}</div>
                  <div><span className="font-medium">Region:</span> {regions.find(r => r.id === formData.region_id)?.name || 'N/A'}</div>
                  <div><span className="font-medium">Appellation:</span> {appellations.find(a => a.id === formData.appellation_id)?.name || 'N/A'}</div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Master wine data cannot be edited from cellar. Use Admin panel to edit wine database entries.
                </p>
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

            {/* Grape Composition */}
            <div className="mt-4">
              <Label>Grape Composition</Label>
              <div className="space-y-3">
                {formData.grape_varieties.length > 0 && (
                  <div className="space-y-2">
                    {formData.grape_varieties.map((grape) => (
                      <div key={grape.id} className="flex items-center gap-2 p-2 border rounded">
                        <span className="flex-1">{grape.name}</span>
                        <span className="text-sm text-muted-foreground capitalize">({grape.type})</span>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={grape.percentage}
                          onChange={(e) => updateGrapePercentage(grape.id, parseInt(e.target.value) || 0)}
                          className="w-16"
                          placeholder="%"
                        />
                        <span className="text-sm">%</span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeGrapeVariety(grape.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <div className="text-sm text-muted-foreground">
                      Total: {formData.grape_varieties.reduce((sum, g) => sum + g.percentage, 0)}%
                    </div>
                  </div>
                )}
                
                <div>
                  <SearchableSelect
                    options={grapeVarieties
                      .filter(g => !formData.grape_varieties.find(fg => fg.id === g.id))
                      .map(g => ({ value: g.id, label: `${g.name} (${g.type})` }))}
                    value=""
                    onValueChange={addGrapeVariety}
                    placeholder="Add grape variety"
                    searchPlaceholder="Search grape varieties..."
                  />
                </div>
              </div>
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