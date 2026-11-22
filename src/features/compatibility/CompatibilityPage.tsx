/**
 * Parked while Compatibility is unfinished (features.compatibility = false).
 * To bring it back: set features.compatibility to true in src/lib/site.ts and
 * create src/app/compatibility/page.tsx containing:
 *   export { default, metadata } from "@/features/compatibility/CompatibilityPage";
 */
import type { Metadata } from "next";
import { OpeningSoon } from "@/components/OpeningSoon";

export const metadata: Metadata = {
  title: "Compatibility",
  description: "Check your zodiac compatibility with Sabrina. Scores are for entertainment only.",
};

export default function CompatibilityPage() {
  return (
    <OpeningSoon
      title="Compatibility"
      sabrina="I'm still reading your situationship's chart. It's a lot."
    >
      <p>
        Add two birthdays and the kind of relationship it is, and Sabrina reports on your chemistry,
        communication, emotional chaos and red flags, then gives her final verdict.
      </p>
      <p>
        Compatibility is for people aged 16 and over, and both birthdays need to show that. The score is made up for fun. It isn&rsquo;t a scientific prediction, and nothing you enter is stored.
      </p>
    </OpeningSoon>
  );
}
