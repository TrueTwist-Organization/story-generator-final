import React from "react";
import { LegalLayout } from "@/components/LegalLayout";

export default function FAQPage() {
  return (
    <LegalLayout title="Frequently Asked Questions">
      <section>
        <h2 className="text-2xl font-bold text-white mb-4">How does StoryWeaver AI work?</h2>
        <p>StoryWeaver AI uses advanced large language models (LLMs) and generative art AI to turn your simple prompts into multi-scene stories with beautiful illustrations and realistic voice narration.</p>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-white mb-4">Which languages are supported?</h2>
        <p>Currently, we support English, Hindi, and Gujarati. You can generate stories, interactive games, and narration in all of these languages seamlessly.</p>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-white mb-4">Are the stories truly unique?</h2>
        <p>Yes! Every time you click "Conjure Story", our AI creates a fresh narrative and unique artwork based specifically on your protagonist's goal and selected theme.</p>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-white mb-4">Can I save or download my stories?</h2>
        <p>Currently, you can view your generated stories in the Viewer. We are working on a feature that will allow you to save your favorite adventures to your profile or export them as PDFs.</p>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-white mb-4">What are the "Experience Modes"?</h2>
        <p>We offer three ways to experience your story: **Story Book** (illustrated pages), **Cinematic** (auto-playing scenes with narration), and **Adventure** (an interactive game where you make choices).</p>
      </section>

      <section>
        <p className="text-xs text-white/20 uppercase tracking-widest pt-20 border-t border-white/10">Last updated: April 29, 2026</p>
      </section>
    </LegalLayout>
  );
}
