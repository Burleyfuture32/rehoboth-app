import { notFound } from "next/navigation";
import { addWorkflowTemplateAction } from "@/app/actions";
import { AppFrame } from "@/components/app-frame";
import { ClientStatusBar } from "@/components/client-status-bar";
import { PinToQuickManagerButton } from "@/components/pin-to-quick-manager-button";
import { PageHeader, Panel, PrimaryLink, SecondaryLink, StageChip } from "@/components/ui";
import { shortDateTime } from "@/lib/format";
import { getWorkflowCenterData } from "@/lib/workflows";

export default async function WorkflowsPage({
  searchParams,
}: {
  searchParams: Promise<{ dealId?: string; added?: string }>;
}) {
  const params = await searchParams;
  const data = await getWorkflowCenterData(params.dealId);

  if (params.dealId && !data.selectedDeal) {
    notFound();
  }

  return (
    <AppFrame>
      <PageHeader
        eyebrow="Workflow launcher"
        title="Add workflows fast without building an automation engine"
        description="Pick a deal, choose a workflow template, and the app creates the right tasks and document requests in one move."
        actions={
          <>
            <PrimaryLink href="/pipeline">Back to pipeline</PrimaryLink>
            <SecondaryLink href="/tasks">Open task center</SecondaryLink>
          </>
        }
      />

      {data.selectedDeal ? <ClientStatusBar deal={data.selectedDeal} /> : null}

      {params.added ? (
        <div className="mb-6 rounded-[24px] border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-900">
          Workflow launcher updated the selected file.
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
        <Panel
          title="Choose a deal"
          description="Start by choosing the client file that should receive the workflow."
        >
          <form className="grid gap-4" method="GET">
            <label className="grid gap-2 text-sm">
              <span className="font-medium text-slate-700">Deal</span>
              <select
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-400"
                defaultValue={data.selectedDeal?.id ?? ""}
                name="dealId"
              >
                <option value="">Choose a file</option>
                {data.dealOptions.map((deal) => (
                  <option key={deal.id} value={deal.id}>
                    {deal.name} | {deal.borrower.name}
                  </option>
                ))}
              </select>
            </label>
            <button
              className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700"
              type="submit"
            >
              Load workflows
            </button>
          </form>

          {data.selectedDeal ? (
            <div className="mt-4 rounded-[20px] border border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-700">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-950">{data.selectedDeal.name}</p>
                  <p className="mt-1">{data.selectedDeal.borrower.name}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.16em] text-slate-500">
                    {data.selectedDeal.stage.replaceAll("_", " ")} | {data.selectedDeal.dealType}
                  </p>
                </div>
                <PinToQuickManagerButton
                  item={{
                    id: `pin-workflow-deal-${data.selectedDeal.id}`,
                    label: `${data.selectedDeal.borrower.name} workflow target`,
                    href: `/workflows?dealId=${data.selectedDeal.id}`,
                    category: "WORKFLOW",
                    note: data.selectedDeal.name,
                  }}
                  size="xs"
                />
              </div>
            </div>
          ) : null}
        </Panel>

        <Panel
          title="Quick-add workflows"
          description="These templates create the most common next steps without forcing the user to manually add every task and document request."
        >
          <div className="grid gap-4 xl:grid-cols-2">
            {data.templates.map((template) => {
              const isDisabled =
                !data.selectedDeal ||
                (template.dealTypes &&
                  !template.dealTypes.includes(data.selectedDeal.dealType));

              return (
                <article
                  key={template.key}
                  className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {template.dealTypes?.map((dealType) => (
                        <StageChip key={`${template.key}-${dealType}`}>{dealType}</StageChip>
                      )) ?? <StageChip>ALL DEALS</StageChip>}
                    </div>
                    <PinToQuickManagerButton
                      item={{
                        id: `pin-workflow-template-${template.key}`,
                        label: template.title,
                        href:
                          data.selectedDeal
                            ? `/workflows?dealId=${data.selectedDeal.id}`
                            : "/workflows",
                        category: "WORKFLOW",
                        note: template.recommendedFor,
                      }}
                      size="xs"
                    />
                  </div>
                  <h2 className="mt-3 text-lg font-semibold text-slate-950">
                    {template.title}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {template.description}
                  </p>
                  <p className="mt-3 text-sm text-slate-500">
                    Best for: {template.recommendedFor}
                  </p>

                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <Metric label="Tasks added" value={`${template.tasks.length}`} />
                    <Metric label="Doc requests added" value={`${template.documents.length}`} />
                  </div>

                  <div className="mt-4 rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      What this adds
                    </p>
                    <p className="mt-2">
                      {template.tasks.map((task) => task.title).join(", ")}
                      {template.documents.length
                        ? `. Docs: ${template.documents.map((document) => document.title).join(", ")}`
                        : "."}
                    </p>
                  </div>

                  <form action={addWorkflowTemplateAction} className="mt-4">
                    <input
                      name="createdBy"
                      type="hidden"
                      value="Rehoboth Workflow Launcher"
                    />
                    <input name="dealId" type="hidden" value={data.selectedDeal?.id ?? ""} />
                    <input name="workflowKey" type="hidden" value={template.key} />
                    <input
                      name="returnTo"
                      type="hidden"
                      value={
                        data.selectedDeal
                          ? `/workflows?dealId=${data.selectedDeal.id}&added=${template.key}`
                          : "/workflows"
                      }
                    />
                    <button
                      className="inline-flex items-center justify-center rounded-full bg-[var(--brand-green)] px-4 py-2.5 text-sm font-medium text-white shadow-[0_10px_24px_rgba(31,143,47,0.22)] transition hover:bg-[var(--brand-green-deep)] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
                      disabled={isDisabled}
                      type="submit"
                    >
                      {isDisabled ? "Choose matching deal first" : "Launch workflow"}
                    </button>
                  </form>
                </article>
              );
            })}
          </div>
        </Panel>
      </div>

      <div className="mt-4">
        <Panel
          title="Recent workflow launches"
          description="This gives the team a simple audit trail of workflow templates already added to files."
        >
          <div className="space-y-3">
            {data.workflowActivities.length === 0 ? (
              <div className="rounded-[20px] border border-dashed border-slate-200 bg-slate-50/60 px-4 py-6 text-sm text-slate-500">
                No workflow launches yet.
              </div>
            ) : null}

            {data.workflowActivities.map((activity) => (
              <article
                key={activity.id}
                className="rounded-[22px] border border-slate-200 bg-slate-50/70 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold text-slate-950">
                      {activity.title}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {activity.deal.name} | {activity.deal.borrower.name}
                    </p>
                  </div>
                  <p className="text-sm text-slate-500">
                    {shortDateTime(activity.createdAt)}
                  </p>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-700">{activity.body}</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <PinToQuickManagerButton
                    item={{
                      id: `pin-workflow-activity-${activity.id}`,
                      label: activity.title,
                      href: `/deals/${activity.deal.id}/summary`,
                      category: "WORKFLOW",
                      note: activity.deal.name,
                    }}
                    size="xs"
                  />
                  <SecondaryLink href={`/deals/${activity.deal.id}`}>
                    Open deal
                  </SecondaryLink>
                  <SecondaryLink href={`/deals/${activity.deal.id}/summary`}>
                    Open summary
                  </SecondaryLink>
                </div>
              </article>
            ))}
          </div>
        </Panel>
      </div>
    </AppFrame>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-slate-200 bg-white px-4 py-3">
      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-2 font-medium text-slate-900">{value}</p>
    </div>
  );
}
