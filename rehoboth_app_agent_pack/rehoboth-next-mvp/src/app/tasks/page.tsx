import Link from "next/link";
import { completeTaskAction } from "@/app/actions";
import { AppFrame } from "@/components/app-frame";
import { PageHeader, Panel, StageChip } from "@/components/ui";
import { shortDate } from "@/lib/format";
import { getTaskCenterData } from "@/lib/pipeline";

const priorityTone = {
  HIGH: "bg-rose-50 text-rose-800",
  MEDIUM: "bg-amber-50 text-amber-800",
  LOW: "bg-slate-100 text-slate-700",
} as const;

export default async function TaskCenterPage() {
  const tasks = await getTaskCenterData();

  return (
    <AppFrame>
      <PageHeader
        eyebrow="Task center"
        title="A single place to see what needs attention now"
        description="The task list is intentionally plain. It should tell the team what is due, which deal it belongs to, and whether the work is done."
      />

      <Panel
        title="Open and completed tasks"
        description="Tasks come directly from the deal records and can be marked complete without leaving the page."
      >
        <div className="space-y-3">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="grid gap-4 rounded-[22px] border border-slate-200 bg-slate-50/70 p-4 lg:grid-cols-[minmax(0,1.4fr)_150px_130px_140px]"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <StageChip>{task.deal.dealType}</StageChip>
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${priorityTone[task.priority]}`}
                  >
                    {task.priority}
                  </span>
                </div>
                <h3 className="mt-3 text-base font-semibold text-slate-950">
                  {task.title}
                </h3>
                <p className="mt-1 text-sm text-slate-600">
                  {task.deal.name} • {task.deal.borrower.name}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {task.category} • owner: {task.owner}
                </p>
              </div>

              <div className="text-sm">
                <p className="text-slate-500">Due date</p>
                <p className="mt-1 font-medium text-slate-900">
                  {shortDate(task.dueDate)}
                </p>
              </div>

              <div className="text-sm">
                <p className="text-slate-500">Status</p>
                <p className="mt-1 font-medium text-slate-900">
                  {task.status === "OPEN" ? "Open" : "Done"}
                </p>
              </div>

              <div className="flex items-start justify-start lg:justify-end">
                <div className="flex flex-col gap-2 lg:items-end">
                  <Link
                    className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
                    href={`/deals/${task.deal.id}`}
                  >
                    Open deal
                  </Link>
                  {task.status === "OPEN" ? (
                    <form action={completeTaskAction}>
                      <input name="taskId" type="hidden" value={task.id} />
                      <button
                        className="inline-flex items-center justify-center rounded-full bg-emerald-700 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-800"
                        type="submit"
                      >
                        Mark done
                      </button>
                    </form>
                  ) : (
                    <span className="inline-flex rounded-full bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">
                      Complete
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </AppFrame>
  );
}
