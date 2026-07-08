"use client";

import { motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { extractSnippet, normalizeSuggestedFix, type ReviewIssue } from "../lib/review";
import { DiffEditor } from "./monaco-shell";
import { SeverityBadge } from "./severity-badge";

export function IssueCard(props: {
  issue: ReviewIssue;
  sourceCode: string;
  language: string;
  active: boolean;
  isSaving?: boolean;
  decision?: "accepted" | "rejected";
  onAccept: (accepted: boolean) => void;
  onFocus: () => void;
}) {
  const accepted = props.decision === "accepted";
  const rejected = props.decision === "rejected";
  const suggestedFix = normalizeSuggestedFix(props.issue.suggestedFix);

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-[2rem] border p-5 shadow-2xl outline-none transition ${
        props.active
          ? "border-blue-500/35 bg-white/[0.06] shadow-[0_0_35px_rgba(59,130,246,0.12)]"
          : "border-white/10 bg-white/[0.025] hover:border-white/15 hover:bg-white/[0.04]"
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
              <p className="mt-2 text-sm uppercase tracking-[0.2em] text-neutral-500">
                {props.issue.category} - lines {props.issue.lineStart}-{props.issue.lineEnd}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={`inline-flex items-center justify-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${
                accepted
                  ? "border-white bg-white text-black"
                  : "border-blue-500/30 bg-blue-500/10 text-blue-300 hover:bg-blue-500/15"
              }`}
              onClick={() => props.onAccept(true)}
              disabled={props.isSaving || accepted}
            >
              <Check className="h-4 w-4" />
              {props.isSaving && !accepted ? "Saving..." : accepted ? "Accepted" : "Accept Fix"}
            </button>
            <button
              type="button"
              className={`inline-flex items-center justify-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${
                rejected
                  ? "border-white/20 bg-white/15 text-neutral-300"
                  : "border-white/15 bg-white/[0.04] text-neutral-100 hover:bg-white/[0.08]"
              }`}
              onClick={() => props.onAccept(false)}
              disabled={props.isSaving || rejected}
            >
              <X className="h-4 w-4" />
              {props.isSaving && !rejected ? "Saving..." : rejected ? "Rejected" : "Reject"}
            </button>
          </div>
        </div>

        <p className="max-w-3xl text-sm leading-7 text-neutral-300">{props.issue.explanation}</p>

        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#09090a]">
          <div className="flex flex-col gap-3 border-b border-white/10 bg-[#0d0d0f] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-green-500/80" />
              </div>
              <span className="font-mono text-xs text-neutral-400">Suggested diff</span>
            </div>
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-neutral-600">
              lines {props.issue.lineStart}-{props.issue.lineEnd}
            </span>
          </div>
          <DiffEditor
            height="320px"
            language={props.language}
            theme="vs-dark"
            original={extractSnippet(props.sourceCode, props.issue.lineStart, props.issue.lineEnd, 0)}
            modified={suggestedFix}
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
