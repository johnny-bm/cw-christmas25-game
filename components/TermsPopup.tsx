import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';

interface TermsPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const termsContent = `Holiday Challenge – Terms & Conditions
1. Organizer
The Holiday Challenge ("Challenge") is organized by Crackwits Digital Agency a company duly established and operating in the State of Kuwait ("Organizer").
 
2. Nature of the Initiative
The Challenge is a skill-based promotional initiative designed to recognize participant performance based on predefined evaluation criteria.
It is not a game of chance, gambling activity, prize draw, lottery, or betting activity.
 
3. Eligibility
Participation is open to individuals who:
•	Are at least 18 years of age at the time of participation; and
•	Meet any additional eligibility requirements communicated on the Challenge webpage.
Employees of the Organizer and any affiliated entities directly involved in the administration of the Challenge may be excluded, at the Organizer's discretion.
 
4. Participation Conditions
•	Participation in the Challenge is free of charge.
•	No payment, purchase, or entry fee is required to participate.
•	Each participant may submit one (1) entry, unless otherwise stated on the Challenge webpage.
•	Entries must be submitted within the timeframe specified by the Organizer.
 
5. Evaluation and Selection
•	All submissions will be evaluated solely on the basis of predefined qualitative and/or quantitative criteria, which may include relevance, quality, originality, and alignment with the Challenge objectives.
•	Evaluation is conducted by the Organizer or a designated internal panel.
•	No element of chance, randomness, or luck is involved in the evaluation or selection process.
•	Participants are assessed independently, and rankings (if any) reflect relative performance against the evaluation criteria.
 
6. Recognition and Professional Benefits
•	The top-ranked participants may receive value-added professional benefits, such as complimentary consultations or service credits.
•	These benefits:
o	Have no cash value;
o	Are non-transferable and non-redeemable for cash;
o	May only be used toward services offered by the Organizer; and
o	Are subject to availability and any additional service-specific terms.
No monetary rewards, cash equivalents, or physical prizes are offered.
 
7. Use of Submissions
By participating, participants grant the Organizer a non-exclusive, royalty-free right to review and internally use submitted materials solely for the purposes of evaluation, administration, and promotion of the Challenge, unless otherwise agreed in writing.
 
8. Disqualification
The Organizer reserves the right to disqualify any participant who:
•	Submits false or misleading information;
•	Violates these Terms & Conditions; or
•	Engages in behavior that compromises the integrity or objectives of the Challenge.
 
9. Limitation of Liability
To the fullest extent permitted by law, the Organizer shall not be liable for:
•	Technical issues affecting participation or submission;
•	Any indirect, incidental, or consequential damages arising from participation; or
•	Any inability of a participant to use the professional benefits offered.
 


10. Compliance with Kuwaiti Law
This Challenge is conducted in accordance with applicable laws and regulations of the State of Kuwait.
Nothing in these Terms & Conditions shall be construed as constituting gambling, gaming, or a game of chance.
 
11. Amendments and Termination
The Organizer reserves the right to amend, suspend, or terminate the Challenge at any time for operational, legal, or regulatory reasons. Any updates will be published on the official Challenge webpage.
 
12. Governing Law and Jurisdiction
These Terms & Conditions shall be governed by and construed in accordance with the laws of the State of Kuwait, and any disputes shall be subject to the exclusive jurisdiction of the competent courts of Kuwait.`;

export function TermsPopup({ open, onOpenChange }: TermsPopupProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-black">
            Terms & Conditions
          </DialogTitle>
        </DialogHeader>
        <div 
          className="mt-4 whitespace-pre-line text-sm sm:text-base leading-relaxed text-gray-700"
        >
          {termsContent}
        </div>
      </DialogContent>
    </Dialog>
  );
}

