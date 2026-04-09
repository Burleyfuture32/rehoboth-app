"use client";

import Link from "next/link";
import { useState } from "react";
import {
  getPortalAssistantReply,
  portalAssistantSuggestedQuestions,
  type PortalAssistantReply,
} from "@/lib/portal-assistant";

type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  text: string;
  routeHints?: PortalAssistantReply["routeHints"];
};

const starterMessage: ChatMessage = {
  id: "intro",
  role: "assistant",
  text:
    "I am the client portal helper. Ask about document uploads, milestones, status, or what happens next on your file.",
  routeHints: [{ href: "/portal", label: "Portal home" }],
};

export function PortalAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([starterMessage]);

  function ask(question: string) {
    const trimmed = question.trim();

    if (!trimmed) {
      return;
    }

    const reply = getPortalAssistantReply(trimmed);

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
        className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-[0_18px_50px_rgba(15,23,17,0.24)] transition hover:bg-slate-700"
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/12 text-base">
          ?
        </span>
        Client Help
      </button>

      {isOpen ? (
        <section className="fixed bottom-24 right-5 z-40 flex h-[min(620px,calc(100vh-8rem))] w-[min(360px,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-[color:var(--surface)] shadow-[0_24px_60px_rgba(16,24,18,0.18)]">
          <div
            className="border-b border-slate-200 px-5 py-4"
            style={{ background: "var(--portal-assistant-header-bg)" }}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Portal support
                </p>
                <h2 className="mt-1 text-lg font-semibold text-slate-950">
                  Client chatbot
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Fast help for uploads, status, and next steps.
                </p>
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
                  {message.role === "assistant" ? "Client Help" : "You"}
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
              {portalAssistantSuggestedQuestions.map((question) => (
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
                placeholder="Ask about uploads, milestones, file status, or next steps."
                value={draft}
              />
              <button
                className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700"
                type="submit"
              >
                Ask client help
              </button>
            </form>
          </div>
        </section>
      ) : null}
    </>
  );
}
