import { Link } from 'react-router-dom'
import { useAppState } from '../domain/store'
import { pipelineStages } from '../domain/types'
import { compactCurrency, formatDateTime } from '../lib/format'
import {
  DemoStep,
  PageIntro,
  SectionCard,
  StageBadge,
  StatCard,
} from '../ui/primitives'

export function DashboardPage() {
  const { deals, tasks, documentRequests, activities } = useAppState()
  const residentialCount = deals.filter((deal) => deal.dealType === 'Residential').length
  const creCount = deals.filter((deal) => deal.dealType === 'CRE').length
  const pendingDocs = documentRequests.filter((doc) => doc.status === 'Requested').length
  const openTasks = tasks
    .filter((task) => task.status === 'Open')
    .toSorted((left, right) => left.dueDate.localeCompare(right.dueDate))
    .slice(0, 4)
  const recentActivities = activities.slice(0, 5)
  const volume = deals.reduce((total, deal) => total + deal.loanAmount, 0)

  return (
    <>
      <PageIntro
        eyebrow="Investor demo slice"
        title="A calm operating view for every live loan"
        subtitle="Keep the first experience simple: intake a lead, see where it sits, open the deal, finish the task, and collect the document."
        actions={
          <div className="page-actions">
            <Link className="button" to="/intake">
              Add new lead
            </Link>
            <Link className="button secondary" to="/pipeline">
              Open pipeline
            </Link>
          </div>
        }
      />

      <div className="stat-grid">
        <StatCard
          label="Live pipeline"
          value={`${deals.length} deals`}
          detail={`${residentialCount} residential and ${creCount} CRE opportunities`}
        />
        <StatCard
          label="Loan volume"
          value={compactCurrency(volume)}
          detail="Seed data reflects mixed bridge, rental, and refi deals"
        />
        <StatCard
          label="Open tasks"
          value={`${openTasks.length} due now`}
          detail="Short next-step list built for low-tech operators"
        />
        <StatCard
          label="Waiting documents"
          value={`${pendingDocs} requests`}
          detail="Borrower file collection stays visible without extra systems"
        />
      </div>

      <div className="dashboard-grid">
        <SectionCard
          title="Clickable demo flow"
          description="Use these steps in order during an investor walkthrough."
        >
          <div className="demo-grid">
            <DemoStep
              step={1}
              title="Open lead intake"
              body="The form is prefilled so you can submit immediately or edit a few fields live."
              to="/intake"
            />
            <DemoStep
              step={2}
              title="Create a new lead"
              body="Submitting adds the borrower, deal, starter tasks, and document requests."
              to="/intake"
            />
            <DemoStep
              step={3}
              title="Show the pipeline board"
              body="New leads appear in the Lead column and can be advanced with one click."
              to="/pipeline"
            />
            <DemoStep
              step={4}
              title="Open a borrower workspace"
              body="Each deal has a clear summary, next steps, recent activity, and document context."
              to="/deals/deal-rivergate"
            />
            <DemoStep
              step={5}
              title="Handle a document request"
              body="Use the upload view to request missing items or attach a real file from disk."
              to="/documents?dealId=deal-rivergate"
            />
            <DemoStep
              step={6}
              title="Close with the task center"
              body="This shows a simple daily queue for the operations team."
              to="/tasks"
            />
          </div>
        </SectionCard>

        <SectionCard
          title="Today’s focus"
          description="The operator should know what to do without training."
        >
          <div className="list-stack">
            {openTasks.map((task) => {
              const deal = deals.find((item) => item.id === task.dealId)

              return (
                <div className="list-row" key={task.id}>
                  <div>
                    <strong>{task.title}</strong>
                    <p>
                      {deal?.name} • due {task.dueDate}
                    </p>
                  </div>
                  <Link className="text-link" to={`/deals/${task.dealId}`}>
                    Open deal
                  </Link>
                </div>
              )
            })}
          </div>
        </SectionCard>
      </div>

      <div className="dashboard-grid">
        <SectionCard
          title="Pipeline health"
          description="Keep stage counts visible instead of burying them in charts."
        >
          <div className="list-stack">
            {pipelineStages.map((stage) => {
              const stageDeals = deals.filter((deal) => deal.stage === stage)
              return (
                <div className="list-row" key={stage}>
                  <div className="row-inline">
                    <StageBadge stage={stage} />
                    <strong>{stageDeals.length} deals</strong>
                  </div>
                  <span className="subdued">
                    {compactCurrency(
                      stageDeals.reduce((total, deal) => total + deal.loanAmount, 0),
                    )}
                  </span>
                </div>
              )
            })}
          </div>
        </SectionCard>

        <SectionCard
          title="Recent activity"
          description="A visible activity trail makes the demo feel operational without extra workflow tooling."
        >
          <div className="list-stack">
            {recentActivities.map((activity) => {
              const deal = deals.find((item) => item.id === activity.dealId)
              return (
                <div className="timeline-item" key={activity.id}>
                  <div className="timeline-marker" />
                  <div>
                    <strong>{activity.title}</strong>
                    <p>{activity.detail}</p>
                    <span className="subdued">
                      {deal?.name} • {formatDateTime(activity.timestamp)}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </SectionCard>
      </div>
    </>
  )
}
