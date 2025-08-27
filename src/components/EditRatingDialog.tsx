import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
    color: rating.color || '',
    body: rating.body || '',
    sweetness: rating.sweetness || '',
    serving_temp_min: rating.serving_temp_min as number | null,
    serving_temp_max: rating.serving_temp_max as number | null,
  });

  useEffect(() => {
    if (open) {
      setFormData({
        rating: rating.rating,
        tasting_date: rating.tasting_date || '',
        tasting_notes: rating.tasting_notes || '',
        food_pairing: rating.food_pairing || '',
        color: rating.color || '',
        body: rating.body || '',
        sweetness: rating.sweetness || '',
        serving_temp_min: rating.serving_temp_min,
        serving_temp_max: rating.serving_temp_max,
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
          color: formData.color || null,
          body: formData.body || null,
          sweetness: formData.sweetness || null,
          serving_temp_min: formData.serving_temp_min,
          serving_temp_max: formData.serving_temp_max,
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
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Edit Rating</DialogTitle>
          <DialogDescription>Update your tasting details</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="rating">Rating (50-100)</Label>
              <Input
                id="rating"
                type="number"
                min={50}
                max={100}
                value={formData.rating}
                onChange={(e) => setFormData({ ...formData, rating: parseInt(e.target.value) })}
                required
              />
            </div>
            <div>
              <Label htmlFor="tasting_date">Tasting Date</Label>
              <Input
                id="tasting_date"
                type="date"
                value={formData.tasting_date || ''}
                onChange={(e) => setFormData({ ...formData, tasting_date: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="color">Color</Label>
              <Input
                id="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                placeholder="e.g., Medium"
              />
            </div>
            <div>
              <Label htmlFor="body">Body</Label>
              <Input
                id="body"
                value={formData.body}
                onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                placeholder="e.g., Medium+"
              />
            </div>
            <div>
              <Label htmlFor="sweetness">Sweetness</Label>
              <Input
                id="sweetness"
                value={formData.sweetness}
                onChange={(e) => setFormData({ ...formData, sweetness: e.target.value })}
                placeholder="e.g., Dry"
              />
            </div>
          </div>

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

          <div>
            <Label htmlFor="tasting_notes">Tasting Notes</Label>
            <Textarea
              id="tasting_notes"
              value={formData.tasting_notes}
              onChange={(e) => setFormData({ ...formData, tasting_notes: e.target.value })}
              placeholder="Describe the wine..."
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
