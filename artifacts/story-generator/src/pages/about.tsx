import React from "react";
import { LegalLayout } from "@/components/LegalLayout";

export default function AboutPage() {
  return (
    <LegalLayout title="About StoryWeaver AI">
      <section>
        <h2 className="text-2xl font-bold text-white mb-4">Our Mission</h2>
        <p>At StoryWeaver AI, we believe that everyone has a story to tell. Our mission is to democratize storytelling by providing powerful, intuitive AI tools that help children and adults alike bring their imagination to life.</p>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-white mb-4">Magic in Every Word</h2>
        <p>Our platform combines state-of-the-art Large Language Models with beautiful generative art and realistic text-to-speech technology. We don't just generate text; we weave an immersive experience that captures the heart and mind.</p>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-white mb-4">Multilingual Storytelling</h2>
        <p>Imagination knows no borders. That's why StoryWeaver AI is built from the ground up to support multiple languages, including English, Hindi, and Gujarati, ensuring that magic is accessible to all.</p>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-white mb-4">Safe and Creative</h2>
        <p>We prioritize creating a safe, inspiring environment for creativity. Our AI is tuned to generate positive, engaging, and age-appropriate content for storytellers of all ages.</p>
      </section>

      <section>
        <p className="text-xs text-white/20 uppercase tracking-widest pt-20 border-t border-white/10">Version: 1.0.0 • Established 2026</p>
      </section>
    </LegalLayout>
  );
}
