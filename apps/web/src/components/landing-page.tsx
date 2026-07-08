"use client";

import { useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Award,
  Brain,
  Check,
  CheckCircle,
  Code,
  Cpu,
  Download,
  Github,
  Globe,
  Layers,
  MessageSquare,
  Play,
  RefreshCw,
  Shield,
  Sparkles,
  Terminal,
  Upload,
  Zap
} from "lucide-react";
import { SplineScene } from "./ui/spline-scene";
import { Spotlight } from "./ui/spotlight";

export function LandingPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#050505] font-sans text-white selection:bg-blue-500/30">
      <main>
        <HeroSection />
        <SocialProofSection />
        <FeaturesSection />
        <HowItWorksSection />
        <CtaSection />
      </main>
    </div>
  );
}

// ==========================================
// 1. HERO SECTION
// ==========================================
export function HeroSection() {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-gradient-to-br from-blue-600/20 to-purple-600/10 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="relative z-10 mx-auto grid w-full max-w-[1400px] items-center gap-12 px-6 lg:grid-cols-2">
        <div className="flex min-w-0 flex-col items-start gap-7 py-12 lg:gap-8 lg:py-0">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-white/[0.08] to-white/[0.02] border border-white/[0.08] text-sm text-neutral-300 font-medium shadow-[0_0_15px_rgba(255,255,255,0.03)] backdrop-blur-md"
          >
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
            Code Review That Teaches
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="max-w-full bg-gradient-to-b from-white to-neutral-500 bg-clip-text text-[2.75rem] font-bold leading-[1.08] tracking-normal text-transparent sm:text-6xl lg:text-[5rem]"
          >
            Stream AI code reviews, apply fixes, and learn the why.
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="max-w-xl text-base leading-7 text-neutral-400 sm:text-lg sm:leading-relaxed"
          >
            CodeMentor AI helps developers paste code, receive live AI review issues, accept or reject fixes, generate corrected code, and chat through the reasoning.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex w-full flex-col items-center gap-4 sm:w-auto sm:flex-row"
          >
            <a href="/review/new" className="flex w-full items-center justify-center gap-2 rounded-full bg-white px-8 py-4 text-center font-medium text-black shadow-[0_0_20px_rgba(255,255,255,0.15)] transition-all duration-300 hover:scale-[1.03] hover:bg-neutral-100 hover:shadow-[0_0_30px_rgba(255,255,255,0.25)] sm:w-auto">
              Start a Review <ArrowRight className="w-4 h-4" />
            </a>
            <a href="/repo-review" className="flex w-full items-center justify-center gap-2 rounded-full border border-white/[0.15] bg-transparent px-8 py-4 text-center text-sm font-medium text-white transition-all duration-300 hover:border-white/30 hover:bg-white/[0.05] hover:shadow-[0_0_15px_rgba(255,255,255,0.05)] sm:w-auto">
              Review GitHub Repo
            </a>
          </motion.div>
        </div>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative hidden h-[520px] w-full overflow-hidden [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_75%)] lg:block lg:h-[800px]"
        >
          {/* <div className="absolute inset-[12%] rounded-[2rem] border border-white/10 bg-[#09090a]/80 p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex gap-2">
                <span className="h-3 w-3 rounded-full bg-red-500/80" />
                <span className="h-3 w-3 rounded-full bg-yellow-500/80" />
                <span className="h-3 w-3 rounded-full bg-green-500/80" />
              </div>
              <span className="font-mono text-xs text-neutral-500">Live Review</span>
            </div>
            <div className="space-y-4">
              <div className="h-5 w-2/3 rounded bg-white/10" />
              <div className="h-24 rounded-xl border border-red-500/20 bg-red-500/5 p-4">
                <div className="mb-3 h-3 w-28 rounded bg-red-400/40" />
                <div className="h-3 w-full rounded bg-white/10" />
                <div className="mt-2 h-3 w-4/5 rounded bg-white/10" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="h-24 rounded-xl border border-white/10 bg-white/[0.03]" />
                <div className="h-24 rounded-xl border border-blue-500/20 bg-blue-500/5" />
              </div>
            </div>
          </div> */}
          <SplineScene scene="https://prod.spline.design/0HFPXN14J7cahRGD/scene.splinecode" className="w-full h-full" />
        </motion.div>
      </div>
    </section>
  );
}

// ==========================================
// 2. SOCIAL PROOF SECTION
// ==========================================
export function SocialProofSection() {
  return (
    <section className="py-16 border-y border-white/5 bg-white/[0.01]">
      <div className="max-w-[1400px] mx-auto px-6">
        <p className="text-center text-sm text-neutral-500 font-medium mb-10 uppercase tracking-widest">
  Supports code reviews in
</p>
<div className="flex flex-wrap justify-center gap-10 md:gap-16 opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
  <div className="flex items-center gap-2 text-xl font-bold">
    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg" className="w-6 h-6" /> Python
  </div>
  <div className="flex items-center gap-2 text-xl font-bold">
    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg" className="w-6 h-6" /> JavaScript
  </div>
  <div className="flex items-center gap-2 text-xl font-bold">
    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg" className="w-6 h-6" /> TypeScript
  </div>
  <div className="flex items-center gap-2 text-xl font-bold">
    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/java/java-original.svg" className="w-6 h-6" /> Java
  </div>
  <div className="flex items-center gap-2 text-xl font-bold">
    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/cplusplus/cplusplus-original.svg" className="w-6 h-6" /> C++
  </div>
  <div className="flex items-center gap-2 text-xl font-bold">
    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/c/c-original.svg" className="w-6 h-6" /> C
  </div>
  <div className="flex items-center gap-2 text-xl font-bold">
    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/go/go-original-wordmark.svg" className="w-6 h-6" /> Go
  </div>
  <div className="flex items-center gap-2 text-xl font-bold">
    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/rust/rust-original.svg" className="w-6 h-6" /> Rust
  </div>
  <div className="flex items-center gap-2 text-xl font-bold">
    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/kotlin/kotlin-original.svg" className="w-6 h-6" /> Kotlin
  </div>
  <div className="flex items-center gap-2 text-xl font-bold">
    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/swift/swift-original.svg" className="w-6 h-6" /> Swift
  </div>
  <div className="flex items-center gap-2 text-xl font-bold">
    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/ruby/ruby-original.svg" className="w-6 h-6" /> Ruby
  </div>
  <div className="flex items-center gap-2 text-xl font-bold">
    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/php/php-original.svg" className="w-6 h-6" /> PHP
  </div>
</div>
      </div>
    </section>
  );
}

// ==========================================
// 3. FEATURES SECTION
// ==========================================
export function FeaturesSection() {
  const features = [
    { 
      icon: Activity, 
      title: "Live AI Review Stream", 
      desc: "Paste your code snippet or upload files to watch static and cognitive code issues highlight instantly, streaming results line-by-line." 
    },
    { 
      icon: Layers, 
      title: "Accept or Reject Fixes", 
      desc: "Take full control of your source file. Interactively review each diagnostic card and accept or reject suggested corrections inline." 
    },
    { 
      icon: Code, 
      title: "Generate Corrected Code", 
      desc: "Generate optimized, fully documented, and ready-to-run source blocks based on your exact specifications with single-click copying." 
    },
    { 
      icon: Brain, 
      title: "Ask Follow-up Questions", 
      desc: "Don't just fix, learn. Interactively chat through the critical computer science reasoning, performance trade-offs, and design patterns." 
    },
  ];

  return (
    <section className="py-32 relative border-t border-white/5 bg-gradient-to-b from-transparent to-white/[0.01]">
      <div className="max-w-[1400px] mx-auto px-6">
        <div className="mb-20 max-w-3xl">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tighter mb-6">Everything you need to review and learn</h2>
          <p className="text-xl text-neutral-400">Adopt modern static analysis and cognitive reasoning to elevate your coding standards without sacrificing velocity.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, idx) => (
            <div key={idx} className="p-8 rounded-3xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-white/10 transition-all duration-300 group">
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-gradient-to-tr group-hover:from-blue-500/10 group-hover:to-purple-500/10 group-hover:border-blue-500/30 transition-all duration-300">
                <feature.icon className="w-6 h-6 text-neutral-300 group-hover:text-blue-400 transition-colors" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-blue-100 transition-colors">{feature.title}</h3>
              <p className="text-neutral-400 leading-relaxed text-sm">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


// ==========================================
// 7. HOW IT WORKS SECTION
// ==========================================
export function HowItWorksSection() {
  const steps = [
    {
      num: "01",
      title: "Paste code or connect a repo",
      desc: "Instantly drop unoptimized snippets directly into the CodeMentor web interface, drag ZIP files, or link your public GitHub repositories with custom focus configuration tags."
    },
    {
      num: "02",
      title: "Watch issues stream in",
      desc: "Our high-speed cognitive modeling engine highlights logical, performance-related, or structural bottlenecks, streaming complete feedback cards right inside your portal."
    },
    {
      num: "03",
      title: "Apply fixes and learn",
      desc: "Review suggested alternative snippets on interactive side-by-side differentials, apply changes automatically, and ask follow-up questions to internalize code logic."
    }
  ];

  return (
    <section className="py-32 relative border-t border-white/5 bg-gradient-to-b from-[#050505] to-[#010101]">
      <div className="max-w-[1400px] mx-auto px-6">
        <div className="mb-20 text-center max-w-2xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tighter mb-4">How it works</h2>
          <p className="text-lg text-neutral-400">Watch CodeMentor AI teach you robust engineering paradigms on the fly.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 relative">
          {/* Connection Lines (Desktop-only) */}
          <div className="hidden md:block absolute top-12 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-blue-500/10 via-purple-500/20 to-blue-500/10 pointer-events-none" />

          {steps.map((step, idx) => (
            <div key={idx} className="p-8 rounded-3xl bg-white/[0.01] border border-white/5 flex flex-col gap-6 relative group hover:border-white/10 transition-colors">
              <span className="text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-b from-blue-500 to-transparent opacity-20 font-mono tracking-tight">
                {step.num}
              </span>
              <h3 className="text-xl font-bold text-white">{step.title}</h3>
              <p className="text-sm text-neutral-400 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ==========================================
// 8. FINAL CTA SECTION
// ==========================================
export function CtaSection() {
  return (
    <section className="py-32 relative overflow-hidden border-t border-white/5 bg-black">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-purple-600/5 blur-[150px] rounded-full max-w-4xl mx-auto pointer-events-none" />
      <div className="max-w-[1400px] mx-auto px-6 relative z-10 text-center">
        <h2 className="text-5xl md:text-7xl font-bold tracking-tighter mb-6 text-white leading-tight">
          Start reviewing code with CodeMentor AI.
        </h2>
        <p className="text-xl text-neutral-400 mb-10 max-w-2xl mx-auto">
          Paste your code snippets, accept safe, optimized corrections, and learn the best computer science reasoning today.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a href="/review/new" className="px-8 py-4 rounded-full bg-white text-black font-semibold hover:bg-neutral-100 transition-all duration-300 hover:scale-[1.03] shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:shadow-[0_0_30px_rgba(255,255,255,0.25)] text-sm">
            Start Reviewing Code
          </a>
        </div>
      </div>
    </section>
  );
}
