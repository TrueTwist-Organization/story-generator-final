import React from "react";
import { LegalLayout } from "@/components/LegalLayout";

export default function CookiesPolicy() {
  return (
    <LegalLayout title="Cookie Policy">
      <section>
        <h2 className="text-2xl font-bold text-white mb-4">What are Cookies?</h2>
        <p>Cookies are small text files stored on your device that help our website remember your settings and improve your overall experience.</p>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-white mb-4">How we use them</h2>
        <p>We use session cookies to keep you logged in and functional cookies to remember your chosen language (Hindi/Gujarati) and preferred narrator voice across visits.</p>
      </section>

      <section>
        <p className="text-xs text-white/20 uppercase tracking-widest pt-20 border-t border-white/10">Last updated: March 20, 2026</p>
      </section>
    </LegalLayout>
  );
}
