import { useEffect, useState } from 'react';
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
import { Edit } from 'lucide-react';

interface EditRatingDialogProps {
  rating: any;
  onUpdated?: () => void;
}

export default function EditRatingDialog({ rating, onUpdated }: EditRatingDialogProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    rating: rating.rating as number,
    tasting_date: rating.tasting_date || '',
    tasting_notes: rating.tasting_notes || '',
    food_pairing: rating.food_pairing || '',
    serving_temp_min: rating.serving_temp_min as number | null,
    serving_temp_max: rating.serving_temp_max as number | null,
    // Detailed rating fields
    appearance_color: rating.appearance_color || '',
    appearance_intensity: rating.appearance_intensity || '',
    appearance_clarity: rating.appearance_clarity || '',
    appearance_viscosity: rating.appearance_viscosity || '',
    appearance_comments: rating.appearance_comments || '',
    aroma_condition: rating.aroma_condition || '',
    aroma_intensity: rating.aroma_intensity || '',
    aroma_primary: rating.aroma_primary || '',
    aroma_secondary: rating.aroma_secondary || '',
    aroma_tertiary: rating.aroma_tertiary || '',
    aroma_comments: rating.aroma_comments || '',
    palate_sweetness: rating.palate_sweetness || '',
    palate_acidity: rating.palate_acidity || '',
    palate_tannin: rating.palate_tannin || '',
    palate_body: rating.palate_body || '',
    palate_flavor_primary: rating.palate_flavor_primary || '',
    palate_flavor_secondary: rating.palate_flavor_secondary || '',
    palate_flavor_tertiary: rating.palate_flavor_tertiary || '',
    palate_complexity: rating.palate_complexity || '',
    palate_finish: rating.palate_finish || '',
    palate_balance: rating.palate_balance || '',
    palate_comments: rating.palate_comments || '',
  });

  useEffect(() => {
    if (open) {
      setFormData({
        rating: rating.rating,
        tasting_date: rating.tasting_date || '',
        tasting_notes: rating.tasting_notes || '',
        food_pairing: rating.food_pairing || '',
        serving_temp_min: rating.serving_temp_min,
        serving_temp_max: rating.serving_temp_max,
        // Detailed rating fields
        appearance_color: rating.appearance_color || '',
        appearance_intensity: rating.appearance_intensity || '',
        appearance_clarity: rating.appearance_clarity || '',
        appearance_viscosity: rating.appearance_viscosity || '',
        appearance_comments: rating.appearance_comments || '',
        aroma_condition: rating.aroma_condition || '',
        aroma_intensity: rating.aroma_intensity || '',
        aroma_primary: rating.aroma_primary || '',
        aroma_secondary: rating.aroma_secondary || '',
        aroma_tertiary: rating.aroma_tertiary || '',
        aroma_comments: rating.aroma_comments || '',
        palate_sweetness: rating.palate_sweetness || '',
        palate_acidity: rating.palate_acidity || '',
        palate_tannin: rating.palate_tannin || '',
        palate_body: rating.palate_body || '',
        palate_flavor_primary: rating.palate_flavor_primary || '',
        palate_flavor_secondary: rating.palate_flavor_secondary || '',
        palate_flavor_tertiary: rating.palate_flavor_tertiary || '',
        palate_complexity: rating.palate_complexity || '',
        palate_finish: rating.palate_finish || '',
        palate_balance: rating.palate_balance || '',
        palate_comments: rating.palate_comments || '',
      });
    }
  }, [open, rating]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('wine_ratings')
        .update({
          rating: formData.rating,
          tasting_notes: formData.tasting_notes || null,
          food_pairing: formData.food_pairing || null,
          tasting_date: formData.tasting_date || null,
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
          updated_at: new Date().toISOString(),
        })
        .eq('id', rating.id);

      if (error) throw error;

      toast({ title: 'Success', description: 'Rating updated' });
      setOpen(false);
      onUpdated?.();
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to update rating', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Edit className="h-4 w-4 mr-2" /> Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Rating</DialogTitle>
          <DialogDescription>Update your tasting details</DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSave} className="space-y-6">
          {/* Basic Rating Info */}
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
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}