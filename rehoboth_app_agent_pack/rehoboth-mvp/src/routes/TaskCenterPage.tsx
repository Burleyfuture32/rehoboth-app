import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAppActions, useAppState } from '../domain/store'
import { formatDate } from '../lib/format'
import { PageIntro, PriorityBadge, SectionCard } from '../ui/primitives'

type TaskFilter = 'Open' | 'Done' | 'All'

export function TaskCenterPage() {
  const { deals, tasks } = useAppState()
  const { completeTask } = useAppActions()
  const [filter, setFilter] = useState<TaskFilter>('Open')

  const filteredTasks = tasks.filter((task) =>
    filter === 'All' ? true : task.status === filter,
  )

  return (
    <>
      <PageIntro
        eyebrow="Task center"
        title="A simple queue for the operations team"
        subtitle="No inbox maze. Just the tasks that move deals forward."
        actions={
          <div className="row-inline">
            {(['Open', 'Done', 'All'] as const).map((option) => (
              <button
                className={filter === option ? 'button' : 'button ghost'}
                key={option}
                onClick={() => setFilter(option)}
                type="button"
              >
                {option}
              </button>
            ))}
          </div>
        }
      />

      <SectionCard
        title="Task list"
        description="Each row stays tied to the related loan so it is obvious where to work next."
      >
        <div className="table-list">
          {filteredTasks.map((task) => {
            const deal = deals.find((item) => item.id === task.dealId)
            return (
              <div className="table-row" key={task.id}>
                <div className="table-row-main">
                  <strong>{task.title}</strong>
                  <p>
                    {deal?.name} • {task.owner}
                  </p>
                </div>
                <div>{formatDate(task.dueDate)}</div>
                <div>
                  <PriorityBadge priority={task.priority} />
                </div>
                <div>{task.status}</div>
                <div className="row-inline row-inline-end">
                  <Link className="text-link" to={`/deals/${task.dealId}`}>
                    Open deal
                  </Link>
                  {task.status === 'Open' ? (
                    <button
                      className="text-link"
                      onClick={() => completeTask(task.id)}
                      type="button"
                    >
                      Mark done
                    </button>
                  ) : null}
                </div>
              </div>
            )
          })}
        </div>
      </SectionCard>
    </>
  )
}
