"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { compactCurrency, currency, shortDate } from "@/lib/format";
import type { QuickAccessClientPayload } from "@/lib/clients";
import {
  defaultPinnedItems,
  maxPinnedItems,
  normalizePinHref,
  pinnedItemsStorageEvent,
  readStoredPins,
  writeStoredPins,
} from "@/lib/pinned-items";
import type { PinCategory, PinnedItem } from "@/lib/pinned-items";

const selectedClientStorageKey = "rehoboth.client-rail.selected.v1";

type ClientQuickAccessResponse = {
  clients: QuickAccessClientPayload[];
  defaultClientId: string | null;
};

type SaveClientResponse = {
  ok: boolean;
  error?: string;
  client?: QuickAccessClientPayload;
};

type ClientDraft = {
  name: string;
  entityType: string;
  experience: string;
  email: string;
  phone: string;
};

type PinDraft = {
  label: string;
  href: string;
  category: PinCategory;
  note: string;
};

const defaultPinDraft: PinDraft = {
  label: "",
  href: "",
  category: "CUSTOM",
  note: "",
};

const buildSuggestedPins = (
  client: QuickAccessClientPayload | null,
  currentScreenHref: string,
): PinnedItem[] => {
  const suggestions: PinnedItem[] = [
    {
      id: "pin-current-screen",
      label: "Current screen",
      href: currentScreenHref,
      category: "SCREEN",
      note: "Return to what you are working on now",
    },
    {
      id: "pin-clients",
      label: "Client roster",
      href: "/clients",
      category: "CLIENT",
      note: "Borrower and entity relationships",
    },
    {
      id: "pin-documents",
      label: "Document queue",
      href: "/documents",
      category: "QUEUE",
      note: "Requests and uploads",
    },
    {
      id: "pin-workflows",
      label: "Workflow launcher",
      href: "/workflows",
      category: "WORKFLOW",
      note: "Repeatable launch points",
    },
  ];

  if (client?.latestDeal) {
    suggestions.push(
      {
        id: `pin-workspace-${client.latestDeal.id}`,
        label: `${client.name} workspace`,
        href: `/deals/${client.latestDeal.id}`,
        category: "FILE",
        note: client.latestDeal.name,
      },
      {
        id: `pin-file-${client.latestDeal.id}`,
        label: "Client file",
        href: `/deals/${client.latestDeal.id}/file`,
        category: "FILE",
        note: "Deep-dive borrower and loan details",
      },
      {
        id: `pin-tracker-${client.latestDeal.id}`,
        label: "Status tracker",
        href: `/deals/${client.latestDeal.id}/status-tracker`,
        category: "TRACKER",
        note: "Closing path and handoff checkpoints",
      },
    );
  }

  return suggestions.filter(
    (item, index, items) =>
      items.findIndex(
        (candidate) =>
          candidate.href === item.href && candidate.label === item.label,
      ) === index,
  );
};

export function ClientQuickAccessToolbar({
  compact,
  onToggleCompact,
}: {
  compact: boolean;
  onToggleCompact: () => void;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [clients, setClients] = useState<QuickAccessClientPayload[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ClientDraft | null>(null);
  const [pinnedItems, setPinnedItems] = useState<PinnedItem[]>(defaultPinnedItems);
  const [pinDraft, setPinDraft] = useState<PinDraft>(defaultPinDraft);
  const [pinManagerOpen, setPinManagerOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const pinsHydratedRef = useRef(false);

  const selectedClient = useMemo(
    () => clients.find((client) => client.id === selectedClientId) ?? null,
    [clients, selectedClientId],
  );
  const currentScreenHref = useMemo(() => {
    const query = searchParams.toString();
    return query ? `${pathname}?${query}` : pathname;
  }, [pathname, searchParams]);
  const suggestedPins = useMemo(
    () => buildSuggestedPins(selectedClient, currentScreenHref),
    [selectedClient, currentScreenHref],
  );

  useEffect(() => {
    let ignore = false;

    async function loadClients() {
      try {
        const response = await fetch("/api/clients/quick-access", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Unable to load clients.");
        }

        const payload = (await response.json()) as ClientQuickAccessResponse;

        if (ignore) {
          return;
        }

        const storedClientId = readStoredClientId();
        const resolvedClientId =
          payload.clients.find((client) => client.id === storedClientId)?.id ??
          payload.defaultClientId;

        setClients(payload.clients);
        setSelectedClientId(resolvedClientId);
      } catch (error) {
        if (!ignore) {
          setErrorMessage(
            error instanceof Error ? error.message : "Unable to load clients.",
          );
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    void loadClients();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedClient) {
      setDraft(null);
      return;
    }

    setDraft(buildClientDraft(selectedClient));
  }, [selectedClient]);

  useEffect(() => {
    if (!selectedClientId) {
      return;
    }

    try {
      window.localStorage.setItem(selectedClientStorageKey, selectedClientId);
    } catch {}
  }, [selectedClientId]);

  useEffect(() => {
    let cancelled = false;

    queueMicrotask(() => {
      if (cancelled) {
        return;
      }

      const storedPins = readStoredPins();

      if (storedPins.length > 0) {
        setPinnedItems(storedPins);
      }

      pinsHydratedRef.current = true;
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!pinsHydratedRef.current) {
      return;
    }

    writeStoredPins(pinnedItems, false);
  }, [pinnedItems]);

  useEffect(() => {
    function handlePinsUpdated() {
      const storedPins = readStoredPins();
      setPinnedItems(storedPins.length > 0 ? storedPins : defaultPinnedItems);
    }

    window.addEventListener(pinnedItemsStorageEvent, handlePinsUpdated);
    return () => {
      window.removeEventListener(pinnedItemsStorageEvent, handlePinsUpdated);
    };
  }, []);

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedClient || !draft) {
      return;
    }

    setErrorMessage(null);
    setStatusMessage(null);

    startTransition(async () => {
      try {
        const response = await fetch("/api/clients/quick-access", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            borrowerId: selectedClient.id,
            ...draft,
          }),
        });
        const payload = (await response.json()) as SaveClientResponse;

        if (!response.ok || !payload.ok || !payload.client) {
          setErrorMessage(payload.error ?? "Unable to save client updates.");
          return;
        }

        const savedClient = payload.client;

        setClients((current) =>
          current.map((client) =>
            client.id === savedClient.id ? savedClient : client,
          ),
        );
        setStatusMessage("Client details saved.");
        setEditing(false);
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "Unable to save client updates.",
        );
      }
    });
  }

  function upsertPinnedItem(nextItem: PinnedItem) {
    setPinnedItems((current) => {
      const existing = current.filter(
        (item) =>
          item.href !== nextItem.href &&
          item.label.toLowerCase() !== nextItem.label.toLowerCase(),
      );

      return [nextItem, ...existing].slice(0, maxPinnedItems);
    });
  }

  function handleAddCustomPin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const href = normalizePinHref(pinDraft.href);
    const label = pinDraft.label.trim();

    if (!href || !label) {
      setErrorMessage("Pinned items need both a label and a destination.");
      return;
    }

    upsertPinnedItem({
      id: `pin-${Date.now()}`,
      label,
      href,
      category: pinDraft.category,
      note: pinDraft.note.trim() || undefined,
    });
    setPinDraft(defaultPinDraft);
    setPinManagerOpen(false);
    setErrorMessage(null);
    setStatusMessage("Pinned item added to quick manager.");
  }

  const expandedRail = (
    <ExpandedRail
      client={selectedClient}
      clients={clients}
      draft={draft}
      editing={editing}
      errorMessage={errorMessage}
      isPending={isPending}
      loading={loading}
      pinDraft={pinDraft}
      pinnedItems={pinnedItems}
      pinManagerOpen={pinManagerOpen}
      onCloseMobile={() => setMobileOpen(false)}
      onDraftChange={setDraft}
      onPinDraftChange={setPinDraft}
      onPinManagerToggle={() => {
        setPinManagerOpen((current) => !current);
        setErrorMessage(null);
      }}
      onAddCustomPin={handleAddCustomPin}
      onPinSuggestedItem={(item) => {
        upsertPinnedItem(item);
        setStatusMessage(`${item.label} pinned to quick manager.`);
      }}
      onRemovePinnedItem={(itemId) => {
        setPinnedItems((current) => current.filter((item) => item.id !== itemId));
      }}
      onSave={handleSave}
      onSelectClient={(nextClientId) => {
        setSelectedClientId(nextClientId);
        setEditing(false);
        setErrorMessage(null);
        setStatusMessage(null);
      }}
      onStartEditing={() => {
        setEditing((current) => !current);
        setErrorMessage(null);
        setStatusMessage(null);
      }}
      onToggleCompact={onToggleCompact}
      suggestedPins={suggestedPins}
      statusMessage={statusMessage}
    />
  );

  return (
    <>
      <button
        className="fixed right-4 top-4 z-40 inline-flex h-12 w-12 items-center justify-center rounded-full border border-[color:var(--border-soft)] bg-[color:var(--surface)] text-slate-700 shadow-[0_18px_50px_rgba(16,24,18,0.18)] transition hover:border-slate-300 hover:bg-white xl:hidden"
        onClick={() => setMobileOpen(true)}
        type="button"
      >
        <span className="sr-only">Open client quick access</span>
        <svg aria-hidden="true" fill="none" viewBox="0 0 24 24" className="h-5 w-5">
          <path
            d="M7.75 6.75H16.25M7.75 12H16.25M7.75 17.25H13.25M5.25 6.75H5.26M5.25 12H5.26M5.25 17.25H5.26"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.7"
          />
        </svg>
      </button>

      <aside
        className={`fixed right-5 top-5 bottom-5 z-30 hidden overflow-hidden border border-[color:var(--border-soft)] bg-[color:var(--surface)]/96 shadow-[0_28px_70px_rgba(16,24,18,0.18)] backdrop-blur xl:flex ${
          compact
            ? "w-[88px] min-w-[88px] rounded-[30px]"
            : "w-[368px] min-w-[368px] rounded-[34px]"
        }`}
      >
        {compact ? (
          <CompactRail
            client={selectedClient}
            loading={loading}
            onExpand={onToggleCompact}
            pinnedItems={pinnedItems}
          />
        ) : (
          expandedRail
        )}
      </aside>

      {mobileOpen ? (
        <>
          <button
            aria-label="Close client quick access"
            className="fixed inset-0 z-40 bg-slate-950/30 backdrop-blur-[1px] xl:hidden"
            onClick={() => setMobileOpen(false)}
            type="button"
          />
          <aside className="fixed inset-x-3 top-16 bottom-3 z-50 overflow-hidden rounded-[32px] border border-[color:var(--border-soft)] bg-[color:var(--surface)] shadow-[0_28px_70px_rgba(16,24,18,0.22)] xl:hidden">
            <ExpandedRail
              client={selectedClient}
              clients={clients}
              draft={draft}
              editing={editing}
              errorMessage={errorMessage}
              isPending={isPending}
              loading={loading}
              pinDraft={pinDraft}
              pinnedItems={pinnedItems}
              pinManagerOpen={pinManagerOpen}
              onCloseMobile={() => setMobileOpen(false)}
              onDraftChange={setDraft}
              onPinDraftChange={setPinDraft}
              onPinManagerToggle={() => {
                setPinManagerOpen((current) => !current);
                setErrorMessage(null);
              }}
              onAddCustomPin={handleAddCustomPin}
              onPinSuggestedItem={(item) => {
                upsertPinnedItem(item);
                setStatusMessage(`${item.label} pinned to quick manager.`);
              }}
              onRemovePinnedItem={(itemId) => {
                setPinnedItems((current) => current.filter((item) => item.id !== itemId));
              }}
              onSave={handleSave}
              onSelectClient={(nextClientId) => {
                setSelectedClientId(nextClientId);
                setEditing(false);
                setErrorMessage(null);
                setStatusMessage(null);
              }}
              onStartEditing={() => {
                setEditing((current) => !current);
                setErrorMessage(null);
                setStatusMessage(null);
              }}
              onToggleCompact={onToggleCompact}
              suggestedPins={suggestedPins}
              showCompactToggle={false}
              statusMessage={statusMessage}
            />
          </aside>
        </>
      ) : null}
    </>
  );
}

function CompactRail({
  client,
  loading,
  onExpand,
  pinnedItems,
}: {
  client: QuickAccessClientPayload | null;
  loading: boolean;
  onExpand: () => void;
  pinnedItems: PinnedItem[];
}) {
  return (
    <div className="flex h-full w-full flex-col items-center gap-4 px-3 py-4">
      <button
        className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50"
        onClick={onExpand}
        type="button"
      >
        <span className="sr-only">Expand client quick access</span>
        <svg aria-hidden="true" fill="none" viewBox="0 0 24 24" className="h-5 w-5">
          <path
            d="M9.75 5.75L16.25 12L9.75 18.25"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.7"
          />
        </svg>
      </button>

      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-[24px] bg-[linear-gradient(180deg,rgba(31,143,47,0.16),rgba(255,255,255,0.95))] text-lg font-semibold text-slate-900">
          {loading ? "..." : getClientInitials(client?.name)}
        </div>
        <div className="rounded-[24px] border border-slate-200 bg-white px-3 py-2 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Open
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-950">
            {client ? client.openTasks + client.pendingDocuments : 0}
          </p>
        </div>
        <div className="flex flex-col items-center gap-2">
          {pinnedItems.slice(0, 3).map((item) => (
            <Link
              key={item.id}
              aria-label={item.label}
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50"
              href={item.href}
              title={item.label}
            >
              <span className="text-xs font-semibold text-slate-500">
                {getPinGlyph(item.category)}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function ExpandedRail({
  client,
  clients,
  draft,
  editing,
  errorMessage,
  isPending,
  loading,
  pinDraft,
  pinnedItems,
  pinManagerOpen,
  onCloseMobile,
  onDraftChange,
  onPinDraftChange,
  onPinManagerToggle,
  onAddCustomPin,
  onPinSuggestedItem,
  onRemovePinnedItem,
  onSave,
  onSelectClient,
  onStartEditing,
  onToggleCompact,
  suggestedPins,
  showCompactToggle = true,
  statusMessage,
}: {
  client: QuickAccessClientPayload | null;
  clients: QuickAccessClientPayload[];
  draft: ClientDraft | null;
  editing: boolean;
  errorMessage: string | null;
  isPending: boolean;
  loading: boolean;
  pinDraft: PinDraft;
  pinnedItems: PinnedItem[];
  pinManagerOpen: boolean;
  onCloseMobile: () => void;
  onDraftChange: (draft: ClientDraft | null) => void;
  onPinDraftChange: (draft: PinDraft) => void;
  onPinManagerToggle: () => void;
  onAddCustomPin: (event: FormEvent<HTMLFormElement>) => void;
  onPinSuggestedItem: (item: PinnedItem) => void;
  onRemovePinnedItem: (itemId: string) => void;
  onSave: (event: FormEvent<HTMLFormElement>) => void;
  onSelectClient: (clientId: string) => void;
  onStartEditing: () => void;
  onToggleCompact: () => void;
  suggestedPins: PinnedItem[];
  showCompactToggle?: boolean;
  statusMessage: string | null;
}) {
  return (
    <div className="flex h-full w-full min-w-0 flex-col">
      <div className="border-b border-white/10 bg-[linear-gradient(180deg,rgba(11,16,13,0.82)_0%,rgba(39,51,44,0.54)_46%,rgba(226,232,228,0.22)_100%)] px-5 py-5 backdrop-blur-2xl">
        <div className="flex flex-col gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/58">
              Client rail
            </p>
            <h2 className="mt-1 text-xl font-semibold tracking-[-0.04em] text-white">
              {client?.name ?? "Quick access"}
            </h2>
            <p className="mt-1 text-sm leading-6 text-white/62">
              Pinned relationship details, live exposure, and inline edits from any
              screen.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {showCompactToggle ? (
              <button
                aria-label="Compact client rail"
                className="hidden h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-[rgba(18,24,20,0.64)] text-white/78 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur transition hover:border-white/16 hover:bg-[rgba(28,36,31,0.78)] xl:inline-flex"
                onClick={onToggleCompact}
                title="Compact client rail"
                type="button"
              >
                <span className="sr-only">Compact client rail</span>
                <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <path
                    d="M14.25 6.75L8.75 12L14.25 17.25M17.75 6.75H18.25M17.75 12H18.25M17.75 17.25H18.25"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.7"
                  />
                </svg>
              </button>
            ) : null}
            <button
              className="inline-flex rounded-full border border-white/10 bg-[rgba(18,24,20,0.64)] px-3 py-2 text-xs font-semibold text-white/78 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur transition hover:border-white/16 hover:bg-[rgba(28,36,31,0.78)] xl:hidden"
              onClick={onCloseMobile}
              type="button"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-[linear-gradient(180deg,rgba(7,12,9,0.14),rgba(255,255,255,0.02)_16%,rgba(255,255,255,0)_100%)] px-5 py-5">
        {loading ? <LoadingState /> : null}

        {!loading && !client ? (
          <div className="rounded-[24px] border border-dashed border-white/12 bg-[rgba(255,255,255,0.1)] px-4 py-8 text-sm leading-6 text-white/58 backdrop-blur-xl">
            No borrower records are available yet. Create a lead and this rail will
            pin that client automatically.
          </div>
        ) : null}

        {!loading && client ? (
          <div className="space-y-5">
            <section className="rounded-[26px] border border-white/18 bg-[linear-gradient(180deg,rgba(255,255,255,0.3),rgba(214,222,217,0.18))] p-4 shadow-[0_24px_48px_rgba(8,12,9,0.18)] backdrop-blur-2xl">
              <label className="block">
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#bfd8c6]">
                  Pinned client
                </span>
                <select
                  className="mt-2 w-full rounded-[18px] border border-white/10 bg-[rgba(49,58,53,0.9)] px-4 py-3 text-sm font-medium text-white outline-none transition focus:border-emerald-400"
                  onChange={(event) => onSelectClient(event.target.value)}
                  value={client.id}
                >
                  {clients.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name} | {option.entityType} | {option.openTasks} tasks |{" "}
                      {option.pendingDocuments} docs
                    </option>
                  ))}
                </select>
              </label>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full bg-[rgba(162,232,196,0.82)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#f3fff7]">
                  {client.entityType}
                </span>
                {client.latestDeal ? (
                  <span className="rounded-full bg-[rgba(56,64,59,0.88)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-white/70">
                    {formatStage(client.latestDeal.stage)}
                  </span>
                ) : null}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <MetricTile label="Exposure" value={compactCurrency(client.totalVolume)} />
                <MetricTile label="Live deals" value={`${client.totalDeals}`} />
                <MetricTile label="Open tasks" value={`${client.openTasks}`} />
                <MetricTile
                  label="Pending docs"
                  value={`${client.pendingDocuments}`}
                />
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {client.latestDeal ? (
                  <>
                    <ActionChip href={`/deals/${client.latestDeal.id}`}>
                      Open workspace
                    </ActionChip>
                    <ActionChip href={`/deals/${client.latestDeal.id}/file`}>
                      Open client file
                    </ActionChip>
                    <ActionChip href={`/deals/${client.latestDeal.id}/communications`}>
                      Open communications
                    </ActionChip>
                  </>
                ) : null}
                <ActionChip href="/clients">View roster</ActionChip>
              </div>
            </section>

            <section className="rounded-[26px] border border-white/18 bg-[linear-gradient(180deg,rgba(255,255,255,0.28),rgba(214,222,217,0.16))] p-4 shadow-[0_24px_48px_rgba(8,12,9,0.18)] backdrop-blur-2xl">
              <div className="flex flex-col gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white/88">Pinned quick manager</p>
                  <p className="mt-1 text-xs leading-5 text-white/58">
                    Save the routes and working surfaces you want one click away:
                    clients, files, trackers, workflows, queues, or custom links.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[rgba(56,64,59,0.88)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-white/70">
                    {pinnedItems.length} pinned
                  </span>
                  <button
                    aria-label={pinManagerOpen ? "Close pin manager" : "Open pin manager"}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-[rgba(22,30,25,0.72)] text-white/78 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur transition hover:border-white/16 hover:bg-[rgba(32,40,35,0.84)]"
                    onClick={onPinManagerToggle}
                    title={pinManagerOpen ? "Close pin manager" : "Open pin manager"}
                    type="button"
                  >
                    <span className="sr-only">
                      {pinManagerOpen ? "Close pin manager" : "Open pin manager"}
                    </span>
                    {pinManagerOpen ? (
                      <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <path
                          d="M7 7L17 17M17 7L7 17"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.7"
                        />
                      </svg>
                    ) : (
                      <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <path
                          d="M8.5 4.75H15.5L17.75 10.25L13.5 12.75V18.25L10.5 16.25V12.75L6.25 10.25L8.5 4.75Z"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.6"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {pinnedItems.length === 0 ? (
                  <div className="rounded-[20px] border border-dashed border-white/12 bg-[rgba(255,255,255,0.1)] px-4 py-6 text-sm text-white/58 backdrop-blur-xl">
                    No pinned items yet. Use the suggestions below or add a custom pin.
                  </div>
                ) : (
                  pinnedItems.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-[20px] border border-white/10 bg-[rgba(60,70,64,0.82)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-xl"
                    >
                      <div className="flex flex-col gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-[rgba(15,22,17,0.8)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#c6d0ca]">
                              {item.category}
                            </span>
                            {item.note ? (
                              <span className="text-xs text-white/58">{item.note}</span>
                            ) : null}
                          </div>
                          <p className="mt-2 break-words text-sm font-semibold text-white">
                            {item.label}
                          </p>
                          <p className="mt-1 break-all text-xs text-white/55">
                            {item.href}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            className="inline-flex items-center justify-center rounded-full border border-white/10 bg-[rgba(20,27,22,0.78)] px-3 py-2 text-xs font-medium text-white/80 transition hover:border-white/16 hover:bg-[rgba(30,38,33,0.88)]"
                            href={item.href}
                          >
                            Open
                          </Link>
                          <button
                            className="inline-flex items-center justify-center rounded-full border border-white/10 bg-[rgba(20,27,22,0.78)] px-3 py-2 text-xs font-medium text-white/80 transition hover:border-rose-200/40 hover:bg-[rgba(88,29,29,0.55)] hover:text-rose-100"
                            onClick={() => onRemovePinnedItem(item.id)}
                            type="button"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-4 rounded-[22px] border border-white/10 bg-[rgba(245,248,246,0.16)] p-4 backdrop-blur-xl">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/56">
                  Suggested pins
                </p>
                <div className="mt-3 grid gap-3">
                  {suggestedPins.map((item) => {
                    const isPinned = pinnedItems.some((pinned) => pinned.href === item.href);

                    return (
                      <div
                        key={item.id}
                        className="flex flex-col gap-3 rounded-[18px] border border-white/10 bg-[rgba(255,255,255,0.14)] px-4 py-3 backdrop-blur-xl"
                      >
                        <div className="min-w-0">
                          <p className="break-words text-sm font-semibold text-white/88">
                            {item.label}
                          </p>
                          <p className="mt-1 break-words text-xs leading-5 text-white/56">
                            {item.note ?? item.href}
                          </p>
                        </div>
                        <button
                          aria-label={isPinned ? `${item.label} already pinned` : `Pin ${item.label}`}
                          className="inline-flex h-8 w-8 self-start items-center justify-center rounded-full border border-white/10 bg-[rgba(20,27,22,0.72)] text-white/82 transition hover:border-white/16 hover:bg-[rgba(30,38,33,0.84)] disabled:cursor-not-allowed disabled:bg-[rgba(34,40,36,0.6)] disabled:text-white/32"
                          disabled={isPinned}
                          onClick={() => onPinSuggestedItem(item)}
                          title={isPinned ? `${item.label} already pinned` : `Pin ${item.label}`}
                          type="button"
                        >
                          <span className="sr-only">
                            {isPinned ? `${item.label} already pinned` : `Pin ${item.label}`}
                          </span>
                          {isPinned ? (
                            <svg aria-hidden="true" className="h-4 w-4 text-emerald-700" fill="none" viewBox="0 0 24 24">
                              <path
                                d="M6.75 12.75L10.25 16.25L17.25 8.75"
                                stroke="currentColor"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="1.8"
                              />
                            </svg>
                          ) : (
                            <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
                              <path
                                d="M8.5 4.75H15.5L17.75 10.25L13.5 12.75V18.25L10.5 16.25V12.75L6.25 10.25L8.5 4.75Z"
                                stroke="currentColor"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="1.6"
                              />
                            </svg>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {pinManagerOpen ? (
                <form
                  className="mt-4 rounded-[22px] border border-white/10 bg-[rgba(245,248,246,0.14)] p-4 backdrop-blur-xl"
                  onSubmit={onAddCustomPin}
                >
                  <div className="flex flex-col gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white/88">Add custom pin</p>
                      <p className="mt-1 text-xs leading-5 text-white/58">
                        Save any route, file surface, tracker, workflow, or custom
                        path for quick access.
                      </p>
                    </div>
                    <button
                      className="rounded-full border border-white/10 bg-[rgba(20,27,22,0.72)] px-3 py-2 text-xs font-semibold text-white/78 transition hover:border-white/16 hover:bg-[rgba(30,38,33,0.84)]"
                      onClick={() => onPinDraftChange(defaultPinDraft)}
                      type="button"
                    >
                      Reset
                    </button>
                  </div>

                  <div className="mt-4 space-y-3">
                    <InputField
                      label="Pin label"
                      onChange={(value) =>
                        onPinDraftChange({
                          ...pinDraft,
                          label: value,
                        })
                      }
                      value={pinDraft.label}
                    />
                    <InputField
                      label="Destination"
                      onChange={(value) =>
                        onPinDraftChange({
                          ...pinDraft,
                          href: value,
                        })
                      }
                      value={pinDraft.href}
                    />
                    <label className="block">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/54">
                        Pin type
                      </span>
                      <select
                        className="mt-2 w-full rounded-[18px] border border-white/10 bg-[rgba(24,30,26,0.74)] px-4 py-3 text-sm text-white outline-none backdrop-blur transition focus:border-emerald-400"
                        onChange={(event) =>
                          onPinDraftChange({
                            ...pinDraft,
                            category: event.target.value as PinCategory,
                          })
                        }
                        value={pinDraft.category}
                      >
                        {[
                          "SCREEN",
                          "CLIENT",
                          "FILE",
                          "TRACKER",
                          "WORKFLOW",
                          "QUEUE",
                          "CUSTOM",
                        ].map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>
                    <TextAreaField
                      label="Short note"
                      onChange={(value) =>
                        onPinDraftChange({
                          ...pinDraft,
                          note: value,
                        })
                      }
                      value={pinDraft.note}
                    />
                  </div>

                  <button
                    className="mt-4 inline-flex w-full items-center justify-center rounded-full border border-black/10 px-4 py-3 text-sm font-medium text-white shadow-[0_14px_30px_rgba(17,77,26,0.24)] transition hover:brightness-[1.04]"
                    style={{ background: "var(--brand-green-chrome)" }}
                    type="submit"
                  >
                    Add pinned item
                  </button>
                </form>
              ) : null}
            </section>

            {statusMessage ? (
              <div className="rounded-[20px] border border-emerald-200/30 bg-[rgba(24,74,44,0.6)] px-4 py-3 text-sm text-emerald-50 backdrop-blur-xl">
                {statusMessage}
              </div>
            ) : null}

            {errorMessage ? (
              <div className="rounded-[20px] border border-rose-200/30 bg-[rgba(88,29,29,0.56)] px-4 py-3 text-sm text-rose-50 backdrop-blur-xl">
                {errorMessage}
              </div>
            ) : null}

            {editing ? (
              <form
                className="rounded-[26px] border border-white/10 bg-[rgba(245,248,246,0.14)] p-4 backdrop-blur-xl"
                onSubmit={onSave}
              >
                <div className="mb-4 flex flex-col gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white/88">
                      Edit pinned client
                    </p>
                    <p className="mt-1 text-xs leading-5 text-white/58">
                      Save contact and relationship changes without leaving the
                      current screen.
                    </p>
                  </div>
                  <button
                    className="rounded-full border border-white/10 bg-[rgba(20,27,22,0.72)] px-3 py-2 text-xs font-semibold text-white/78 transition hover:border-white/16 hover:bg-[rgba(30,38,33,0.84)]"
                    onClick={onStartEditing}
                    type="button"
                  >
                    Cancel
                  </button>
                </div>

                <div className="space-y-3">
                  <InputField
                    label="Client name"
                    onChange={(value) =>
                      onDraftChange(
                        draft
                          ? {
                              ...draft,
                              name: value,
                            }
                          : draft,
                      )
                    }
                    value={draft?.name ?? ""}
                  />
                  <InputField
                    label="Entity type"
                    onChange={(value) =>
                      onDraftChange(
                        draft
                          ? {
                              ...draft,
                              entityType: value,
                            }
                          : draft,
                      )
                    }
                    value={draft?.entityType ?? ""}
                  />
                  <InputField
                    label="Email"
                    onChange={(value) =>
                      onDraftChange(
                        draft
                          ? {
                              ...draft,
                              email: value,
                            }
                          : draft,
                      )
                    }
                    type="email"
                    value={draft?.email ?? ""}
                  />
                  <InputField
                    label="Phone"
                    onChange={(value) =>
                      onDraftChange(
                        draft
                          ? {
                              ...draft,
                              phone: value,
                            }
                          : draft,
                      )
                    }
                    value={draft?.phone ?? ""}
                  />
                  <TextAreaField
                    label="Relationship notes"
                    onChange={(value) =>
                      onDraftChange(
                        draft
                          ? {
                              ...draft,
                              experience: value,
                            }
                          : draft,
                      )
                    }
                    value={draft?.experience ?? ""}
                  />
                </div>

                <button
                  className="mt-4 inline-flex w-full items-center justify-center rounded-full border border-black/10 px-4 py-3 text-sm font-medium text-white shadow-[0_14px_30px_rgba(17,77,26,0.24)] transition hover:brightness-[1.04] disabled:cursor-not-allowed disabled:opacity-55"
                  disabled={isPending}
                  style={{ background: "var(--brand-green-chrome)" }}
                  type="submit"
                >
                  {isPending ? "Saving..." : "Save client changes"}
                </button>
              </form>
            ) : (
              <section className="rounded-[26px] border border-white/10 bg-[rgba(245,248,246,0.14)] p-4 backdrop-blur-xl">
                <div className="flex flex-col gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white/88">
                      Contact snapshot
                    </p>
                    <p className="mt-1 text-xs leading-5 text-white/58">
                      Inline details for quick review while the rest of the app stays
                      in view.
                    </p>
                  </div>
                  <button
                    className="rounded-full border border-white/10 bg-[rgba(20,27,22,0.72)] px-3 py-2 text-xs font-semibold text-white/78 transition hover:border-white/16 hover:bg-[rgba(30,38,33,0.84)]"
                    onClick={onStartEditing}
                    type="button"
                  >
                    Edit details
                  </button>
                </div>

                <dl className="mt-4 space-y-3 text-sm">
                  <InfoRow label="Email" value={client.email} />
                  <InfoRow label="Phone" value={client.phone} />
                  <InfoRow
                    label="Latest file"
                    value={client.latestDeal?.name ?? "No active files"}
                  />
                  <InfoRow
                    label="Target close"
                    value={
                      client.latestDeal
                        ? formatDate(client.latestDeal.targetCloseDate)
                        : "No target date"
                    }
                  />
                </dl>

                <div className="mt-4 rounded-[20px] border border-white/10 bg-[rgba(255,255,255,0.12)] px-4 py-3 backdrop-blur-xl">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/56">
                    Relationship notes
                  </p>
                  <p className="mt-2 text-sm leading-6 text-white/68">
                    {client.experience || "No relationship notes saved yet."}
                  </p>
                </div>
              </section>
            )}

            <section className="rounded-[26px] border border-white/18 bg-[linear-gradient(180deg,rgba(255,255,255,0.28),rgba(214,222,217,0.16))] p-4 shadow-[0_24px_48px_rgba(8,12,9,0.18)] backdrop-blur-2xl">
              <div className="flex flex-col gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white/88">Active files</p>
                  <p className="mt-1 text-xs leading-5 text-white/58">
                    Jump into the relationship&apos;s live deal stack from the current
                    screen.
                  </p>
                </div>
                <span className="rounded-full bg-[rgba(56,64,59,0.88)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-white/70">
                  {client.totalDeals} total
                </span>
              </div>

              <div className="mt-4 space-y-3">
                {client.deals.slice(0, 3).map((deal) => (
                  <article
                    key={deal.id}
                    className="rounded-[20px] border border-white/10 bg-[rgba(255,255,255,0.12)] p-4 backdrop-blur-xl"
                  >
                    <div className="flex flex-col gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#a8f0ba]">
                          {formatStage(deal.stage)}
                        </p>
                        <h3 className="mt-2 break-words text-sm font-semibold text-white">
                          {deal.name}
                        </h3>
                        <p className="mt-1 text-xs leading-5 text-white/58">
                          {deal.program} | {deal.market}
                        </p>
                      </div>
                      <p className="text-xs font-semibold text-white/65">
                        {currency(deal.loanAmount)}
                      </p>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-medium text-white/64">
                      <span className="rounded-full bg-[rgba(20,27,22,0.72)] px-3 py-1">
                        {deal.openTasks} task{deal.openTasks === 1 ? "" : "s"}
                      </span>
                      <span className="rounded-full bg-[rgba(20,27,22,0.72)] px-3 py-1">
                        {deal.pendingDocuments} doc
                        {deal.pendingDocuments === 1 ? "" : "s"}
                      </span>
                      <span className="rounded-full bg-[rgba(20,27,22,0.72)] px-3 py-1">
                        Close {formatDate(deal.targetCloseDate)}
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <ActionChip href={`/deals/${deal.id}`}>Workspace</ActionChip>
                      <ActionChip href={`/deals/${deal.id}/file`}>File</ActionChip>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-4">
      <div className="h-28 animate-pulse rounded-[24px] bg-slate-200/70" />
      <div className="h-40 animate-pulse rounded-[24px] bg-slate-200/60" />
      <div className="h-64 animate-pulse rounded-[24px] bg-slate-200/50" />
    </div>
  );
}

function ActionChip({
  children,
  href,
}: {
  children: string;
  href: string;
}) {
  return (
    <Link
      className="inline-flex items-center justify-center rounded-full border border-white/10 bg-[rgba(20,27,22,0.78)] px-3 py-2 text-xs font-medium text-white/82 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur transition hover:border-white/16 hover:bg-[rgba(30,38,33,0.88)]"
      href={href}
    >
      {children}
    </Link>
  );
}

function MetricTile({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[20px] border border-white/10 bg-[rgba(48,56,51,0.9)] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-xl">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/52">
        {label}
      </p>
      <p className="mt-2 text-lg font-semibold tracking-[-0.03em] text-white">
        {value}
      </p>
    </div>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[18px] border border-white/10 bg-[rgba(255,255,255,0.12)] px-4 py-3 backdrop-blur-xl">
      <dt className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/54">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-white/78">{value}</dd>
    </div>
  );
}

function InputField({
  label,
  onChange,
  type = "text",
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  type?: string;
  value: string;
}) {
  return (
    <label className="block">
      <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/54">
        {label}
      </span>
      <input
        className="mt-2 w-full rounded-[18px] border border-white/10 bg-[rgba(24,30,26,0.74)] px-4 py-3 text-sm text-white outline-none backdrop-blur transition placeholder:text-white/30 focus:border-emerald-400"
        onChange={(event) => onChange(event.target.value)}
        type={type}
        value={value}
      />
    </label>
  );
}

function TextAreaField({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="block">
      <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/54">
        {label}
      </span>
      <textarea
        className="mt-2 min-h-24 w-full rounded-[18px] border border-white/10 bg-[rgba(24,30,26,0.74)] px-4 py-3 text-sm text-white outline-none backdrop-blur transition placeholder:text-white/30 focus:border-emerald-400"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      />
    </label>
  );
}

function buildClientDraft(client: QuickAccessClientPayload): ClientDraft {
  return {
    name: client.name,
    entityType: client.entityType,
    experience: client.experience ?? "",
    email: client.email,
    phone: client.phone,
  };
}

function readStoredClientId() {
  try {
    return window.localStorage.getItem(selectedClientStorageKey);
  } catch {
    return null;
  }
}

function getClientInitials(name: string | undefined) {
  if (!name) {
    return "RG";
  }

  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("") || "RG";
}

function formatDate(value: string) {
  return shortDate(new Date(value));
}

function formatStage(value: string) {
  return value.replaceAll("_", " ");
}

function getPinGlyph(category: PinCategory) {
  switch (category) {
    case "SCREEN":
      return "SC";
    case "CLIENT":
      return "CL";
    case "FILE":
      return "FL";
    case "TRACKER":
      return "TR";
    case "WORKFLOW":
      return "WF";
    case "QUEUE":
      return "QU";
    case "CUSTOM":
      return "CU";
    default:
      return "RG";
  }
}
