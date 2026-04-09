"use client";

import Link from "next/link";
import { useState } from "react";
import {
  expertSuggestedQuestions,
  getExpertReply,
  type ExpertReply,
} from "@/lib/rehoboth-expert";

type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  text: string;
  routeHints?: ExpertReply["routeHints"];
};

const starterMessage: ChatMessage = {
  id: "intro",
  role: "assistant",
  text:
    "I am The RehoBOT. Ask me where something lives in the app, what a screen does, or what the next step should be inside the Rehoboth workflow.",
  routeHints: [{ href: "/pipeline", label: "Open pipeline" }],
};

export function RehobothExpert({
  clientToolbarCompact = false,
}: {
  clientToolbarCompact?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([starterMessage]);
  const desktopRightClass = clientToolbarCompact
    ? "xl:right-[108px]"
    : "xl:right-[376px]";

  function ask(question: string) {
    const trimmed = question.trim();

    if (!trimmed) {
      return;
    }

    const reply = getExpertReply(trimmed);

    setMessages((current) => [
      ...current,
      {
        id: `user-${current.length + 1}`,
        role: "user",
        text: trimmed,
      },
      {
        id: `assistant-${current.length + 2}`,
        role: "assistant",
        text: reply.answer,
        routeHints: reply.routeHints,
      },
    ]);
    setDraft("");
    setIsOpen(true);
  }

  return (
    <>
      <button
        className={`fixed bottom-5 right-5 z-40 inline-flex items-center gap-3 rounded-full bg-[var(--brand-green)] px-4 py-3 text-sm font-semibold text-white shadow-[0_18px_50px_rgba(31,143,47,0.28)] transition hover:bg-[var(--brand-green-deep)] ${desktopRightClass}`}
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        <RehobothExpertAvatar />
        <span className="flex flex-col items-start leading-none">
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/70">
            AI Guide
          </span>
          <span className="mt-1">The RehoBOT</span>
        </span>
      </button>

      {isOpen ? (
        <section
          className={`fixed bottom-24 right-5 z-40 flex h-[min(640px,calc(100vh-8rem))] w-[min(380px,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-[28px] border border-[color:var(--border-soft)] bg-[color:var(--surface)] shadow-[0_24px_60px_rgba(16,24,18,0.18)] backdrop-blur ${desktopRightClass}`}
        >
          <div
            className="border-b border-slate-200 px-5 py-4"
            style={{ background: "var(--assistant-header-bg)" }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <RehobothExpertAvatar size="lg" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Local guide
                  </p>
                  <h2 className="mt-1 text-lg font-semibold text-slate-950">
                    The RehoBOT
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    Answers app workflow questions without leaving the demo.
                  </p>
                </div>
              </div>
              <button
                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 transition hover:bg-slate-100"
                onClick={() => setIsOpen(false)}
                type="button"
              >
                Close
              </button>
            </div>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`rounded-[22px] px-4 py-3 text-sm leading-6 ${
                  message.role === "assistant"
                    ? "border border-slate-200 bg-slate-50/80 text-slate-700"
                    : "ml-8 bg-[var(--brand-green)] text-white"
                }`}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.16em] opacity-70">
                  {message.role === "assistant" ? "The RehoBOT" : "You"}
                </p>
                <p className="mt-2">{message.text}</p>
                {message.routeHints?.length ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {message.routeHints.map((hint) => (
                      <Link
                        key={`${message.id}-${hint.href}`}
                        className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
                        href={hint.href}
                      >
                        {hint.label}
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>

          <div className="border-t border-slate-200 px-4 py-4">
            <div className="mb-3 flex flex-wrap gap-2">
              {expertSuggestedQuestions.map((question) => (
                <button
                  key={question}
                  className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
                  onClick={() => ask(question)}
                  type="button"
                >
                  {question}
                </button>
              ))}
            </div>
            <form
              className="grid gap-3"
              onSubmit={(event) => {
                event.preventDefault();
                ask(draft);
              }}
            >
              <textarea
                className="min-h-24 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400"
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Ask about a screen, stage, task flow, documents, lenders, ratesheets, or communications."
                value={draft}
              />
              <button
                className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700"
                type="submit"
              >
                Ask The RehoBOT
              </button>
            </form>
          </div>
        </section>
      ) : null}
    </>
  );
}

function RehobothExpertAvatar({ size = "sm" }: { size?: "sm" | "lg" }) {
  const sizeClass = size === "lg" ? "h-14 w-14" : "h-9 w-9";

  return (
    <span
      aria-hidden="true"
      className={`relative inline-flex ${sizeClass} shrink-0 items-center justify-center rounded-full ring-1 ring-black/5 shadow-[inset_0_1px_0_rgba(255,255,255,0.55),0_10px_24px_rgba(6,78,59,0.24)]`}
    >
      <span className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_28%_24%,#f0fdf4_0%,#bbf7d0_28%,#34d399_55%,#166534_82%,#052e16_100%)]" />
      <span className="absolute inset-[7%] rounded-full border border-white/20 bg-[radial-gradient(circle_at_30%_25%,rgba(255,255,255,0.52),rgba(255,255,255,0)_58%)]" />
      <span className="absolute right-[12%] top-[12%] h-[18%] w-[18%] rounded-full bg-white/85 shadow-[0_0_0_3px_rgba(110,231,183,0.18)]" />
      <span className="absolute top-[17%] h-[18%] w-[52%] rounded-full border border-white/30 bg-white/10" />
      <span className="absolute top-[23%] h-[34%] w-[34%] rounded-full bg-slate-50 shadow-[0_3px_9px_rgba(15,23,42,0.16)]" />
      <span className="absolute bottom-[20%] h-[26%] w-[56%] rounded-[999px_999px_72%_72%] bg-slate-100 shadow-[0_5px_12px_rgba(15,23,42,0.18)]" />
      <span className="absolute left-[36%] top-[33%] h-[6%] w-[6%] rounded-full bg-emerald-950" />
      <span className="absolute right-[36%] top-[33%] h-[6%] w-[6%] rounded-full bg-emerald-950" />
      <span className="absolute top-[41%] h-[10%] w-[18%] rounded-full border-b-2 border-emerald-950/80" />
      <span className="absolute left-[14%] top-[33%] h-[16%] w-[14%] rounded-full border-2 border-r-0 border-white/55" />
      <span className="absolute right-[14%] top-[33%] h-[16%] w-[14%] rounded-full border-2 border-l-0 border-white/55" />
    </span>
  );
}
