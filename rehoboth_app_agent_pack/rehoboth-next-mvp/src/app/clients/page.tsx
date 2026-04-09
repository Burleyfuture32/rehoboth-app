import Link from "next/link";
import { AppFrame } from "@/components/app-frame";
import { PinToQuickManagerButton } from "@/components/pin-to-quick-manager-button";
import {
  MetricCard,
  PageHeader,
  Panel,
  PrimaryLink,
  SecondaryLink,
  StageChip,
} from "@/components/ui";
import { compactCurrency, currency, shortDate } from "@/lib/format";
import { getClientsData } from "@/lib/clients";

export default async function ClientsPage() {
  const { clients, entityMix, metrics } = await getClientsData();
  const followUpClients = clients.filter(
    (client) => client.openTasks > 0 || client.pendingDocuments > 0,
  );

  return (
    <AppFrame>
      <PageHeader
        eyebrow="Clients"
        title="A clean roster for every borrower and entity in the pipeline"
        description="This view gives the team one place to review client contact details, live exposure, and which files need follow-up before the next lender touchpoint."
        actions={
          <>
            <PrimaryLink href="/leads/intake">Add new client</PrimaryLink>
            <SecondaryLink href="/pipeline">Open pipeline</SecondaryLink>
            <SecondaryLink href="/documents">Open documents</SecondaryLink>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Clients"
          value={`${metrics.totalClients}`}
          detail="Borrowers and entities stay visible even when they have multiple live deals."
        />
        <MetricCard
          label="Live deals"
          value={`${metrics.totalDeals}`}
          detail="Each client card rolls up every active file tied to that relationship."
        />
        <MetricCard
          label="Exposure"
          value={compactCurrency(metrics.totalVolume)}
          detail="Total requested loan volume across the current client roster."
        />
        <MetricCard
          label="Needs follow-up"
          value={`${metrics.clientsNeedingAttention}`}
          detail="Clients with open tasks or pending document requests that still need attention."
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.85fr)]">
        <Panel
          title="Client roster"
          description="Relationship view first, then deal detail underneath each borrower."
        >
          <div className="space-y-4">
            {clients.map((client) => (
              <article
                key={client.id}
                className="rounded-[24px] border border-slate-200/80 bg-slate-50/70 p-5"
              >
                <div className="flex flex-col gap-4 border-b border-slate-200/80 pb-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <StageChip>{client.entityType}</StageChip>
                      <span className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
                        {client.totalDeals} active deal
                        {client.totalDeals === 1 ? "" : "s"}
                      </span>
                    </div>
                    <h3 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                      {client.name}
                    </h3>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
                      <span>{client.email}</span>
                      <span>{client.phone}</span>
                      {client.experience ? <span>{client.experience}</span> : null}
                    </div>
                  </div>

                  <div className="grid gap-3 lg:min-w-[220px]">
                    <div className="flex justify-start lg:justify-end">
                      <PinToQuickManagerButton
                        item={{
                          id: `pin-client-${client.id}`,
                          label: client.name,
                          href:
                            client.latestDeal?.id
                              ? `/deals/${client.latestDeal.id}`
                              : "/clients",
                          category: "CLIENT",
                          note: `${client.entityType} client quick access`,
                        }}
                      />
                    </div>
                    <dl className="grid gap-2 text-sm text-slate-600">
                      <div>
                        <dt className="text-slate-500">Client exposure</dt>
                        <dd className="font-medium text-slate-900">
                          {currency(client.totalVolume)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-slate-500">Open tasks</dt>
                        <dd className="font-medium text-slate-900">{client.openTasks}</dd>
                      </div>
                      <div>
                        <dt className="text-slate-500">Pending docs</dt>
                        <dd className="font-medium text-slate-900">
                          {client.pendingDocuments}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>

                <div className="mt-4 grid gap-3">
                  {client.deals.map((deal) => (
                    <div
                      key={deal.id}
                      className="flex flex-col gap-3 rounded-[20px] border border-slate-200 bg-white/90 p-4 xl:flex-row xl:items-start xl:justify-between"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <StageChip>{deal.stage.replaceAll("_", " ")}</StageChip>
                          <span className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
                            {deal.dealType} | {deal.program}
                          </span>
                        </div>
                        <h4 className="mt-3 text-lg font-semibold text-slate-950">
                          {deal.name}
                        </h4>
                        <p className="mt-1 text-sm text-slate-600">
                          {deal.propertyAddress} | {deal.market}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium text-slate-600">
                          <span className="rounded-full bg-slate-100 px-3 py-1">
                            Loan {currency(deal.loanAmount)}
                          </span>
                          <span className="rounded-full bg-slate-100 px-3 py-1">
                            Close {shortDate(deal.targetCloseDate)}
                          </span>
                          <span className="rounded-full bg-slate-100 px-3 py-1">
                            {deal.openTasks} open task
                            {deal.openTasks === 1 ? "" : "s"}
                          </span>
                          <span className="rounded-full bg-slate-100 px-3 py-1">
                            {deal.pendingDocuments} pending doc
                            {deal.pendingDocuments === 1 ? "" : "s"}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 xl:min-w-[180px]">
                        <PinToQuickManagerButton
                          item={{
                            id: `pin-workspace-${deal.id}`,
                            label: deal.name,
                            href: `/deals/${deal.id}`,
                            category: "FILE",
                            note: `${client.name} workspace`,
                          }}
                        />
                        <Link
                          className="inline-flex items-center justify-center rounded-full bg-emerald-700 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-800"
                          href={`/deals/${deal.id}`}
                        >
                          Open workspace
                        </Link>
                        <Link
                          className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
                          href={`/deals/${deal.id}/file`}
                        >
                          Open client file
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </Panel>

        <div className="grid gap-4">
          <Panel
            title="Follow-up queue"
            description="The quickest relationship-level view of what still needs attention."
          >
            <div className="space-y-3">
              {followUpClients.length === 0 ? (
                <div className="rounded-[20px] border border-dashed border-slate-200 bg-slate-50/60 px-4 py-6 text-sm text-slate-500">
                  No clients currently need follow-up.
                </div>
              ) : null}

              {followUpClients.map((client) => (
                <div
                  key={client.id}
                  className="rounded-[20px] border border-slate-200 bg-slate-50/70 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-semibold text-slate-950">
                        {client.name}
                      </h3>
                      <p className="mt-1 text-sm text-slate-600">{client.email}</p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      {client.totalDeals} deal{client.totalDeals === 1 ? "" : "s"}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium text-slate-600">
                    <span className="rounded-full bg-white px-3 py-1">
                      {client.openTasks} open task{client.openTasks === 1 ? "" : "s"}
                    </span>
                    <span className="rounded-full bg-white px-3 py-1">
                      {client.pendingDocuments} pending doc
                      {client.pendingDocuments === 1 ? "" : "s"}
                    </span>
                  </div>
                  {client.latestDeal ? (
                    <div className="mt-4">
                      <p className="text-sm text-slate-600">
                        Latest file:{" "}
                        <span className="font-medium text-slate-900">
                          {client.latestDeal.name}
                        </span>
                      </p>
                      <Link
                        className="mt-3 inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
                        href={`/deals/${client.latestDeal.id}`}
                      >
                        Open latest workspace
                      </Link>
                      <div className="mt-3">
                        <PinToQuickManagerButton
                          item={{
                            id: `pin-follow-up-${client.id}`,
                            label: `${client.name} follow-up`,
                            href: `/deals/${client.latestDeal.id}`,
                            category: "CLIENT",
                            note: `${client.openTasks} tasks and ${client.pendingDocuments} pending docs`,
                          }}
                        />
                      </div>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </Panel>

          <Panel
            title="Entity mix"
            description="A quick read on who is currently in the book."
          >
            <div className="space-y-3">
              {entityMix.map(([entityType, count]) => (
                <div
                  key={entityType}
                  className="flex items-center justify-between rounded-[18px] border border-slate-200 bg-slate-50/70 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900">{entityType}</p>
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                      Client type
                    </p>
                  </div>
                  <p className="text-lg font-semibold text-slate-950">{count}</p>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </AppFrame>
  );
}
