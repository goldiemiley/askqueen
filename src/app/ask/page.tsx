import type { Metadata } from "next";
import { AskExperience } from "@/features/ask/AskExperience";

export const metadata: Metadata = {
  title: "Ask Queen",
  description: "Ask Sabrina a question and get a straight answer. For entertainment only.",
};

export default function AskPage() {
  return <AskExperience />;
}
