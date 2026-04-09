import { Link } from 'react-router-dom'
import type {
  DocumentStatus,
  PipelineStage,
  TaskPriority,
} from '../domain/types'

export function PageIntro({
  eyebrow,
  title,
  subtitle,
  actions,
}: {
  eyebrow: string
  title: string
  subtitle: string
  actions?: React.ReactNode
}) {
  return (
    <div className="page-intro">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      {actions ? <div className="page-actions">{actions}</div> : null}
    </div>
  )
}

export function SectionCard({
  title,
  description,
  children,
  action,
}: {
  title: string
  description?: string
  children: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <section className="section-card">
      <div className="section-header">
        <div>
          <h2>{title}</h2>
          {description ? <p>{description}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

export function StatCard({
  label,
  value,
  detail,
}: {
  label: string
  value: string
  detail: string
}) {
  return (
    <div className="stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{detail}</p>
    </div>
  )
}

function stageClassName(stage: PipelineStage) {
  return `tag tag-stage stage-${stage.toLowerCase().replace(/\s+/g, '-')}`
}

function priorityClassName(priority: TaskPriority) {
  return `tag priority-${priority.toLowerCase()}`
}

function documentClassName(status: DocumentStatus) {
  return `tag document-${status.toLowerCase()}`
}

export function StageBadge({ stage }: { stage: PipelineStage }) {
  return <span className={stageClassName(stage)}>{stage}</span>
}

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  return <span className={priorityClassName(priority)}>{priority}</span>
}

export function DocumentBadge({ status }: { status: DocumentStatus }) {
  return <span className={documentClassName(status)}>{status}</span>
}

export function DemoStep({
  step,
  title,
  body,
  to,
}: {
  step: number
  title: string
  body: string
  to: string
}) {
  return (
    <Link className="demo-step" to={to}>
      <span className="demo-number">{step}</span>
      <div>
        <strong>{title}</strong>
        <p>{body}</p>
      </div>
    </Link>
  )
}
