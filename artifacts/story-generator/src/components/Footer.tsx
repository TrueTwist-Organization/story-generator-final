import React from "react";
import { Link } from "wouter";
import { Shield, FileText, Info, Mail, Github, Twitter, Instagram } from "lucide-react";

export function Footer() {
  return (
    <footer className="relative z-10 w-full mt-20 border-t border-white/5 bg-black/40 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          
          {/* Brand Section */}
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-2 mb-6">
              <span className="text-3xl">🪄</span>
              <span className="text-2xl font-display font-medium text-white tracking-tight">StoryWeaver <span className="text-accent italic">AI</span></span>
            </div>
            <p className="text-white/40 text-sm leading-relaxed mb-8">
              Empowering creativity through the magic of Generative AI. We weave infinite worlds and endless possibilities into every word.
            </p>
            <div className="flex gap-4">
              <a href="#" className="p-2 rounded-lg bg-white/5 text-white/40 hover:text-accent hover:bg-white/10 transition-all">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="p-2 rounded-lg bg-white/5 text-white/40 hover:text-accent hover:bg-white/10 transition-all">
                <Github className="w-5 h-5" />
              </a>
              <a href="#" className="p-2 rounded-lg bg-white/5 text-white/40 hover:text-accent hover:bg-white/10 transition-all">
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Experience Section */}
          <div>
            <h4 className="text-white font-bold uppercase tracking-widest text-xs mb-8">Experience</h4>
            <ul className="space-y-4">
              <li><Link href="/" className="text-white/40 hover:text-white transition-colors text-sm">Story Library</Link></li>
              <li><Link href="/" className="text-white/40 hover:text-white transition-colors text-sm">Custom Maker</Link></li>
              <li><Link href="/" className="text-white/40 hover:text-white transition-colors text-sm">Voice Options</Link></li>
              <li><Link href="/" className="text-white/40 hover:text-white transition-colors text-sm">Community</Link></li>
            </ul>
          </div>

          {/* Legal Section */}
          <div>
            <h4 className="text-white font-bold uppercase tracking-widest text-xs mb-8">Legal Services</h4>
            <ul className="space-y-4">
              <li>
                <Link href="/privacy" className="flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm">
                  <Shield className="w-4 h-4" /> Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm">
                  <FileText className="w-4 h-4" /> Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm">
                  <Info className="w-4 h-4" /> Cookie Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Community Section */}
          <div>
            <h4 className="text-white font-bold uppercase tracking-widest text-xs mb-8">Support</h4>
            <ul className="space-y-4">
              <li>
                <a href="mailto:support@storyweaverai.com" className="flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm">
                  <Mail className="w-4 h-4" /> support@storyweaverai.com
                </a>
              </li>
              <li><Link href="/about" className="text-white/40 hover:text-white transition-colors text-sm">Our Mission</Link></li>
              <li><Link href="/faqs" className="text-white/40 hover:text-white transition-colors text-sm">Help Center (FAQs)</Link></li>
            </ul>
          </div>

        </div>

        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-white/20 text-xs">
            &copy; 2026 StoryWeaver AI. All rights reserved. Built with love in India.
          </p>
          <div className="flex gap-8">
            <span className="text-white/20 text-[10px] uppercase tracking-[0.3em]">SECURE SYSTEM</span>
            <span className="text-white/20 text-[10px] uppercase tracking-[0.3em]">AI VERIFIED CONTENT</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
