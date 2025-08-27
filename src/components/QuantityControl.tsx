import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { Minus, Plus, Wine } from 'lucide-react';

interface QuantityControlProps {
  cellarEntry: any;
  onUpdate: () => void;
}

export default function QuantityControl({ cellarEntry, onUpdate }: QuantityControlProps) {
  const { user } = useAuth();
  const [showConsumeDialog, setShowConsumeDialog] = useState(false);
  const [consumeQuantity, setConsumeQuantity] = useState(1);
  const [consumeNotes, setConsumeNotes] = useState('');
  const [askForRating, setAskForRating] = useState(false);
  const [loading, setLoading] = useState(false);

  const updateQuantity = async (newQuantity: number) => {
    if (newQuantity <= 0 && !showConsumeDialog) {
      setShowConsumeDialog(true);
      return;
    }

    if (newQuantity < 0) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('wine_cellar')
        .update({ quantity: newQuantity })
        .eq('id', cellarEntry.id);

      if (error) throw error;
      onUpdate();
      
      toast({
        title: "Success",
        description: `Quantity updated to ${newQuantity}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update quantity",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConsume = async () => {
    if (!user || consumeQuantity <= 0) return;

    setLoading(true);
    try {
      const newQuantity = cellarEntry.quantity - consumeQuantity;
      
      // Add to consumption archive
      const { error: consumeError } = await supabase
        .from('wine_consumptions')
        .insert({
          user_id: user.id,
          wine_id: cellarEntry.wine_id,
          quantity: consumeQuantity,
          notes: consumeNotes || null,
        });

      if (consumeError) throw consumeError;

      // Update cellar quantity
      if (newQuantity > 0) {
        const { error: updateError } = await supabase
          .from('wine_cellar')
          .update({ quantity: newQuantity })
          .eq('id', cellarEntry.id);

        if (updateError) throw updateError;
      } else {
        // Remove from cellar if quantity is 0
        const { error: deleteError } = await supabase
          .from('wine_cellar')
          .delete()
          .eq('id', cellarEntry.id);

        if (deleteError) throw deleteError;
      }

      toast({
        title: "Success",
        description: `${consumeQuantity} bottle(s) moved to consumed archive`,
      });

      setShowConsumeDialog(false);
      setConsumeQuantity(1);
      setConsumeNotes('');
      setAskForRating(false);
      onUpdate();

      if (askForRating) {
        toast({
          title: "Rate this wine",
          description: "Don't forget to rate the wine you just enjoyed!",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to consume wine",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => updateQuantity(cellarEntry.quantity - 1)}
          disabled={loading || cellarEntry.quantity <= 0}
        >
          <Minus className="h-3 w-3" />
        </Button>
        <span className="text-sm font-medium w-8 text-center">{cellarEntry.quantity}</span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => updateQuantity(cellarEntry.quantity + 1)}
          disabled={loading}
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>

      <Dialog open={showConsumeDialog} onOpenChange={setShowConsumeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wine className="h-5 w-5 text-primary" />
              Consume Wine
            </DialogTitle>
            <DialogDescription>
              Record consumption of {cellarEntry.wines.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="consume-quantity">Quantity to consume</Label>
              <Input
                id="consume-quantity"
                type="number"
                min="1"
                max={cellarEntry.quantity}
                value={consumeQuantity}
                onChange={(e) => setConsumeQuantity(parseInt(e.target.value) || 1)}
              />
            </div>

            <div>
              <Label htmlFor="consume-notes">Consumption Notes</Label>
              <Textarea
                id="consume-notes"
                value={consumeNotes}
                onChange={(e) => setConsumeNotes(e.target.value)}
                placeholder="Occasion, location, thoughts..."
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="ask-rating"
                checked={askForRating}
                onChange={(e) => setAskForRating(e.target.checked)}
              />
              <Label htmlFor="ask-rating">Remind me to rate this wine</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConsumeDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleConsume} disabled={loading}>
              {loading ? 'Recording...' : 'Consume Wine'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}