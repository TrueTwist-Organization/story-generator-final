import React from "react";
import { LegalLayout } from "@/components/LegalLayout";

export default function PrivacyPolicy() {
  return (
    <LegalLayout title="Privacy Policy">
      <section>
        <h2 className="text-2xl font-bold text-white mb-4">Introduction</h2>
        <p>Your privacy is of paramount importance to us. This Privacy Policy outlines how StoryWeaver AI collects, uses, and safeguards your personal data when you interact with our AI-powered story generation platform.</p>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-white mb-4">Data Collection</h2>
        <p>We collect minimal data necessary for functionality, including story prompts, selected preferences (language, category, voice), and interaction timestamps. We do not store sensitive personal information without explicit consent.</p>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-white mb-4">AI Usage</h2>
        <p>Our platform utilizes third-party AI services (Gemini, OpenAI, ElevenLabs) to generate content. Prompts provided are processed by these services to create your stories, but we do not use your generated content to train our own models without permission.</p>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-white mb-4">Cookies</h2>
        <p>We use essential cookies to maintain your session and store your preferences across browser restarts. You can disable these in your browser, but some features may not work as intended.</p>
      </section>

      <section>
        <p className="text-xs text-white/20 uppercase tracking-widest pt-20 border-t border-white/10">Last updated: March 20, 2026</p>
      </section>
    </LegalLayout>
  );
}
