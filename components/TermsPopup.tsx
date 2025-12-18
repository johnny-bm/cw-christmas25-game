import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';

interface TermsPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TermsPopup({ open, onOpenChange }: TermsPopupProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle className="text-2xl sm:text-3xl font-bold text-black mb-2">
            Holiday Challenge – Terms & Conditions
          </DialogTitle>
        </DialogHeader>
        <div 
          className="mt-6 space-y-6 text-sm sm:text-base leading-relaxed text-gray-700"
          style={{
            touchAction: 'pan-y pinch-zoom',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {/* Section 1 */}
          <section>
            <h2 className="text-lg sm:text-xl font-bold text-black mb-3">1. Organizer</h2>
            <p className="mb-0">
              The Holiday Challenge ("Challenge") is organized by <strong>Crackwits Digital Agency</strong>, a company duly established and operating in the State of Kuwait ("Organizer").
            </p>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-lg sm:text-xl font-bold text-black mb-3">2. Nature of the Initiative</h2>
            <p className="mb-2">
              The Challenge is a skill-based promotional initiative designed to recognize participant performance based on predefined evaluation criteria.
            </p>
            <p className="mb-0">
              It is not a game of chance, gambling activity, prize draw, lottery, or betting activity.
            </p>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-lg sm:text-xl font-bold text-black mb-3">3. Eligibility</h2>
            <p className="mb-3">
              Participation is open to individuals who:
            </p>
            <ul className="list-disc list-outside ml-6 mb-3 space-y-2">
              <li>Are at least 18 years of age at the time of participation; and</li>
              <li>Meet any additional eligibility requirements communicated on the Challenge webpage.</li>
            </ul>
            <p className="mb-0">
              Employees of the Organizer and any affiliated entities directly involved in the administration of the Challenge may be excluded, at the Organizer's discretion.
            </p>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-lg sm:text-xl font-bold text-black mb-3">4. Participation Conditions</h2>
            <ul className="list-disc list-outside ml-6 space-y-2">
              <li>Participation in the Challenge is free of charge.</li>
              <li>No payment, purchase, or entry fee is required to participate.</li>
              <li>Each participant may submit one (1) entry, unless otherwise stated on the Challenge webpage.</li>
              <li>Entries must be submitted within the timeframe specified by the Organizer.</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-lg sm:text-xl font-bold text-black mb-3">5. Evaluation and Selection</h2>
            <ul className="list-disc list-outside ml-6 space-y-2">
              <li>All submissions will be evaluated solely on the basis of predefined qualitative and/or quantitative criteria, which may include relevance, quality, originality, and alignment with the Challenge objectives.</li>
              <li>Evaluation is conducted by the Organizer or a designated internal panel.</li>
              <li>No element of chance, randomness, or luck is involved in the evaluation or selection process.</li>
              <li>Participants are assessed independently, and rankings (if any) reflect relative performance against the evaluation criteria.</li>
            </ul>
          </section>

          {/* Section 6 */}
          <section>
            <h2 className="text-lg sm:text-xl font-bold text-black mb-3">6. Recognition and Professional Benefits</h2>
            <ul className="list-disc list-outside ml-6 space-y-2 mb-3">
              <li>The top-ranked participants may receive value-added professional benefits, such as complimentary consultations or service credits.</li>
              <li className="mb-2">
                These benefits:
                <ul className="ml-6 mt-2 space-y-1" style={{ listStyleType: 'circle' }}>
                  <li>Have no cash value;</li>
                  <li>Are non-transferable and non-redeemable for cash;</li>
                  <li>May only be used toward services offered by the Organizer; and</li>
                  <li>Are subject to availability and any additional service-specific terms.</li>
                </ul>
              </li>
            </ul>
            <p className="mb-0 font-medium">
              No monetary rewards, cash equivalents, or physical prizes are offered.
            </p>
          </section>

          {/* Section 7 */}
          <section>
            <h2 className="text-lg sm:text-xl font-bold text-black mb-3">7. Use of Submissions</h2>
            <p className="mb-0">
              By participating, participants grant the Organizer a non-exclusive, royalty-free right to review and internally use submitted materials solely for the purposes of evaluation, administration, and promotion of the Challenge, unless otherwise agreed in writing.
            </p>
          </section>

          {/* Section 8 */}
          <section>
            <h2 className="text-lg sm:text-xl font-bold text-black mb-3">8. Disqualification</h2>
            <p className="mb-3">
              The Organizer reserves the right to disqualify any participant who:
            </p>
            <ul className="list-disc list-outside ml-6 space-y-2">
              <li>Submits false or misleading information;</li>
              <li>Violates these Terms & Conditions; or</li>
              <li>Engages in behavior that compromises the integrity or objectives of the Challenge.</li>
            </ul>
          </section>

          {/* Section 9 */}
          <section>
            <h2 className="text-lg sm:text-xl font-bold text-black mb-3">9. Limitation of Liability</h2>
            <p className="mb-3">
              To the fullest extent permitted by law, the Organizer shall not be liable for:
            </p>
            <ul className="list-disc list-outside ml-6 space-y-2">
              <li>Technical issues affecting participation or submission;</li>
              <li>Any indirect, incidental, or consequential damages arising from participation; or</li>
              <li>Any inability of a participant to use the professional benefits offered.</li>
            </ul>
          </section>

          {/* Section 10 */}
          <section>
            <h2 className="text-lg sm:text-xl font-bold text-black mb-3">10. Compliance with Kuwaiti Law</h2>
            <p className="mb-2">
              This Challenge is conducted in accordance with applicable laws and regulations of the State of Kuwait.
            </p>
            <p className="mb-0">
              Nothing in these Terms & Conditions shall be construed as constituting gambling, gaming, or a game of chance.
            </p>
          </section>

          {/* Section 11 */}
          <section>
            <h2 className="text-lg sm:text-xl font-bold text-black mb-3">11. Amendments and Termination</h2>
            <p className="mb-0">
              The Organizer reserves the right to amend, suspend, or terminate the Challenge at any time for operational, legal, or regulatory reasons. Any updates will be published on the official Challenge webpage.
            </p>
          </section>

          {/* Section 12 */}
          <section>
            <h2 className="text-lg sm:text-xl font-bold text-black mb-3">12. Governing Law and Jurisdiction</h2>
            <p className="mb-0">
              These Terms & Conditions shall be governed by and construed in accordance with the laws of the State of Kuwait, and any disputes shall be subject to the exclusive jurisdiction of the competent courts of Kuwait.
            </p>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}

