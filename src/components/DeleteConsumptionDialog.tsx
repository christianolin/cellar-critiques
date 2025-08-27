import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface DeleteConsumptionDialogProps {
  consumptionId: string;
  wineName: string;
  onDeleted: () => void;
}

export default function DeleteConsumptionDialog({ 
  consumptionId, 
  wineName, 
  onDeleted 
}: DeleteConsumptionDialogProps) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('wine_consumptions')
        .delete()
        .eq('id', consumptionId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `${wineName} removed from consumption history`,
      });

      onDeleted();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove wine from consumption history",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove from Consumption History</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to remove "{wineName}" from your consumption history? 
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={loading}>
            {loading ? 'Removing...' : 'Remove'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}