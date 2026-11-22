import type { Metadata } from "next";
import { DailyExperience } from "@/features/daily/DailyExperience";

export const metadata: Metadata = {
  title: "Daily roast",
  description: "Your daily zodiac roast from Sabrina, with a song to match. For entertainment only.",
};

export default function DailyPage() {
  return <DailyExperience />;
}
