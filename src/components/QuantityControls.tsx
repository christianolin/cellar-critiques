import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { Minus, Plus } from 'lucide-react';

interface QuantityControlsProps {
  cellarEntry: any;
  onUpdate: () => void;
}

export default function QuantityControls({ cellarEntry, onUpdate }: QuantityControlsProps) {
  const { user } = useAuth();
  const [showConsumeDialog, setShowConsumeDialog] = useState(false);
  const [consumeQuantity, setConsumeQuantity] = useState(1);
  const [consumeNotes, setConsumeNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleIncrease = async () => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('wine_cellar')
        .update({ quantity: cellarEntry.quantity + 1 })
        .eq('id', cellarEntry.id);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Quantity increased",
      });
      onUpdate();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update quantity",
        variant: "destructive",
      });
    }
  };

  const handleDecrease = () => {
    if (cellarEntry.quantity <= 1) return;
    setShowConsumeDialog(true);
  };

  const handleConsume = async () => {
    if (!user || consumeQuantity > cellarEntry.quantity) return;

    setLoading(true);
    try {
      // Record consumption
      const { error: consumeError } = await supabase
        .from('wine_consumptions')
        .insert({
          user_id: user.id,
          wine_id: cellarEntry.wines.id,
          quantity: consumeQuantity,
          notes: consumeNotes || null,
        });

      if (consumeError) throw consumeError;

      // Update cellar quantity
      const newQuantity = cellarEntry.quantity - consumeQuantity;
      if (newQuantity > 0) {
        const { error: updateError } = await supabase
          .from('wine_cellar')
          .update({ quantity: newQuantity })
          .eq('id', cellarEntry.id);

        if (updateError) throw updateError;
      } else {
        // Remove from cellar if quantity becomes 0
        const { error: deleteError } = await supabase
          .from('wine_cellar')
          .delete()
          .eq('id', cellarEntry.id);

        if (deleteError) throw deleteError;
      }

      toast({
        title: "Success",
        description: `${consumeQuantity} bottle(s) moved to consumed wines`,
      });

      setShowConsumeDialog(false);
      setConsumeQuantity(1);
      setConsumeNotes('');
      onUpdate();
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
          onClick={handleDecrease}
          disabled={cellarEntry.quantity <= 1}
        >
          <Minus className="h-3 w-3" />
        </Button>
        <span className="text-sm font-medium px-2">{cellarEntry.quantity}</span>
        <Button
          variant="outline"
          size="sm"
          onClick={handleIncrease}
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>

      <Dialog open={showConsumeDialog} onOpenChange={setShowConsumeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Consume Wine</DialogTitle>
            <DialogDescription>
              Record consumption of {cellarEntry.wines.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="quantity">Quantity to consume</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                max={cellarEntry.quantity}
                value={consumeQuantity}
                onChange={(e) => setConsumeQuantity(parseInt(e.target.value) || 1)}
              />
            </div>
            
            <div>
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                value={consumeNotes}
                onChange={(e) => setConsumeNotes(e.target.value)}
                placeholder="Occasion, thoughts, etc."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConsumeDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleConsume} disabled={loading}>
              {loading ? 'Recording...' : 'Record Consumption'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}