import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { Plus, Star } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

interface AddRatingDialogProps {
  onRatingAdded?: () => void;
}

interface WineInCellar {
  id: string;
  quantity: number;
  wines: {
    id: string;
    name: string;
    producer: string;
    vintage: number | null;
    wine_type: string;
  };
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

interface RatingFormData {
  wine_id: string;
  rating: number | null;
  tasting_notes: string;
  food_pairing: string;
  tasting_date: string;
  color: string;
  body: string;
  sweetness: string;
  serving_temp_min: number | null;
  serving_temp_max: number | null;
}

interface NewWineData {
  name: string;
  producer: string;
  vintage: number | null;
  wine_type: string;
  country_id: string;
  region_id: string;
  alcohol_content: number | null;
}

export default function AddRatingDialog({ onRatingAdded }: AddRatingDialogProps) {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const preSelectedWineId = searchParams.get('wine_id');
  
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cellarWines, setCellarWines] = useState<WineInCellar[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [activeTab, setActiveTab] = useState('select-wine');

  const [formData, setFormData] = useState<RatingFormData>({
    wine_id: preSelectedWineId || '',
    rating: null,
    tasting_notes: '',
    food_pairing: '',
    tasting_date: new Date().toISOString().split('T')[0],
    color: '',
    body: '',
    sweetness: '',
    serving_temp_min: null,
    serving_temp_max: null,
  });

  const [newWineData, setNewWineData] = useState<NewWineData>({
    name: '',
    producer: '',
    vintage: null,
    wine_type: 'red',
    country_id: '',
    region_id: '',
    alcohol_content: null,
  });

  useEffect(() => {
    if (open && user) {
      fetchCellarWines();
      fetchCountries();
    }
  }, [open, user]);

  useEffect(() => {
    if (preSelectedWineId) {
      setFormData(prev => ({ ...prev, wine_id: preSelectedWineId }));
      setOpen(true);
    }
  }, [preSelectedWineId]);

  const fetchCellarWines = async () => {
    try {
      const { data, error } = await supabase
        .from('wine_cellar')
        .select(`
          id,
          quantity,
          wines (
            id,
            name,
            producer,
            vintage,
            wine_type
          )
        `)
        .eq('user_id', user?.id);

      if (error) throw error;
      setCellarWines(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load your wines",
        variant: "destructive",
      });
    }
  };

  const fetchCountries = async () => {
    try {
      const { data, error } = await supabase
        .from('countries')
        .select('*')
        .order('name');

      if (error) throw error;
      setCountries(data || []);
    } catch (error) {
      console.error('Error fetching countries:', error);
    }
  };

  const fetchRegions = async (countryId: string) => {
    try {
      const { data, error } = await supabase
        .from('regions')
        .select('*')
        .eq('country_id', countryId)
        .order('name');

      if (error) throw error;
      setRegions(data || []);
    } catch (error) {
      console.error('Error fetching regions:', error);
    }
  };

  const handleCountryChange = (countryId: string) => {
    setNewWineData(prev => ({ ...prev, country_id: countryId, region_id: '' }));
    fetchRegions(countryId);
  };

  const createWineAndRate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formData.rating) return;

    setLoading(true);
    try {
      // First create the wine
      const { data: wineData, error: wineError } = await supabase
        .from('wines')
        .insert({
          name: newWineData.name,
          producer: newWineData.producer,
          vintage: newWineData.vintage,
          wine_type: newWineData.wine_type as "red" | "white" | "rose" | "sparkling" | "dessert" | "fortified",
          country_id: newWineData.country_id || null,
          region_id: newWineData.region_id || null,
          alcohol_content: newWineData.alcohol_content,
        })
        .select()
        .single();

      if (wineError) throw wineError;

      // Then create the rating
      const { error: ratingError } = await supabase
        .from('wine_ratings')
        .insert({
          user_id: user.id,
          wine_id: wineData.id,
          rating: formData.rating,
          tasting_notes: formData.tasting_notes || null,
          food_pairing: formData.food_pairing || null,
          tasting_date: formData.tasting_date || null,
          color: formData.color || null,
          body: formData.body || null,
          sweetness: formData.sweetness || null,
          serving_temp_min: formData.serving_temp_min,
          serving_temp_max: formData.serving_temp_max,
        });

      if (ratingError) throw ratingError;

      // Add to consumption list since it's not from cellar
      const { error: consumptionError } = await supabase
        .from('wine_consumptions')
        .insert({
          user_id: user.id,
          wine_id: wineData.id,
          quantity: 1,
          consumed_at: formData.tasting_date ? new Date(formData.tasting_date).toISOString() : new Date().toISOString(),
          notes: formData.tasting_notes || null,
        });

      if (consumptionError) throw consumptionError;

      toast({
        title: "Success",
        description: "Wine and rating added successfully!",
      });

      // Reset forms
      setFormData({
        wine_id: '',
        rating: null,
        tasting_notes: '',
        food_pairing: '',
        tasting_date: new Date().toISOString().split('T')[0],
        color: '',
        body: '',
        sweetness: '',
        serving_temp_min: null,
        serving_temp_max: null,
      });
      setNewWineData({
        name: '',
        producer: '',
        vintage: null,
        wine_type: 'red',
        country_id: '',
        region_id: '',
        alcohol_content: null,
      });
      setActiveTab('select-wine');
      setOpen(false);
      onRatingAdded?.();
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add wine and rating",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formData.wine_id || !formData.rating) {
      console.error('Missing required data:', { user: !!user, wine_id: formData.wine_id, rating: formData.rating });
      return;
    }

    console.log('Submitting rating:', formData);
    setLoading(true);
    try {
      const { data: ratingData, error } = await supabase
        .from('wine_ratings')
        .insert({
          user_id: user.id,
          wine_id: formData.wine_id,
          rating: formData.rating,
          tasting_notes: formData.tasting_notes || null,
          food_pairing: formData.food_pairing || null,
          tasting_date: formData.tasting_date || null,
          color: formData.color || null,
          body: formData.body || null,
          sweetness: formData.sweetness || null,
          serving_temp_min: formData.serving_temp_min,
          serving_temp_max: formData.serving_temp_max,
        })
        .select()
        .single();

      if (error) {
        console.error('Rating error:', error);
        throw error;
      }

      console.log('Rating created successfully:', ratingData);

      toast({
        title: "Success",
        description: "Rating added successfully!",
      });

      // Reset form
      setFormData({
        wine_id: '',
        rating: null,
        tasting_notes: '',
        food_pairing: '',
        tasting_date: new Date().toISOString().split('T')[0],
        color: '',
        body: '',
        sweetness: '',
        serving_temp_min: null,
        serving_temp_max: null,
      });
      setActiveTab('select-wine');
      setOpen(false);
      onRatingAdded?.();
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add rating",
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
          Add Rating
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Wine Rating</DialogTitle>
          <DialogDescription>
            Rate a wine using the Robert Parker 100-point system
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="select-wine">Select from Cellar</TabsTrigger>
            <TabsTrigger value="add-wine">Select Wine Not in Cellar</TabsTrigger>
          </TabsList>
          
          <TabsContent value="select-wine" className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="wine_select">Select Wine *</Label>
                <Select value={formData.wine_id} onValueChange={(value) => setFormData({ ...formData, wine_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a wine from your cellar" />
                  </SelectTrigger>
                  <SelectContent>
                    {cellarWines.map((cellarWine) => (
                      <SelectItem key={cellarWine.wines.id} value={cellarWine.wines.id}>
                        {cellarWine.wines.name} - {cellarWine.wines.producer} {cellarWine.wines.vintage}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.wine_id && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="rating" className="flex items-center gap-2">
                        Rating (50-100) *
                        <span className="text-xs text-muted-foreground cursor-help" title="Robert Parker Scale: 96-100 Extraordinary, 94-95 Outstanding, 90-93 Excellent, 85-89 Very Good, 80-84 Good, 70-79 Average, 50-69 Below Average">
                          ℹ️
                        </span>
                      </Label>
                      <Input
                        id="rating"
                        type="number"
                        min="50"
                        max="100"
                        value={formData.rating || ''}
                        onChange={(e) => setFormData({ ...formData, rating: e.target.value ? parseInt(e.target.value) : null })}
                        required
                      />
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

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="color">Color</Label>
                      <Select value={formData.color} onValueChange={(value) => setFormData({ ...formData, color: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select color" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pale">Pale</SelectItem>
                          <SelectItem value="light">Light</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="deep">Deep</SelectItem>
                          <SelectItem value="intense">Intense</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="body">Body</Label>
                      <Select value={formData.body} onValueChange={(value) => setFormData({ ...formData, body: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select body" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="light">Light</SelectItem>
                          <SelectItem value="medium-minus">Medium(-)</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="medium-plus">Medium(+)</SelectItem>
                          <SelectItem value="full">Full</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="sweetness">Sweetness</Label>
                      <Select value={formData.sweetness} onValueChange={(value) => setFormData({ ...formData, sweetness: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select sweetness" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bone-dry">Bone Dry</SelectItem>
                          <SelectItem value="dry">Dry</SelectItem>
                          <SelectItem value="off-dry">Off-Dry</SelectItem>
                          <SelectItem value="medium-dry">Medium-Dry</SelectItem>
                          <SelectItem value="medium-sweet">Medium-Sweet</SelectItem>
                          <SelectItem value="sweet">Sweet</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="serving_temp_min">Serving Temp Min (°C)</Label>
                      <Input
                        id="serving_temp_min"
                        type="number"
                        min="0"
                        max="25"
                        value={formData.serving_temp_min || ''}
                        onChange={(e) => setFormData({ ...formData, serving_temp_min: e.target.value ? parseInt(e.target.value) : null })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="serving_temp_max">Serving Temp Max (°C)</Label>
                      <Input
                        id="serving_temp_max"
                        type="number"
                        min="0"
                        max="25"
                        value={formData.serving_temp_max || ''}
                        onChange={(e) => setFormData({ ...formData, serving_temp_max: e.target.value ? parseInt(e.target.value) : null })}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="tasting_notes">Tasting Notes</Label>
                    <Textarea
                      id="tasting_notes"
                      value={formData.tasting_notes}
                      onChange={(e) => setFormData({ ...formData, tasting_notes: e.target.value })}
                      placeholder="Describe the wine's aroma, flavor, and texture..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="food_pairing">Food Pairing</Label>
                    <Textarea
                      id="food_pairing"
                      value={formData.food_pairing}
                      onChange={(e) => setFormData({ ...formData, food_pairing: e.target.value })}
                      placeholder="Suggested food pairings..."
                    />
                  </div>

                  <DialogFooter>
                    <Button type="submit" disabled={loading || !formData.wine_id || !formData.rating}>
                      {loading ? 'Adding Rating...' : 'Add Rating'}
                    </Button>
                  </DialogFooter>
                </>
              )}
            </form>
          </TabsContent>
          
          <TabsContent value="add-wine" className="space-y-4">
            <form onSubmit={createWineAndRate} className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Wine Information</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="new_wine_name">Wine Name *</Label>
                    <Input
                      id="new_wine_name"
                      value={newWineData.name}
                      onChange={(e) => setNewWineData({ ...newWineData, name: e.target.value })}
                      placeholder="Wine name"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="new_wine_producer">Producer *</Label>
                    <Input
                      id="new_wine_producer"
                      value={newWineData.producer}
                      onChange={(e) => setNewWineData({ ...newWineData, producer: e.target.value })}
                      placeholder="Producer/Winery"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="new_wine_vintage">Vintage</Label>
                    <Input
                      id="new_wine_vintage"
                      type="number"
                      min="1800"
                      max="2030"
                      value={newWineData.vintage || ''}
                      onChange={(e) => setNewWineData({ ...newWineData, vintage: e.target.value ? parseInt(e.target.value) : null })}
                      placeholder="2020"
                    />
                  </div>
                  <div>
                    <Label htmlFor="new_wine_type">Wine Type *</Label>
                    <Select value={newWineData.wine_type} onValueChange={(value) => setNewWineData({ ...newWineData, wine_type: value })}>
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
                    <Label htmlFor="new_wine_alcohol">Alcohol %</Label>
                    <Input
                      id="new_wine_alcohol"
                      type="number"
                      step="0.1"
                      min="0"
                      max="50"
                      value={newWineData.alcohol_content || ''}
                      onChange={(e) => setNewWineData({ ...newWineData, alcohol_content: e.target.value ? parseFloat(e.target.value) : null })}
                      placeholder="13.5"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="new_wine_country">Country</Label>
                    <Select value={newWineData.country_id} onValueChange={handleCountryChange}>
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
                    <Label htmlFor="new_wine_region">Region</Label>
                    <Select value={newWineData.region_id} onValueChange={(value) => setNewWineData({ ...newWineData, region_id: value })} disabled={!newWineData.country_id}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select region" />
                      </SelectTrigger>
                      <SelectContent>
                        {regions.map((region) => (
                          <SelectItem key={region.id} value={region.id}>
                            {region.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Rating Information</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="combined_rating" className="flex items-center gap-2">
                      Rating (50-100) *
                      <span className="text-xs text-muted-foreground cursor-help" title="Robert Parker Scale">
                        ℹ️
                      </span>
                    </Label>
                    <Input
                      id="combined_rating"
                      type="number"
                      min="50"
                      max="100"
                      value={formData.rating || ''}
                      onChange={(e) => setFormData({ ...formData, rating: e.target.value ? parseInt(e.target.value) : null })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="combined_tasting_date">Tasting Date</Label>
                    <Input
                      id="combined_tasting_date"
                      type="date"
                      value={formData.tasting_date}
                      onChange={(e) => setFormData({ ...formData, tasting_date: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="combined_color">Color</Label>
                    <Select value={formData.color} onValueChange={(value) => setFormData({ ...formData, color: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select color" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pale">Pale</SelectItem>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="deep">Deep</SelectItem>
                        <SelectItem value="intense">Intense</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="combined_body">Body</Label>
                    <Select value={formData.body} onValueChange={(value) => setFormData({ ...formData, body: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select body" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="medium-minus">Medium(-)</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="medium-plus">Medium(+)</SelectItem>
                        <SelectItem value="full">Full</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="combined_sweetness">Sweetness</Label>
                    <Select value={formData.sweetness} onValueChange={(value) => setFormData({ ...formData, sweetness: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select sweetness" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bone-dry">Bone Dry</SelectItem>
                        <SelectItem value="dry">Dry</SelectItem>
                        <SelectItem value="off-dry">Off-Dry</SelectItem>
                        <SelectItem value="medium-dry">Medium-Dry</SelectItem>
                        <SelectItem value="medium-sweet">Medium-Sweet</SelectItem>
                        <SelectItem value="sweet">Sweet</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="combined_serving_temp_min">Serving Temp Min (°C)</Label>
                    <Input
                      id="combined_serving_temp_min"
                      type="number"
                      min="0"
                      max="25"
                      value={formData.serving_temp_min || ''}
                      onChange={(e) => setFormData({ ...formData, serving_temp_min: e.target.value ? parseInt(e.target.value) : null })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="combined_serving_temp_max">Serving Temp Max (°C)</Label>
                    <Input
                      id="combined_serving_temp_max"
                      type="number"
                      min="0"
                      max="25"
                      value={formData.serving_temp_max || ''}
                      onChange={(e) => setFormData({ ...formData, serving_temp_max: e.target.value ? parseInt(e.target.value) : null })}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="combined_tasting_notes">Tasting Notes</Label>
                  <Textarea
                    id="combined_tasting_notes"
                    value={formData.tasting_notes}
                    onChange={(e) => setFormData({ ...formData, tasting_notes: e.target.value })}
                    placeholder="Describe the wine's aroma, flavor, and texture..."
                  />
                </div>

                <div>
                  <Label htmlFor="combined_food_pairing">Food Pairing</Label>
                  <Textarea
                    id="combined_food_pairing"
                    value={formData.food_pairing}
                    onChange={(e) => setFormData({ ...formData, food_pairing: e.target.value })}
                    placeholder="Suggested food pairings..."
                  />
                </div>
              </div>

              <DialogFooter>
                <Button type="submit" disabled={loading || !newWineData.name || !newWineData.producer || !formData.rating}>
                  {loading ? 'Adding Wine & Rating...' : 'Add Wine & Rating'}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
