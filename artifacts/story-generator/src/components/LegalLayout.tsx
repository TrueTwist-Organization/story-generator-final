import React from "react";
import { ChevronLeft } from "lucide-react";
import { Link } from "wouter";
import { Footer } from "@/components/Footer";

interface LegalLayoutProps {
  title: string;
  children: React.ReactNode;
}

export function LegalLayout({ title, children }: LegalLayoutProps) {
  return (
    <div className="min-h-screen bg-[#050411] text-white/80 font-display">
      <div className="max-w-4xl mx-auto px-8 py-20">
        <Link href="/" className="inline-flex items-center gap-2 text-accent hover:text-white transition-all mb-12 group">
          <ChevronLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
          <span className="text-sm font-medium">Return Home</span>
        </Link>
        
        <h1 className="text-5xl font-display font-medium text-white mb-16 tracking-tight">
          {title}
        </h1>
        
        <div className="prose prose-invert prose-lg max-w-none text-white/60 leading-relaxed font-light space-y-8">
          {children}
        </div>
      </div>
      <Footer />
    </div>
  );
}
