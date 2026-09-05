import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, LegalSection } from "@/components/landing/LegalPage";

export const metadata: Metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      intro="Short, readable terms for using WMC. By creating an account you agree to them."
      updated="4 September 2026"
    >
      <LegalSection title="Eligibility">
        <p>You must be at least 16 years old and provide accurate information about yourself.</p>
      </LegalSection>
      <LegalSection title="Your account">
        <p>
          You are responsible for what happens under your account. One account per person. Keep your login private and
          tell us if you think it has been compromised.
        </p>
      </LegalSection>
      <LegalSection title="Acceptable use">
        <p>
          WMC is a community and activities platform, not a dating service. Follow the{" "}
          <Link href="/guidelines" className="font-medium text-brand underline-offset-4 hover:underline">
            Community Guidelines
          </Link>
          . We may suspend or remove accounts that break them, without notice where safety requires it.
        </p>
      </LegalSection>
      <LegalSection title="Events and meetups">
        <p>
          Events are organised by members. Use common sense, meet in public places, and let someone know where you are.
          WMC is not responsible for what happens at in-person meetups.
        </p>
      </LegalSection>
      <LegalSection title="Content">
        <p>
          You own what you post and give WMC a licence to display it inside the app. We may remove content that breaks
          these terms or the law.
        </p>
      </LegalSection>
      <LegalSection title="Changes and termination">
        <p>
          You can leave at any time by deleting your account. We may update these terms and will notify you in the app
          about material changes.
        </p>
      </LegalSection>
      <LegalSection title="Contact">
        <p>legal@wmc.app</p>
      </LegalSection>
    </LegalPage>
  );
}
