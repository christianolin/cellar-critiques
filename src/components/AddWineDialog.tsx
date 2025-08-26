import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { Plus, Upload, Link as LinkIcon } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface AddWineDialogProps {
  onWineAdded?: () => void;
  addToCellar?: boolean;
}

export default function AddWineDialog({ onWineAdded, addToCellar = false }: AddWineDialogProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  
  const [formData, setFormData] = useState({
    // Basic Information
    name: '',
    producer: '',
    vintage: '',
    country: '',
    region: '',
    subregion: '',
    appellation: '',
    
    // Wine Characteristics (WSET-inspired)
    wine_type: '',
    color: '',
    body: '',
    sweetness: '',
    alcohol_content: '',
    grape_varieties: '',
    
    // Service & Aging
    serving_temp_min: '',
    serving_temp_max: '',
    drink_from: '',
    drink_until: '',
    
    // External Links
    cellar_tracker_id: '',
    
    // If adding to cellar
    quantity: '1',
    purchase_date: '',
    purchase_price: '',
    storage_location: '',
    notes: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    try {
      // Prepare wine data
      const wineData = {
        name: formData.name,
        producer: formData.producer,
        vintage: formData.vintage ? parseInt(formData.vintage) : null,
        country: formData.country,
        region: formData.region || null,
        subregion: formData.subregion || null,
        appellation: formData.appellation || null,
        wine_type: formData.wine_type as any,
        color: (formData.color || null) as any,
        body: (formData.body || null) as any,
        sweetness: (formData.sweetness || null) as any,
        alcohol_content: formData.alcohol_content ? parseFloat(formData.alcohol_content) : null,
        grape_varieties: formData.grape_varieties ? formData.grape_varieties.split(',').map(g => g.trim()) : null,
        serving_temp_min: formData.serving_temp_min ? parseInt(formData.serving_temp_min) : null,
        serving_temp_max: formData.serving_temp_max ? parseInt(formData.serving_temp_max) : null,
        drink_from: formData.drink_from ? parseInt(formData.drink_from) : null,
        drink_until: formData.drink_until ? parseInt(formData.drink_until) : null,
        cellar_tracker_id: formData.cellar_tracker_id || null,
      };

      // Create wine record
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
          quantity: parseInt(formData.quantity),
          purchase_date: formData.purchase_date || null,
          purchase_price: formData.purchase_price ? parseFloat(formData.purchase_price) : null,
          storage_location: formData.storage_location || null,
          notes: formData.notes || null,
        };

        const { error: cellarError } = await supabase
          .from('wine_cellar')
          .insert(cellarData);

        if (cellarError) throw cellarError;
      }

      // Handle image upload if present
      if (imageFile && wine.id) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${wine.id}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('wine-images')
          .upload(fileName, imageFile);

        if (uploadError) {
          console.error('Error uploading image:', uploadError);
          // Don't fail the whole process for image upload issues
        }
      }

      toast({
        title: "Success",
        description: addToCellar ? "Wine added to your cellar!" : "Wine created successfully!",
      });

      // Reset form
      setFormData({
        name: '', producer: '', vintage: '', country: '', region: '', subregion: '', 
        appellation: '', wine_type: '', color: '', body: '', sweetness: '', 
        alcohol_content: '', grape_varieties: '', serving_temp_min: '', 
        serving_temp_max: '', drink_from: '', drink_until: '', cellar_tracker_id: '',
        quantity: '1', purchase_date: '', purchase_price: '', storage_location: '', notes: ''
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Wine</DialogTitle>
          <DialogDescription>
            Add detailed information about a wine. Fields marked with * are required.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="characteristics">Characteristics</TabsTrigger>
              <TabsTrigger value="service">Service & Aging</TabsTrigger>
              {addToCellar && <TabsTrigger value="cellar">Cellar Details</TabsTrigger>}
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Wine Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="producer">Producer *</Label>
                  <Input
                    id="producer"
                    value={formData.producer}
                    onChange={(e) => handleInputChange('producer', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vintage">Vintage</Label>
                  <Input
                    id="vintage"
                    type="number"
                    min="1800"
                    max="2030"
                    value={formData.vintage}
                    onChange={(e) => handleInputChange('vintage', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country *</Label>
                  <Input
                    id="country"
                    value={formData.country}
                    onChange={(e) => handleInputChange('country', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="region">Region</Label>
                  <Input
                    id="region"
                    value={formData.region}
                    onChange={(e) => handleInputChange('region', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subregion">Sub-region</Label>
                  <Input
                    id="subregion"
                    value={formData.subregion}
                    onChange={(e) => handleInputChange('subregion', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="appellation">Appellation</Label>
                  <Input
                    id="appellation"
                    value={formData.appellation}
                    onChange={(e) => handleInputChange('appellation', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cellar_tracker_id">CellarTracker ID</Label>
                  <div className="flex gap-2">
                    <Input
                      id="cellar_tracker_id"
                      value={formData.cellar_tracker_id}
                      onChange={(e) => handleInputChange('cellar_tracker_id', e.target.value)}
                      placeholder="e.g. 12345"
                    />
                    <Button type="button" size="sm" variant="outline">
                      <LinkIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="image">Wine Image (optional)</Label>
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </div>
            </TabsContent>

            <TabsContent value="characteristics" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="wine_type">Wine Type *</Label>
                  <Select value={formData.wine_type} onValueChange={(value) => handleInputChange('wine_type', value)}>
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
                <div className="space-y-2">
                  <Label htmlFor="color">Color Intensity</Label>
                  <Select value={formData.color} onValueChange={(value) => handleInputChange('color', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select color" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="deep">Deep</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="body">Body</Label>
                  <Select value={formData.body} onValueChange={(value) => handleInputChange('body', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select body" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="full">Full</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sweetness">Sweetness</Label>
                  <Select value={formData.sweetness} onValueChange={(value) => handleInputChange('sweetness', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select sweetness" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dry">Dry</SelectItem>
                      <SelectItem value="off_dry">Off-Dry</SelectItem>
                      <SelectItem value="medium_sweet">Medium-Sweet</SelectItem>
                      <SelectItem value="sweet">Sweet</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="alcohol_content">Alcohol Content (%)</Label>
                  <Input
                    id="alcohol_content"
                    type="number"
                    step="0.1"
                    min="0"
                    max="50"
                    value={formData.alcohol_content}
                    onChange={(e) => handleInputChange('alcohol_content', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="grape_varieties">Grape Varieties</Label>
                  <Input
                    id="grape_varieties"
                    value={formData.grape_varieties}
                    onChange={(e) => handleInputChange('grape_varieties', e.target.value)}
                    placeholder="e.g. Cabernet Sauvignon, Merlot"
                  />
                  <p className="text-xs text-muted-foreground">Separate multiple varieties with commas</p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="service" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="serving_temp_min">Serving Temperature Min (°C)</Label>
                  <Input
                    id="serving_temp_min"
                    type="number"
                    min="0"
                    max="25"
                    value={formData.serving_temp_min}
                    onChange={(e) => handleInputChange('serving_temp_min', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="serving_temp_max">Serving Temperature Max (°C)</Label>
                  <Input
                    id="serving_temp_max"
                    type="number"
                    min="0"
                    max="25"
                    value={formData.serving_temp_max}
                    onChange={(e) => handleInputChange('serving_temp_max', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="drink_from">Drink From (Year)</Label>
                  <Input
                    id="drink_from"
                    type="number"
                    min="2020"
                    max="2050"
                    value={formData.drink_from}
                    onChange={(e) => handleInputChange('drink_from', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="drink_until">Drink Until (Year)</Label>
                  <Input
                    id="drink_until"
                    type="number"
                    min="2020"
                    max="2070"
                    value={formData.drink_until}
                    onChange={(e) => handleInputChange('drink_until', e.target.value)}
                  />
                </div>
              </div>
            </TabsContent>

            {addToCellar && (
              <TabsContent value="cellar" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      value={formData.quantity}
                      onChange={(e) => handleInputChange('quantity', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="purchase_price">Purchase Price</Label>
                    <Input
                      id="purchase_price"
                      type="number"
                      step="0.01"
                      value={formData.purchase_price}
                      onChange={(e) => handleInputChange('purchase_price', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="purchase_date">Purchase Date</Label>
                    <Input
                      id="purchase_date"
                      type="date"
                      value={formData.purchase_date}
                      onChange={(e) => handleInputChange('purchase_date', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="storage_location">Storage Location</Label>
                    <Input
                      id="storage_location"
                      value={formData.storage_location}
                      onChange={(e) => handleInputChange('storage_location', e.target.value)}
                      placeholder="e.g. Rack A, Shelf 3"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="Personal notes about this wine..."
                  />
                </div>
              </TabsContent>
            )}
          </Tabs>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Adding...' : (addToCellar ? 'Add to Cellar' : 'Add Wine')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}