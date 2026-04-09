"use client";

import Link from "next/link";
import { useState } from "react";
import { shortDate } from "@/lib/format";
import {
  getKnowledgeAssistantReply,
  knowledgeBaseResources,
  knowledgeBaseSuggestedQuestions,
  type KnowledgeAssistantReply,
  type KnowledgeDealContext,
  type KnowledgeHistoryEntry,
  type KnowledgeResourceKey,
} from "@/lib/knowledge-base";

type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  text: string;
  routeHints?: KnowledgeAssistantReply["routeHints"];
};

const starterMessage: ChatMessage = {
  id: "intro",
  role: "assistant",
  text:
    "I am the Rehoboth Knowledge Base assistant. Ask about loan scenarios, lender-fit questions, missing docs, closing pressure, submission readiness, or which internal resource to use next.",
  routeHints: [
    { href: "/ratesheets", label: "Ratesheets" },
    { href: "/documents", label: "Documents" },
    { href: "/capital-sources", label: "Capital Sources" },
  ],
};

export function KnowledgeBaseAssistant({
  initialKnowledgeHistory,
  selectedDeal,
}: {
  initialKnowledgeHistory: KnowledgeHistoryEntry[];
  selectedDeal?: KnowledgeDealContext | null;
}) {
  const [draft, setDraft] = useState("");
  const [selectedResource, setSelectedResource] =
    useState<KnowledgeResourceKey>("submission-summary");
  const [messages, setMessages] = useState<ChatMessage[]>([starterMessage]);
  const [knowledgeHistory, setKnowledgeHistory] =
    useState<KnowledgeHistoryEntry[]>(initialKnowledgeHistory);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [savedEntryCount, setSavedEntryCount] = useState(
    selectedDeal?.knowledgeEntriesCount ?? initialKnowledgeHistory.length,
  );

  async function ask(question: string) {
    const trimmed = question.trim();

    if (!trimmed) {
      return;
    }

    const reply = getKnowledgeAssistantReply(trimmed, {
      selectedDeal,
      selectedResource,
    });

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

    if (!selectedDeal) {
      setSaveStatus(null);
      return;
    }

    setSaveStatus("Saving this answer to the file knowledge history...");

    try {
      const response = await fetch("/api/knowledge-history", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dealId: selectedDeal.id,
          question: trimmed,
          answer: reply.answer,
          resourceKey: selectedResource,
        }),
      });

      const payload = (await response.json()) as {
        ok?: boolean;
        error?: string;
        entry?: KnowledgeHistoryEntry;
      };

      if (!response.ok || !payload.ok || !payload.entry) {
        setSaveStatus(payload.error ?? "Unable to save this knowledge note.");
        return;
      }

      setKnowledgeHistory((current) => [payload.entry!, ...current].slice(0, 10));
      setSavedEntryCount((current) => current + 1);
      setSaveStatus("Saved to this file's knowledge history.");
    } catch (error) {
      setSaveStatus(
        error instanceof Error ? error.message : "Unable to save this knowledge note.",
      );
    }
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <div className="rounded-[24px] border border-slate-200 bg-[linear-gradient(180deg,rgba(31,143,47,0.08),rgba(255,255,255,0.88))] p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          Ask anything
        </p>
        <h3 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
          Loan process and resource chat
        </h3>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Use this when you need a fast answer about a loan scenario or want to
          know which Rehoboth screen or resource should handle the next move.
        </p>

        {selectedDeal ? (
          <div className="mt-4 rounded-[20px] border border-slate-200 bg-white px-4 py-4 text-sm text-slate-700">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Active loan context
            </p>
            <p className="mt-2 font-semibold text-slate-950">
              {selectedDeal.borrowerName} | {selectedDeal.name}
            </p>
            <p className="mt-1">
              {selectedDeal.stage} | {selectedDeal.program} | {selectedDeal.market}
            </p>
            <p className="mt-2 text-slate-600">
              {selectedDeal.requestedDocumentsCount} requested docs |{" "}
              {selectedDeal.openTasksCount} open tasks |{" "}
              {selectedDeal.capitalSourcesCount} capital sources |{" "}
              {selectedDeal.trackerPercent}% tracker progress |{" "}
              {savedEntryCount} saved knowledge note
              {savedEntryCount === 1 ? "" : "s"}
            </p>
          </div>
        ) : null}

        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Resource lane
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {knowledgeBaseResources.map((resource) => {
              const isActive = resource.key === selectedResource;

              return (
                <button
                  key={resource.key}
                  className={`rounded-full border px-3 py-2 text-xs font-medium transition ${
                    isActive
                      ? "border-[var(--brand-green)] bg-[var(--brand-green)] text-white"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-100"
                  }`}
                  onClick={() => setSelectedResource(resource.key)}
                  type="button"
                >
                  {resource.title}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {knowledgeBaseSuggestedQuestions.map((question) => (
            <button
              key={question}
              className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
              onClick={() => {
                void ask(question);
              }}
              type="button"
            >
              {question}
            </button>
          ))}
        </div>

        <form
          className="mt-4 grid gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            void ask(draft);
          }}
        >
          <textarea
            className="min-h-28 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400"
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Ask about DSCR, bridge, refinance, lender fit, missing docs, title issues, closing pressure, submission readiness, or which resource to use."
            value={draft}
          />
          <button
            className="inline-flex items-center justify-center rounded-full bg-[var(--brand-green)] px-4 py-2.5 text-sm font-medium text-white shadow-[0_10px_24px_rgba(31,143,47,0.22)] transition hover:bg-[var(--brand-green-deep)]"
            type="submit"
          >
            Ask{" "}
            {knowledgeBaseResources.find((item) => item.key === selectedResource)
              ?.title ?? "knowledge base"}
          </button>
          {selectedDeal ? (
            <p className="text-xs text-slate-500">
              Each answer asked with a live file selected is saved into that loan&apos;s
              reusable knowledge history.
            </p>
          ) : null}
          {saveStatus ? <p className="text-xs text-slate-500">{saveStatus}</p> : null}
        </form>
      </div>

      <div className="grid gap-4">
        <div className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                File knowledge history
              </p>
              <h4 className="mt-2 text-lg font-semibold text-slate-950">
                Reusable Q&A notes for this loan
              </h4>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Each saved answer becomes internal memory for the file, so the next
                operator can reuse the reasoning.
              </p>
            </div>
            {selectedDeal ? (
              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                {knowledgeHistory.length} saved
              </span>
            ) : null}
          </div>

          <div className="mt-4 max-h-[280px] space-y-3 overflow-y-auto">
            {!selectedDeal ? (
              <div className="rounded-[20px] border border-dashed border-slate-200 bg-white/70 px-4 py-5 text-sm text-slate-500">
                Select a live file above to start building deal-specific knowledge.
              </div>
            ) : knowledgeHistory.length === 0 ? (
              <div className="rounded-[20px] border border-dashed border-slate-200 bg-white/70 px-4 py-5 text-sm text-slate-500">
                No reusable Q&A notes saved yet for this file.
              </div>
            ) : (
              knowledgeHistory.map((entry) => (
                <article
                  key={entry.id}
                  className="rounded-[20px] border border-slate-200 bg-white px-4 py-4"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                      {entry.resourceKey
                        ? knowledgeBaseResources.find(
                            (resource) => resource.key === entry.resourceKey,
                          )?.title ?? "Knowledge Base"
                        : "Knowledge Base"}
                    </span>
                    <span className="text-xs text-slate-500">
                      {entry.createdBy} | {shortDate(new Date(entry.createdAt))}
                    </span>
                  </div>
                  <p className="mt-3 text-sm font-semibold text-slate-950">
                    Q: {entry.question}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {entry.answer}
                  </p>
                </article>
              ))
            )}
          </div>
        </div>

        <div className="max-h-[360px] space-y-3 overflow-y-auto rounded-[24px] border border-slate-200 bg-slate-50/70 p-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`rounded-[22px] px-4 py-3 text-sm leading-6 ${
                message.role === "assistant"
                  ? "border border-slate-200 bg-white text-slate-700"
                  : "ml-10 bg-slate-900 text-white"
              }`}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.16em] opacity-70">
                {message.role === "assistant" ? "Knowledge Base" : "You"}
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
      </div>
    </div>
  );
}
