import React from "react";
import { LegalLayout } from "@/components/LegalLayout";

export default function TermsOfService() {
  return (
    <LegalLayout title="Terms of Service">
      <section>
        <h2 className="text-2xl font-bold text-white mb-4">Acceptance</h2>
        <p>By accessing or using StoryWeaver AI, you confirm that you have read, understood, and agree to be bound by these Terms of Service. If you do not agree, please discontinue use immediately.</p>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-white mb-4">Content Rights</h2>
        <p>The stories, images, and narrations generated through our system are for personal, non-commercial use unless specified otherwise. We grant you a limited, non-exclusive license to use generated content within the scope of our platform.</p>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-white mb-4">User Conduct</h2>
        <p>You are solely responsible for the prompts you provide. You must not use our AI to generate harmful, illegal, or offensive content that violates the community standards or third-party intellectual property.</p>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-white mb-4">Liability</h2>
        <p>We provide our services "as is" and cannot guarantee the accuracy or appropriateness of AI-generated content. We are not liable for any direct or indirect damages resulting from the use of our generated stories.</p>
      </section>

      <section>
        <p className="text-xs text-white/20 uppercase tracking-widest pt-20 border-t border-white/10">Last updated: March 20, 2026</p>
      </section>
    </LegalLayout>
  );
}
