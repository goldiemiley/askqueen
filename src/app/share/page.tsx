import type { Metadata } from "next";
import { SharedResultView } from "@/features/share/SharedResultView";

export const metadata: Metadata = {
  title: "A reading from Sabrina",
  description: "Someone shared a reading from Sabrina on AskQueen. Get your own roast, song and answer.",
  robots: { index: false, follow: true },
};

export default function SharePage() {
  return <SharedResultView />;
}
