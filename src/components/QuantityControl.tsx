
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Minus, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import ConsumeWineDialog from './ConsumeWineDialog';
import AddRatingDialog from './AddRatingDialog';

interface QuantityControlProps {
  cellarId: string;
  wineId: string;
  wineName: string;
  currentQuantity: number;
  onQuantityChange: () => void;
}

export default function QuantityControl({ 
  cellarId, 
  wineId, 
  wineName, 
  currentQuantity, 
  onQuantityChange 
}: QuantityControlProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showConsumeDialog, setShowConsumeDialog] = useState(false);
  const [showRatingDialog, setShowRatingDialog] = useState(false);

  const handleIncrease = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('wine_cellar')
        .update({ quantity: currentQuantity + 1 })
        .eq('id', cellarId);

      if (error) throw error;
      onQuantityChange();
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

  const handleDecrease = () => {
    if (currentQuantity <= 0) return;
    setShowConsumeDialog(true);
  };

  const handleConsumeConfirm = async (shouldRate: boolean) => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Update cellar quantity
      const newQuantity = currentQuantity - 1;
      if (newQuantity > 0) {
        await supabase
          .from('wine_cellar')
          .update({ quantity: newQuantity })
          .eq('id', cellarId);
      } else {
        await supabase
          .from('wine_cellar')
          .delete()
          .eq('id', cellarId);
      }

      // Add to consumption archive
      await supabase
        .from('wine_consumptions')
        .insert({
          user_id: user.id,
          wine_id: wineId,
          quantity: 1,
          notes: 'Consumed from cellar',
        });

      toast({
        title: "Success",
        description: `${wineName} consumed and added to archive`,
      });

      onQuantityChange();

      if (shouldRate) {
        setShowRatingDialog(true);
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
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleDecrease}
          disabled={loading || currentQuantity <= 0}
        >
          <Minus className="h-3 w-3" />
        </Button>
        <span className="min-w-[2rem] text-center">{currentQuantity}</span>
        <Button
          variant="outline"
          size="sm"
          onClick={handleIncrease}
          disabled={loading}
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>

      <ConsumeWineDialog
        open={showConsumeDialog}
        onOpenChange={setShowConsumeDialog}
        wineName={wineName}
        onConfirm={handleConsumeConfirm}
      />

      <AddRatingDialog
        open={showRatingDialog}
        onOpenChange={setShowRatingDialog}
        onRatingAdded={onQuantityChange}
      />
    </>
  );
}
