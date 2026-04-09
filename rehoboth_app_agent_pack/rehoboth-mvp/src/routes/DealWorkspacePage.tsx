import { Link, useParams } from 'react-router-dom'
import { useAppActions, useAppState } from '../domain/store'
import { currency, formatDate, formatDateTime } from '../lib/format'
import {
  DocumentBadge,
  PageIntro,
  PriorityBadge,
  SectionCard,
  StageBadge,
} from '../ui/primitives'

export function DealWorkspacePage() {
  const { dealId = '' } = useParams()
  const { deals, borrowers, tasks, documentRequests, activities } = useAppState()
  const { advanceDealStage, completeTask } = useAppActions()

  const deal = deals.find((item) => item.id === dealId)

  if (!deal) {
    return (
      <SectionCard title="Deal not found" description="Pick a deal from the pipeline board.">
        <Link className="button" to="/pipeline">
          Back to pipeline
        </Link>
      </SectionCard>
    )
  }

  const borrower = borrowers.find((item) => item.id === deal.borrowerId)
  const dealTasks = tasks
    .filter((task) => task.dealId === deal.id)
    .toSorted((left, right) => left.status.localeCompare(right.status))
  const dealDocs = documentRequests.filter((doc) => doc.dealId === deal.id)
  const dealActivity = activities.filter((activity) => activity.dealId === deal.id).slice(0, 5)
  const openTask = dealTasks.find((task) => task.status === 'Open')

  return (
    <>
      <PageIntro
        eyebrow="Borrower and deal workspace"
        title={deal.name}
        subtitle={`${borrower?.name} • ${deal.market} • ${deal.program}`}
        actions={
          <div className="page-actions">
            <button className="button" onClick={() => advanceDealStage(deal.id)} type="button">
              Advance stage
            </button>
            <Link className="button secondary" to={`/documents?dealId=${deal.id}`}>
              Open documents
            </Link>
          </div>
        }
      />

      <div className="workspace-grid">
        <div className="workspace-main">
          <SectionCard
            title="Deal snapshot"
            description="Simple enough for an originator, detailed enough for an investor demo."
            action={<StageBadge stage={deal.stage} />}
          >
            <div className="detail-grid">
              <div>
                <span>Loan amount</span>
                <strong>{currency(deal.loanAmount)}</strong>
              </div>
              <div>
                <span>Estimated value</span>
                <strong>{currency(deal.purchasePrice)}</strong>
              </div>
              <div>
                <span>LTV</span>
                <strong>{deal.ltv}%</strong>
              </div>
              <div>
                <span>Target close</span>
                <strong>{formatDate(deal.targetCloseDate)}</strong>
              </div>
              <div>
                <span>Source</span>
                <strong>{deal.source}</strong>
              </div>
              <div>
                <span>Occupancy</span>
                <strong>{deal.occupancy}</strong>
              </div>
            </div>
            <p className="workspace-summary">{deal.summary}</p>
          </SectionCard>

          <SectionCard
            title="Deal tasks"
            description="Tasks stay attached to the deal so the next action is always visible."
            action={<Link className="text-link" to="/tasks">Open task center</Link>}
          >
            <div className="list-stack">
              {dealTasks.map((task) => (
                <div className="task-row" key={task.id}>
                  <div>
                    <strong>{task.title}</strong>
                    <p>
                      {task.category} • {task.owner} • due {task.dueDate}
                    </p>
                  </div>
                  <div className="row-inline">
                    <PriorityBadge priority={task.priority} />
                    {task.status === 'Open' ? (
                      <button
                        className="text-link"
                        onClick={() => completeTask(task.id)}
                        type="button"
                      >
                        Mark done
                      </button>
                    ) : (
                      <span className="subdued">Done</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Recent activity" description="Keep a visible trail without building a full audit log product.">
            <div className="list-stack">
              {dealActivity.map((item) => (
                <div className="timeline-item" key={item.id}>
                  <div className="timeline-marker" />
                  <div>
                    <strong>{item.title}</strong>
                    <p>{item.detail}</p>
                    <span className="subdued">{formatDateTime(item.timestamp)}</span>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>

        <div className="workspace-side">
          <SectionCard title="Borrower" description="Single borrower profile first keeps the demo grounded.">
            <div className="list-stack">
              <div className="info-pair">
                <span>Entity</span>
                <strong>{borrower?.entityType}</strong>
              </div>
              <div className="info-pair">
                <span>Experience</span>
                <strong>{borrower?.experience}</strong>
              </div>
              <div className="info-pair">
                <span>Email</span>
                <strong>{borrower?.email}</strong>
              </div>
              <div className="info-pair">
                <span>Phone</span>
                <strong>{borrower?.phone}</strong>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="Requested documents"
            description="The deal workspace should always expose the file collection state."
          >
            <div className="list-stack">
              {dealDocs.map((doc) => (
                <div className="task-row" key={doc.id}>
                  <div>
                    <strong>{doc.name}</strong>
                    <p>{doc.requestedFrom}</p>
                  </div>
                  <DocumentBadge status={doc.status} />
                </div>
              ))}
            </div>
            <Link className="button secondary button-full" to={`/documents?dealId=${deal.id}`}>
              Manage documents
            </Link>
          </SectionCard>

          {openTask ? (
            <SectionCard title="Next best action" description="This keeps the operator focused on one obvious move.">
              <strong>{openTask.title}</strong>
              <p className="subdued">
                {openTask.owner} • due {openTask.dueDate}
              </p>
              <button className="button button-full" onClick={() => completeTask(openTask.id)} type="button">
                Mark top task done
              </button>
            </SectionCard>
          ) : null}
        </div>
      </div>
    </>
  )
}
