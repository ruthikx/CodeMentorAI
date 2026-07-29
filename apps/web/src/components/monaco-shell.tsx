"use client";

import dynamic from "next/dynamic";

function MonacoEditorSkeleton() {
  return (
    <div className="flex h-[68vh] min-h-[420px] flex-col bg-[#09090a]" aria-label="Loading code editor">
      <div className="flex h-9 items-center gap-2 border-b border-white/10 bg-[#0d0d0f] px-4">
        <div className="h-2 w-2 rounded-full bg-neutral-700" />
        <div className="h-2 w-2 rounded-full bg-neutral-700" />
        <div className="h-2 w-2 rounded-full bg-neutral-700" />
      </div>
      <div className="grid flex-1 grid-cols-[3rem_1fr] gap-4 p-4">
        <div className="space-y-3">
          {Array.from({ length: 14 }).map((_, index) => (
            <div key={index} className="ml-auto h-3 w-5 rounded bg-neutral-800" />
          ))}
        </div>
        <div className="space-y-3">
          {Array.from({ length: 14 }).map((_, index) => (
            <div
              key={index}
              className="h-3 rounded bg-neutral-800"
              style={{ width: `${index % 4 === 0 ? 62 : index % 3 === 0 ? 78 : 92}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function MonacoDiffSkeleton() {
  return (
    <div className="grid h-[320px] grid-cols-2 gap-px bg-white/10" aria-label="Loading diff editor">
      {[0, 1].map((pane) => (
        <div key={pane} className="grid grid-cols-[2.5rem_1fr] gap-3 bg-[#09090a] p-4">
          <div className="space-y-3">
            {Array.from({ length: 9 }).map((_, index) => (
              <div key={index} className="ml-auto h-3 w-4 rounded bg-neutral-800" />
            ))}
          </div>
          <div className="space-y-3">
            {Array.from({ length: 9 }).map((_, index) => (
              <div
                key={index}
                className="h-3 rounded bg-neutral-800"
                style={{ width: `${index % 4 === 0 ? 54 : index % 3 === 0 ? 72 : 88}%` }}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export const Editor = dynamic(() => import("@monaco-editor/react").then((mod) => mod.default), {
  ssr: false,
  loading: MonacoEditorSkeleton
});

export const DiffEditor = dynamic(
  () => import("@monaco-editor/react").then((mod) => mod.DiffEditor),
  {
    ssr: false,
    loading: MonacoDiffSkeleton
  }
);
