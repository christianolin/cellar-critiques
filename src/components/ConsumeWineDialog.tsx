
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Wine, Star } from 'lucide-react';

interface ConsumeWineDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  wineName: string;
  onConfirm: (shouldRate: boolean) => void;
}

export default function ConsumeWineDialog({ open, onOpenChange, wineName, onConfirm }: ConsumeWineDialogProps) {
  const [showRatingQuestion, setShowRatingQuestion] = useState(false);

  const handleYesConsume = () => {
    setShowRatingQuestion(true);
  };

  const handleNoConsume = () => {
    onOpenChange(false);
    setShowRatingQuestion(false);
  };

  const handleYesRate = () => {
    onConfirm(true);
    onOpenChange(false);
    setShowRatingQuestion(false);
  };

  const handleNoRate = () => {
    onConfirm(false);
    onOpenChange(false);
    setShowRatingQuestion(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wine className="h-5 w-5 text-primary" />
            {showRatingQuestion ? 'Rate Wine' : 'Consume Wine'}
          </DialogTitle>
          <DialogDescription>
            {showRatingQuestion ? (
              <>
                You're about to consume <strong>{wineName}</strong>. Would you like to rate this wine?
              </>
            ) : (
              <>
                Do you want to consume <strong>{wineName}</strong> and add it to your consumed archive?
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        
        <DialogFooter className="flex gap-2">
          {showRatingQuestion ? (
            <>
              <Button variant="outline" onClick={handleNoRate}>
                <Wine className="h-4 w-4 mr-2" />
                Just Consume
              </Button>
              <Button onClick={handleYesRate}>
                <Star className="h-4 w-4 mr-2" />
                Rate & Consume
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={handleNoConsume}>
                Cancel
              </Button>
              <Button onClick={handleYesConsume}>
                Yes, Consume
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
