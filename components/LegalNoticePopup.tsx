import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';

interface LegalNoticePopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const legalContent = `Holiday Challenge – Legal Notice

This Holiday Challenge is a skill-based promotional initiative organized by [Company Name]. Participation is free of charge and does not require any payment, purchase, or entry fee.

Participants are assessed solely on predefined qualitative and/or quantitative criteria related to the challenge objectives. Selection of top-ranked participants is based entirely on merit and performance, with no element of chance, randomness, or luck involved.

No monetary rewards are offered. Any professional benefits provided, including complimentary consultations or service credits, are non-transferable, non-redeemable for cash, and may only be used toward services offered by [Company Name], subject to applicable terms.

This initiative does not constitute a game of chance, gambling activity, prize draw, or lottery, and is conducted in accordance with applicable laws and regulations in the State of Kuwait.`;

export function LegalNoticePopup({ open, onOpenChange }: LegalNoticePopupProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-black">
            Legal Notice
          </DialogTitle>
        </DialogHeader>
        <div 
          className="mt-4 whitespace-pre-line text-sm sm:text-base leading-relaxed text-gray-700"
        >
          {legalContent}
        </div>
      </DialogContent>
    </Dialog>
  );
}

