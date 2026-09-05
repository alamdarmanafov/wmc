import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/components/landing/LegalPage";

export const metadata: Metadata = { title: "Community Guidelines" };

export default function GuidelinesPage() {
  return (
    <LegalPage
      title="Community Guidelines"
      intro="WMC works because people show up with good intentions. These guidelines keep it that way."
      updated="4 September 2026"
    >
      <LegalSection title="Respect everyone">
        <p>
          Treat members the way you would want to be treated at a community gathering. Different schools, cultures and
          levels of practice are all welcome.
        </p>
      </LegalSection>
      <LegalSection title="No harassment">
        <p>
          No bullying, intimidation, unwanted repeated contact or sharing someone’s private information. If someone asks
          you to stop, stop.
        </p>
      </LegalSection>
      <LegalSection title="Not a dating app">
        <p>
          Flirting, romantic solicitation and marriage proposals are not what WMC is for. Accounts using the app for
          dating are removed.
        </p>
      </LegalSection>
      <LegalSection title="No hate speech">
        <p>
          No content that attacks people based on religion, sect, ethnicity, nationality, gender, disability or any other
          part of who they are.
        </p>
      </LegalSection>
      <LegalSection title="Be genuine">
        <p>Use your real first name and a real photo of yourself. No fake profiles, spam or commercial solicitation.</p>
      </LegalSection>
      <LegalSection title="Report and block">
        <p>
          Every profile, community, event and message has Report and Block. Blocking is instant and invisible to the
          other person. Every report is reviewed by a human moderator.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
