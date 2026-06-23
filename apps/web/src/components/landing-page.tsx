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
        <ShowcaseSection />
        <RepositoryReviewSection />
        <LearningDashboardSection />
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
// 4. INTERACTIVE PRODUCT PREVIEW (SHOWCASE)
// ==========================================
const INTRO_CODE = `// Buggy React calculation hook
export function useCalculations(data) {
  const [result, setResult] = useState(0);

  useEffect(() => {
    // CRITICAL: Potential infinite loop - direct reference
    let val = 0;
    for (let i = 0; i < data.values.length; i++) {
       val += data.values[i];
    }
    setResult(val);
  }, [data]); // Object reference resets every render!

  return result;
}`;

const SOLVED_CODE = `// Optimized & safe implementation with useMemo
import { useMemo } from 'react';

export function useCalculations(data) {
  // Resolved memory leaks, infinite rendering, and reference glitches
  return useMemo(() => {
    if (!data?.values) return 0;
    return data.values.reduce((acc, val) => acc + val, 0);
  }, [data?.values]); // Stabilized simple primitive dependency tracking
}`;

export function ShowcaseSection() {
  const [code, setCode] = useState(INTRO_CODE);
  const [streamProgress, setStreamProgress] = useState(0); // 0: idle, 1: scanning, 2: issues_found, 3: completed
  const [acceptedIssues, setAcceptedIssues] = useState<number[]>([]);
  const [customMessage, setCustomMessage] = useState("");
  const [chatLog, setChatLog] = useState<{sender: 'user' | 'mentor', text: string}[]>([
    { sender: 'mentor', text: "Hello! Welcome to your interactive CodeMentor mentor portal. Try hitting the 'Stream Review' button to detect static vulnerabilities and study recommended practices!" }
  ]);

  const runStreamReview = () => {
    if (streamProgress > 0) return;
    setStreamProgress(1);
    setChatLog(prev => [...prev, { sender: 'mentor', text: "Scanning code targets... Auditing lines 1-13." }]);
    
    setTimeout(() => {
      setStreamProgress(2);
      setChatLog(prev => [...prev, { sender: 'mentor', text: "Analyzed. I found a CRITICAL loop performance and reference integrity leak. Let's look at the suggestion." }]);
    }, 1800);
  };

  const handleApplyFix = () => {
    setCode(SOLVED_CODE);
    setStreamProgress(3);
    setAcceptedIssues([1]);
    setChatLog(prev => [...prev, { sender: 'mentor', text: "Excellent! You converted standard state-driven cycles to optimized inline memoization. This completely avoids infinite loop cycles caused by shallow prop checks!" }]);
  };

  const handleRejectFix = () => {
    setStreamProgress(0);
    setAcceptedIssues([]);
    setCode(INTRO_CODE);
    setChatLog(prev => [...prev, { sender: 'mentor', text: "Fix rejected. Remember, if 'data' prop changes identity layout (like an inline literal), useMemo safeguards dependencies." }]);
  };

  const handleSendMessage = (e: FormEvent) => {
    e.preventDefault();
    if (!customMessage.trim()) return;
    const userMsg = customMessage;
    setCustomMessage("");
    setChatLog(prev => [...prev, { sender: 'user', text: userMsg }]);

    setTimeout(() => {
      let replyText = "Interesting question. By declaring primitive sub-properties directly inside the dependency array sidebars, React executes strict triple-equals checks instead of rendering references.";
      if (userMsg.toLowerCase().includes("loop")) {
        replyText = "Yes! Because React triggers 'setResult' inside useEffect, which itself watches the state trigger 'data', standard re-renders cause a complete stack overflow loop.";
      } else if (userMsg.toLowerCase().includes("memo")) {
        replyText = "useMemo caches the final computation, executing it only when primitive properties change, saving CPU cycles entirely.";
      }
      setChatLog(prev => [...prev, { sender: 'mentor', text: replyText }]);
    }, 1000);
  };

  return (
    <section id="code-review-playground" className="py-32 relative scroll-mt-24">
      <div className="max-w-[1400px] mx-auto px-6">
        <div className="mb-16 max-w-3xl">
          <div className="text-blue-500 font-semibold mb-2 flex items-center gap-2">
            <Sparkles className="w-4 h-4" /> Live Interactive Preview
          </div>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tighter mb-6">Experience the review workflow</h2>
          <p className="text-xl text-neutral-400">Watch errors stream, check severity ratings, review recommendations, and discuss teaching solutions in real time.</p>
        </div>
        
        <div className="relative rounded-[2.5rem] border border-white/10 bg-[#070707] overflow-hidden min-h-[750px] p-6 lg:p-10 shadow-2xl">
          <Spotlight className="-top-40 left-0 md:left-60 md:-top-20" fill="white" />
          
          {/* Grid Background */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f1a_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f1a_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
          
          <div className="relative z-10 grid lg:grid-cols-12 gap-8 items-stretch h-full">
            {/* Left Column: Code Editor */}
            <div className="lg:col-span-7 bg-[#0b0b0c] rounded-2xl border border-white/5 overflow-hidden flex flex-col shadow-xl">
              <div className="flex items-center justify-between border-b border-white/5 px-4 py-3 bg-[#0d0d0f]">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/80" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                    <div className="w-3 h-3 rounded-full bg-green-500/80" />
                  </div>
                  <span className="ml-2 font-mono text-xs text-neutral-400">App.tsx - CodeMentor Playroom</span>
                </div>
                <div className="text-[10px] font-mono text-neutral-500 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                  UTF-8
                </div>
              </div>
              
              {/* Code TextArea / Presenter */}
              <div className="flex-1 p-6 font-mono text-sm leading-relaxed overflow-x-auto bg-[#09090a]">
                <pre className="text-neutral-300">
                  <code>{code}</code>
                </pre>
              </div>

              {/* Editor Controls */}
              <div className="p-4 border-t border-white/5 bg-[#0d0d0f] flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <button 
                    onClick={runStreamReview}
                    disabled={streamProgress > 0}
                    className={`px-4 py-2 rounded-lg font-medium text-xs flex items-center gap-2 transition-all duration-300 ${
                      streamProgress > 0 
                        ? 'bg-white/10 text-neutral-500 cursor-not-allowed'
                        : 'bg-white text-black hover:bg-neutral-200 hover:scale-[1.02]'
                    }`}
                  >
                    <Play className="w-3 h-3" />
                    Stream AI Review
                  </button>
                  <button 
                    onClick={() => {
                      setCode(INTRO_CODE);
                      setStreamProgress(0);
                      setAcceptedIssues([]);
                    }}
                    className="px-3 py-2 rounded-lg bg-white/5 text-neutral-300 hover:bg-white/10 text-xs transition-all"
                  >
                    Reset Code
                  </button>
                </div>
                
                {/* Streaming review status */}
                <span className="text-xs font-mono text-neutral-400">
                  {streamProgress === 0 && "Status: Ready to Stream"}
                  {streamProgress === 1 && "Status: Streaming diagnostics..."}
                  {streamProgress === 2 && "Status: 1 Issue identified!"}
                  {streamProgress === 3 && "Status: Corrected version loaded!"}
                </span>
              </div>
            </div>

            {/* Right Column: Issue cards / Chat reasoning */}
            <div className="lg:col-span-5 flex flex-col gap-6 justify-between">
              {/* Review Panel */}
              <div className="bg-[#0b0b0c] custom-card border border-white/5 rounded-2xl flex-1 flex flex-col overflow-hidden max-h-[480px]">
                <div className="border-b border-white/5 px-5 py-4 bg-[#0d0d0f] flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-300">Diagnostics Stream</span>
                  <span className="text-xs bg-red-400/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full font-mono">
                    {streamProgress >= 2 ? "1 Alert" : "0 Alerts"}
                  </span>
                </div>

                <div className="p-5 flex-1 overflow-y-auto space-y-4">
                  {streamProgress === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 subtle-glow">
                      <Terminal className="w-8 h-8 text-neutral-600 mb-3" />
                      <p className="text-sm text-neutral-400">Ready to audit code snippet assets.</p>
                      <p className="mt-1 max-w-[240px] text-xs text-neutral-600">Press Stream AI Review to load issues.</p>
                    </div>
                  )}

                  {streamProgress === 1 && (
                    <div className="space-y-3 animate-pulse">
                      <div className="h-5 bg-white/5 rounded w-1/3" />
                      <div className="h-4 bg-white/5 rounded w-2/3" />
                      <div className="h-20 bg-white/5 rounded w-full" />
                    </div>
                  )}

                  {streamProgress >= 2 && (
                    <AnimatePresence>
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-5 rounded-xl border border-red-500/15 bg-red-500/[0.02] flex flex-col gap-4 relative"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                            <h4 className="text-sm font-semibold text-white">Infinite Re-render Loop</h4>
                          </div>
                          {/* Severity badges */}
                          <span className="text-[10px] bg-red-500/10 text-red-400 border border-red-500/30 px-2 py-0.5 rounded font-mono font-bold">
                            CRITICAL
                          </span>
                        </div>
                        <p className="text-xs text-neutral-300 leading-relaxed">
                          Your <code className="bg-white/5 px-1 rounded text-red-300">useEffect</code> is bound to search dependencies using the non-memoized <code className="bg-white/5 px-1 rounded text-red-300">data</code> reference argument. Because <code className="bg-white/5 px-1 rounded text-red-300">data</code> undergoes reference updates on parent render cycles, this triggers constant re-evaluation loops.
                        </p>
                        
                        {/* Suggested fix preview */}
                        <div className="p-3 bg-black/60 rounded border border-white/5 font-mono text-[11px] text-neutral-400 leading-snug">
                          <span className="text-green-400">Recommendation</span><br/>
                          Cache computations using <code className="text-blue-300">useMemo</code> listening to primitive array length. Saves resources entirely.
                        </div>

                        {acceptedIssues.includes(1) ? (
                          <div className="text-xs text-green-400 flex items-center gap-1.5 font-medium">
                            <Check className="w-4 h-4" /> Applied successfully!
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                            <button 
                              onClick={handleApplyFix}
                              className="px-3 py-1.5 rounded bg-white text-black font-semibold text-xs hover:bg-neutral-200 transition-colors"
                            >
                              Accept Fix & Apply
                            </button>
                            <button 
                              onClick={handleRejectFix}
                              className="px-3 py-1.5 rounded bg-white/5 text-neutral-400 hover:bg-white/10 hover:text-white text-xs transition-colors"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </motion.div>
                    </AnimatePresence>
                  )}
                </div>
              </div>

              {/* Chat Reasoning pane */}
              <div className="bg-[#0b0b0c] border border-white/5 rounded-2xl p-5 flex flex-col gap-4 overflow-hidden h-[240px]">
                <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                  <MessageSquare className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-semibold text-neutral-300">Teaching Assistant reasoning</span>
                </div>
                
                <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
                  {chatLog.map((log, i) => (
                    <div key={i} className={`flex flex-col ${log.sender === 'user' ? 'items-end' : 'items-start'}`}>
                      <div className={`p-2.5 rounded-xl max-w-[85%] leading-relaxed ${
                        log.sender === 'user' 
                          ? 'bg-blue-600 text-white rounded-tr-none' 
                          : 'bg-white/5 text-neutral-300 rounded-tl-none'
                      }`}>
                        {log.text}
                      </div>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <input 
                    type="text"
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    placeholder="Ask follow-up questions..."
                    className="flex-1 bg-black rounded-lg border border-white/5 px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500/50"
                  />
                  <button 
                    type="submit"
                    className="bg-white/5 hover:bg-white/10 text-white text-xs px-3 rounded-lg transition-colors border border-white/10"
                  >
                    Send
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ==========================================
// 5. REPOSITORY REVIEW SECTION
// ==========================================
export function RepositoryReviewSection() {
  const [githubUrl, setGithubUrl] = useState("");
  const [scanProgress, setScanProgress] = useState(0); // 0: idle, 1: scanning, 2: scan_complete
  const [progressValue, setProgressValue] = useState(0);
  const [selectedFocus, setSelectedFocus] = useState<string[]>(["bugs", "security"]);
  const [scanLogs, setScanLogs] = useState<string[]>([]);

  const toggleFocus = (area: string) => {
    setSelectedFocus(prev => 
      prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area]
    );
  };

  const startRepositoryScan = (e: FormEvent) => {
    e.preventDefault();
    if (!githubUrl.trim() && scanProgress === 0) return;
    
    setScanProgress(1);
    setProgressValue(10);
    setScanLogs(["Connecting metadata credentials...", "Reading directories...", "Initializing scans..."]);
    
    const logs = [
      "Audited package-lock.json (Lockfile is production secure)",
      "Discovered 4 module source targets (.ts, TSX, JS)",
      "Analyzing focus target filters...",
      "Cognitive flow review successfully executed on 1,400 LOC",
      "Drafting markdown telemetry analysis summaries..."
    ];

    let step = 0;
    const interval = setInterval(() => {
      setProgressValue(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setScanProgress(2);
          return 100;
        }
        if (logs[step]) {
          setScanLogs(l => [...l, logs[step]]);
          step += 1;
        }
        return prev + 18;
      });
    }, 600);
  };

  return (
    <section id="repo-review" className="py-32 relative border-t border-white/5 bg-gradient-to-b from-[#050505] to-[#08080a]">
      <div className="max-w-[1400px] mx-auto px-6">
        <div className="mb-16 max-w-3xl">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tighter mb-6">Review complete projects</h2>
          <p className="text-xl text-neutral-400">
            Submit a public GitHub repository or upload a zip project.
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-12 items-start">
          {/* Left Side: Scan Form */}
          <div className="lg:col-span-5 bg-white/[0.01] border border-white/5 p-8 rounded-3xl backdrop-blur-xl flex flex-col gap-8 shadow-xl">
            <form onSubmit={startRepositoryScan} className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-neutral-300 flex items-center gap-2">
                  <Github className="w-4 h-4 text-neutral-400" />
                  GitHub Repository Link
                </label>
                <div className="relative">
                  <input 
                    type="url"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    placeholder="https://github.com/username/project"
                    className="w-full bg-black border border-white/5 hover:border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors"
                  />
                </div>
              </div>

              {/* Drag and Drop Zip option */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-neutral-300">Or drag & drop zip archive</label>
                <div className="border border-dashed border-white/10 hover:border-blue-500/30 rounded-xl p-8 text-center bg-black/40 hover:bg-black/60 transition-all cursor-pointer group flex flex-col items-center justify-center gap-2">
                  <Upload className="w-8 h-8 text-neutral-500 transition-all duration-300 group-hover:scale-110 group-hover:text-blue-400" />
                  <span className="text-xs font-semibold text-neutral-300">Upload a ZIP project</span>
                  <span className="text-[10px] text-neutral-500">Supports standard Web or Node targets</span>
                </div>
              </div>

              {/* Focus Areas */}
              <div className="flex flex-col gap-3">
                <span className="text-sm font-medium text-neutral-300">Focus Areas</span>
                <div className="flex flex-wrap gap-2">
                  {["bugs", "security", "performance", "architecture", "tests"].map((area) => (
                    <button
                      key={area}
                      type="button"
                      onClick={() => toggleFocus(area)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-medium border uppercase tracking-wider transition-all duration-200 ${
                        selectedFocus.includes(area)
                          ? 'bg-blue-500/10 text-blue-400 border-blue-500/30 font-semibold'
                          : 'bg-white/[0.02] text-neutral-400 border-white/5 hover:bg-white/[0.04]'
                      }`}
                    >
                      {area}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={scanProgress === 1}
                className="w-full bg-white hover:bg-neutral-200 text-black font-semibold py-3.5 px-4 rounded-xl transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] flex items-center justify-center gap-2 text-sm"
              >
                {scanProgress === 1 ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-black" />
                    Scanning Project Assets ({progressValue}%)
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 text-black" />
                    Scan Repository
                  </>
                )}
              </button>
            </form>

            {/* Simulated Live Scan Logs */}
            {scanProgress > 0 && (
              <div className="bg-black/60 rounded-xl p-4 border border-white/5 font-mono text-[11px] leading-relaxed text-neutral-400 h-[170px] overflow-y-auto">
                <div className="flex items-center gap-2 text-[10px] text-neutral-500 border-b border-white/5 pb-2 mb-2 font-bold uppercase tracking-wider">
                  <Terminal className="w-3.5 h-3.5 text-blue-500" /> System Logs Stream
                </div>
                <div className="space-y-1.5 scroll-smooth">
                  {scanLogs.map((log, index) => (
                    <div key={index} className="flex gap-2">
                      <span className="text-neutral-600 font-bold">&gt;</span>
                      <span>{log}</span>
                    </div>
                  ))}
                  {scanProgress === 1 && (
                    <div className="w-2.5 h-3.5 bg-blue-500 animate-pulse inline-block mt-0.5" />
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Side: Report Preview */}
          <div className="lg:col-span-7">
            {scanProgress < 2 ? (
              <div className="border border-white/5 bg-white/[0.01] rounded-3xl p-12 text-center h-full min-h-[460px] flex flex-col items-center justify-center gap-4">
                <Terminal className="w-12 h-12 text-neutral-700" />
                <h3 className="text-xl font-semibold text-neutral-300">Live Report Preview</h3>
                <p className="text-neutral-500 max-w-sm text-sm">Submit your public link or drag-and-drop file folders on the left panel to trigger your real-time teaching feedback report.</p>
              </div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-[#0b0b0c] border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
              >
                {/* Header */}
                <div className="border-b border-white/10 px-6 py-5 bg-[#0d0d0f] flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500" /> CodeMentor Telemetry Audit
                    </h3>
                    <p className="text-xs text-neutral-500 mt-0.5">Audited 4 source files, 2 target languages</p>
                  </div>
                  <button className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white font-medium rounded-lg text-xs flex items-center gap-2 border border-white/5 transition-all">
                    <Download className="w-3.5 h-3.5" /> Downloadable Fixes
                  </button>
                </div>

                {/* Dashboard body */}
                <div className="p-6 space-y-6">
                  {/* Stats blocks */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-white/[0.01] rounded-xl border border-white/5">
                      <span className="text-[10px] uppercase font-bold text-neutral-500 block mb-1">Languages</span>
                      <span className="text-sm font-semibold text-white">TS, TSX</span>
                    </div>
                    <div className="p-4 bg-white/[0.01] rounded-xl border border-white/5">
                      <span className="text-[10px] uppercase font-bold text-neutral-500 block mb-1">Files Scanned</span>
                      <span className="text-sm font-semibold text-white">4 Files</span>
                    </div>
                    <div className="p-4 bg-white/[0.01] rounded-xl border border-white/5">
                      <span className="text-[10px] uppercase font-bold text-neutral-500 block mb-1">Findings</span>
                      <span className="text-sm font-semibold text-red-400">3 Warning Alerts</span>
                    </div>
                    <div className="p-4 bg-white/[0.01] rounded-xl border border-white/5">
                      <span className="text-[10px] uppercase font-bold text-neutral-500 block mb-1">Avg Complexity</span>
                      <span className="text-sm font-semibold text-green-400">Low (4.2)</span>
                    </div>
                  </div>

                  {/* Findings items */}
                  <div className="space-y-4">
                    <span className="text-xs font-bold uppercase text-neutral-400 tracking-wider">Scanned Findings & Recommendations</span>
                    
                    {/* Item 1 */}
                    <div className="p-4 rounded-xl border border-red-500/10 bg-red-500/[0.01] flex items-start gap-4">
                      <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-xs font-bold text-red-400 bg-red-400/10 border border-red-400/20 px-2 py-0.5 rounded">HIGH SEVERITY</span>
                          <span className="text-xs font-semibold text-white">XSS Vulnerability in innerHTML output</span>
                        </div>
                        <p className="text-xs text-neutral-400 leading-relaxed max-w-xl">
                          In <code className="bg-white/5 px-1 rounded text-red-300">src/components/Report.tsx:24</code>: Direct variable assignments mapped directly inside innerHTML can invite execution injections.
                        </p>
                        <div className="mt-3 text-[11px] font-semibold text-green-400 flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5" /> Recommendation: Re-route contents using safe React properties (e.g. standard text nodes).
                        </div>
                      </div>
                    </div>

                    {/* Item 2 */}
                    <div className="p-4 rounded-xl border border-yellow-500/10 bg-yellow-500/[0.01] flex items-start gap-4">
                      <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-xs font-bold text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 px-2 py-0.5 rounded">MEDIUM SEVERITY</span>
                          <span className="text-xs font-semibold text-white">Unused variables leaving garbage footprint</span>
                        </div>
                        <p className="text-xs text-neutral-400 leading-relaxed max-w-xl">
                          In <code className="bg-white/5 px-1 rounded">src/utils/compiler.ts</code>: The variable clientContext is allocated memory layers but never accessed throughout runtime cycles.
                        </p>
                        <div className="mt-3 text-[11px] font-semibold text-green-400 flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5" /> Recommendation: Clean legacy assignments during compilation steps to preserve scope variables.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

// ==========================================
// 6. LEARNING DASHBOARD SECTION
// ==========================================
export function LearningDashboardSection() {
  const stats = [
    { label: "Total Reviews", value: "48", icon: Code },
    { label: "Accepted Fixes", value: "156", icon: Check },
    { label: "Issues Found", value: "320", icon: AlertTriangle },
    { label: "Clean Streak", value: "14 Days", icon: Sparkles }
  ];

  const recurringMistakes = [
    { title: "Infinite state triggers", frequency: "6 times", severity: "HIGH", tip: "Ensure dependency array parameters use memoized array primitives rather than literal object references." },
    { title: "Direct element injection (innerHTML)", frequency: "4 times", severity: "CRITICAL", tip: "Avoid assigning raw unsanitized API response markup. Use textContent fields wherever possible." },
    { title: "Redundant API refresh cycles", frequency: "3 times", severity: "MEDIUM", tip: "Lock effect states so triggers aren't fired on peripheral UI input alterations." }
  ];

  return (
    <section id="dashboard" className="py-32 relative border-t border-white/5 bg-[#050505]">
      <div className="max-w-[1400px] mx-auto px-6">
        <div className="mb-20 max-w-3xl">
          <div className="text-purple-500 font-semibold mb-2 flex items-center gap-2">
            <Award className="w-4 h-4" /> Academic Telemetry Analytics
          </div>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tighter mb-6">Track your coding progress</h2>
          <p className="text-xl text-neutral-400">Step away from boring standard logs. CodeMentor stores recurring errors and presents progress rewards to shape your skills over time.</p>
        </div>

        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* Main stats blocks */}
          <div className="lg:col-span-8 flex flex-col gap-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {stats.map((stat, idx) => (
                <div key={idx} className="p-6 bg-white/[0.01] border border-white/5 rounded-2xl flex flex-col gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                    <stat.icon className="w-5 h-5 text-neutral-300" />
                  </div>
                  <div>
                    <span className="text-xs text-neutral-400 font-medium">{stat.label}</span>
                    <span className="text-2xl font-bold text-white block mt-1">{stat.value}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Severity and recurring mistake logs */}
            <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-6">
              <span className="text-xs font-bold uppercase text-neutral-400 tracking-wider block mb-6">Recurring Mistakes Catalog</span>
              <div className="space-y-4">
                {recurringMistakes.map((mistake, index) => (
                  <div key={index} className="p-5 rounded-xl border border-white/5 bg-black/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded font-mono ${
                          mistake.severity === 'CRITICAL' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                          mistake.severity === 'HIGH' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                          'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
                        }`}>
                          {mistake.severity}
                        </span>
                        <h4 className="text-sm font-semibold text-white">{mistake.title}</h4>
                      </div>
                      <p className="text-xs text-neutral-400 max-w-xl">{mistake.tip}</p>
                    </div>
                    <span className="text-xs font-mono text-neutral-500 bg-white/5 px-2.5 py-1 rounded-full whitespace-nowrap self-start md:self-center">
                      Detected {mistake.frequency}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right sidebar: badge progress awards */}
          <div className="lg:col-span-4 bg-white/[0.01] border border-white/5 rounded-3xl p-6 flex flex-col gap-6">
            <div>
              <h3 className="mb-1 text-base font-bold text-white">Badge Progress & Rewards</h3>
              <p className="text-xs text-neutral-500">Collect awards automatically from review audits</p>
            </div>

            <div className="space-y-4">
              {/* Badge 1 */}
              <div className="p-4 bg-black/40 rounded-2xl border border-white/5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-500/10 text-green-400 flex items-center justify-center border border-green-500/20">
                  <Award className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">Security Sentinel</span>
                    <span className="text-[9px] bg-green-500/15 text-green-400 font-extrabold px-1.5 py-0.5 rounded">UNLOCKED</span>
                  </div>
                  <p className="text-[11px] text-neutral-500">Fixed 5 vulnerability elements in production blocks</p>
                </div>
              </div>

              {/* Badge 2 */}
              <div className="p-4 bg-black/40 rounded-2xl border border-white/5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
                  <Cpu className="w-6 h-6 animate-pulse" />
                </div>
                <div className="space-y-1 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-white">Performance Pro</span>
                    <span className="text-[10px] text-neutral-400 font-bold">85%</span>
                  </div>
                  <p className="text-[11px] text-neutral-500 mb-2">Resolve unoptimized calculation cycles</p>
                  {/* Progress bar */}
                  <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: '85%' }} />
                  </div>
                </div>
              </div>

              {/* Badge 3 */}
              <div className="p-4 bg-black/40 rounded-2xl border border-white/5 flex items-center gap-4 opacity-60">
                <div className="w-12 h-12 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center border border-orange-500/20">
                  <Shield className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">Lockdown Legend</span>
                    <span className="text-[10px] text-neutral-500 font-bold">MUTED</span>
                  </div>
                  <p className="text-[11px] text-neutral-500">Run safe audit loops on 15 repository clones</p>
                </div>
              </div>
            </div>
          </div>
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
