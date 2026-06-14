"use client";

import { motion } from "framer-motion";
import { extractSnippet, type ReviewIssue } from "../lib/review";
import { DiffEditor } from "./monaco-shell";
import { SeverityBadge } from "./severity-badge";

export function IssueCard(props: {
  issue: ReviewIssue;
  sourceCode: string;
  language: string;
  active: boolean;
  onAccept: (accepted: boolean) => void;
  onFocus: () => void;
}) {
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-3xl border p-5 shadow-card transition ${
        props.active ? "border-signal.mint bg-white/10" : "border-white/10 bg-white/[0.04] hover:bg-white/[0.07]"
      }`}
      tabIndex={0}
      onFocus={props.onFocus}
      aria-label={`${props.issue.title} from line ${props.issue.lineStart} to ${props.issue.lineEnd}`}
    >
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <SeverityBadge severity={props.issue.severity} />
            <div>
              <h3 className="text-xl font-semibold text-white">{props.issue.title}</h3>
              <p className="mt-2 text-sm uppercase tracking-[0.2em] text-slate-400">
                {props.issue.category} · lines {props.issue.lineStart}-{props.issue.lineEnd}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              className="rounded-full border border-signal.mint/40 bg-signal.mint/10 px-4 py-2 text-sm font-medium text-signal.mint transition hover:bg-signal.mint/20"
              onClick={() => props.onAccept(true)}
            >
              Accept Fix
            </button>
            <button
              className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-slate-100 transition hover:bg-white/10"
              onClick={() => props.onAccept(false)}
            >
              Reject
            </button>
          </div>
        </div>

        <p className="max-w-3xl text-sm leading-7 text-slate-200">{props.issue.explanation}</p>

        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0b1220]">
          <DiffEditor
            height="320px"
            language={props.language}
            theme="vs-dark"
            original={extractSnippet(props.sourceCode, props.issue.lineStart, props.issue.lineEnd)}
            modified={props.issue.suggestedFix}
            options={{
              readOnly: true,
              renderSideBySide: true,
              minimap: { enabled: false },
              wordWrap: "on",
              automaticLayout: true
            }}
          />
        </div>
      </div>
    </motion.article>
  );
}
