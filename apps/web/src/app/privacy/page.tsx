import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/components/landing/LegalPage";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      intro="WMC is built privacy-first. This page explains what we collect, why, and the choices you have."
      updated="4 September 2026"
    >
      <LegalSection title="What we collect">
        <p>
          Your account details (email, first name, age, optional photo, bio, profession, languages), the interests you
          pick, the communities and events you join, and the messages you send inside the app.
        </p>
      </LegalSection>
      <LegalSection title="Location">
        <p>
          We only ever show other members your <strong>city</strong> or a rough “near you” label. Your exact coordinates
          are stored privately, are never exposed through the app or its API, and are used only to compute that
          bucketed distance. You can switch location sharing to city-only or hide it entirely at any time.
        </p>
      </LegalSection>
      <LegalSection title="Where your data lives">
        <p>
          WMC runs on Supabase with data stored in the <strong>EU region</strong>. Data is encrypted in transit and at
          rest. We never sell your data and we do not show ads.
        </p>
      </LegalSection>
      <LegalSection title="Who can see what">
        <p>
          Active members can see your public profile (name, photo, age, city, interests, bio). Blocked members cannot
          see you at all. Moderators may review reported content to keep the community safe.
        </p>
      </LegalSection>
      <LegalSection title="Deletion">
        <p>
          You can delete your account from Settings, or email{" "}
          <a href="mailto:privacy@wmc.app" className="font-medium text-brand underline-offset-4 hover:underline">
            privacy@wmc.app
          </a>
          . Deletion removes your profile, memberships, messages and location data within 30 days.
        </p>
      </LegalSection>
      <LegalSection title="Contact">
        <p>Questions about privacy? Write to privacy@wmc.app and a human will answer.</p>
      </LegalSection>
    </LegalPage>
  );
}
