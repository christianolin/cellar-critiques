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
import { Plus, PlusCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Wine {
  id: string;
  name: string;
  producer: string;
  vintage: number | null;
  wine_type: string;
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
}

export default function AddRatingDialog({ onRatingAdded }: AddRatingDialogProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [wines, setWines] = useState<Wine[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [appellations, setAppellations] = useState<Appellation[]>([]);
  const [grapeVarieties, setGrapeVarieties] = useState<GrapeVariety[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedWine, setSelectedWine] = useState<string>('');
  const [mode, setMode] = useState<'existing' | 'new'>('existing');
  
  const [formData, setFormData] = useState({
    rating: 85,
    tasting_date: new Date().toISOString().split('T')[0],
    tasting_notes: '',
    food_pairing: '',
    serving_temp_min: null as number | null,
    serving_temp_max: null as number | null,
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
    alcohol_content: null as number | null,
    bottle_size: 'Bottle (750ml)',
    country_id: '',
    region_id: '',
    appellation_id: '',
    grape_variety_ids: [] as string[],
  });

  useEffect(() => {
    if (open) {
      fetchWines();
      fetchMasterData();
    }
  }, [open]);

  const fetchWines = async () => {
    try {
      const { data, error } = await supabase
        .from('wines')
        .select('id, name, producer, vintage, wine_type')
        .order('name');

      if (error) throw error;
      setWines(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load wines",
        variant: "destructive",
      });
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
        description: "Failed to load master data",
        variant: "destructive",
      });
    }
  };

  const createNewWine = async () => {
    try {
      const { data, error } = await supabase
        .from('wines')
        .insert({
          name: newWineData.name,
          producer: newWineData.producer,
          vintage: newWineData.vintage,
          wine_type: newWineData.wine_type,
          alcohol_content: newWineData.alcohol_content,
          bottle_size: newWineData.bottle_size,
          country_id: newWineData.country_id || null,
          region_id: newWineData.region_id || null,
          appellation_id: newWineData.appellation_id || null,
          grape_variety_ids: newWineData.grape_variety_ids,
        })
        .select()
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    let wineId = selectedWine;

    // If adding new wine, create it first
    if (mode === 'new') {
      if (!newWineData.name || !newWineData.producer) {
        toast({
          title: "Error",
          description: "Wine name and producer are required",
          variant: "destructive",
        });
        return;
      }

      setLoading(true);
      try {
        wineId = await createNewWine();
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to create wine",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
    } else if (!selectedWine) {
      toast({
        title: "Error",
        description: "Please select a wine",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('wine_ratings')
        .insert({
          user_id: user.id,
          wine_id: wineId,
          rating: formData.rating,
          tasting_date: formData.tasting_date,
          tasting_notes: formData.tasting_notes || null,
          food_pairing: formData.food_pairing || null,
          serving_temp_min: formData.serving_temp_min,
          serving_temp_max: formData.serving_temp_max,
          // Detailed rating fields
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

      toast({
        title: "Success",
        description: "Rating added successfully!",
      });

      setOpen(false);
      resetForm();
      onRatingAdded?.();
    } catch (error) {
      console.error('Error creating rating:', error);
      toast({
        title: "Error",
        description: "Failed to add rating",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedWine('');
    setMode('existing');
    setFormData({
      rating: 85,
      tasting_date: new Date().toISOString().split('T')[0],
      tasting_notes: '',
      food_pairing: '',
      serving_temp_min: null,
      serving_temp_max: null,
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
      bottle_size: 'Bottle (750ml)',
      country_id: '',
      region_id: '',
      appellation_id: '',
      grape_variety_ids: [],
    });
  };

  const filteredRegions = regions.filter(region => 
    !newWineData.country_id || region.country_id === newWineData.country_id
  );

  const filteredAppellations = appellations.filter(appellation => 
    !newWineData.region_id || appellation.region_id === newWineData.region_id
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Rating
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Wine Rating</DialogTitle>
          <DialogDescription>
            Rate a wine using the detailed evaluation system
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Wine Selection Mode */}
          <div className="flex gap-2 mb-4">
            <Button
              type="button"
              variant={mode === 'existing' ? 'default' : 'outline'}
              onClick={() => setMode('existing')}
            >
              Select Existing Wine
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

          {/* Wine Selection */}
          {mode === 'existing' ? (
            <div>
              <Label htmlFor="wine">Select Wine *</Label>
              <Select value={selectedWine} onValueChange={setSelectedWine}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose any wine to rate" />
                </SelectTrigger>
                <SelectContent>
                  {wines.map((wine) => (
                    <SelectItem key={wine.id} value={wine.id}>
                      {wine.name} - {wine.producer} {wine.vintage ? `(${wine.vintage})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Select from existing wines in the database
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Add New Wine</h3>
              
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
                  <Input
                    id="producer"
                    value={newWineData.producer}
                    onChange={(e) => setNewWineData({ ...newWineData, producer: e.target.value })}
                    placeholder="e.g., Château Margaux"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="vintage">Vintage</Label>
                  <Input
                    id="vintage"
                    type="number"
                    min="1800"
                    max={new Date().getFullYear()}
                    value={newWineData.vintage ?? ''}
                    onChange={(e) => setNewWineData({ ...newWineData, vintage: e.target.value ? parseInt(e.target.value) : null })}
                    placeholder="e.g., 2020"
                  />
                </div>
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
                  <Label htmlFor="alcohol_content">Alcohol %</Label>
                  <Input
                    id="alcohol_content"
                    type="number"
                    step="0.1"
                    min="0"
                    max="50"
                    value={newWineData.alcohol_content ?? ''}
                    onChange={(e) => setNewWineData({ ...newWineData, alcohol_content: e.target.value ? parseFloat(e.target.value) : null })}
                    placeholder="e.g., 13.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="country">Country</Label>
                  <Select
                    value={newWineData.country_id}
                    onValueChange={(value) => setNewWineData({ ...newWineData, country_id: value, region_id: '', appellation_id: '' })}
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
                    value={newWineData.region_id}
                    onValueChange={(value) => setNewWineData({ ...newWineData, region_id: value, appellation_id: '' })}
                    disabled={!newWineData.country_id}
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
                <div>
                  <Label htmlFor="appellation">Appellation</Label>
                  <Select
                    value={newWineData.appellation_id}
                    onValueChange={(value) => setNewWineData({ ...newWineData, appellation_id: value })}
                    disabled={!newWineData.region_id}
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
              </div>
            </div>
          )}

          {/* Rating Fields */}
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

          <Tabs defaultValue="appearance" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="appearance">Appearance</TabsTrigger>
              <TabsTrigger value="aroma">Aroma</TabsTrigger>
              <TabsTrigger value="palate">Palate</TabsTrigger>
            </TabsList>

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
            <div>
              <Label htmlFor="serving_temp_min">Serving Temp Min (°C)</Label>
              <Input
                id="serving_temp_min"
                type="number"
                min={0}
                max={25}
                value={formData.serving_temp_min ?? ''}
                onChange={(e) => setFormData({ ...formData, serving_temp_min: e.target.value ? parseInt(e.target.value) : null })}
              />
            </div>
            <div>
              <Label htmlFor="serving_temp_max">Serving Temp Max (°C)</Label>
              <Input
                id="serving_temp_max"
                type="number"
                min={0}
                max={25}
                value={formData.serving_temp_max ?? ''}
                onChange={(e) => setFormData({ ...formData, serving_temp_max: e.target.value ? parseInt(e.target.value) : null })}
              />
            </div>
          </div>

          {/* Tasting Notes & Food Pairing */}
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