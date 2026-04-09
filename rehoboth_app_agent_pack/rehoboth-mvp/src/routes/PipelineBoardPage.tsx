import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAppActions, useAppState } from '../domain/store'
import { pipelineStages } from '../domain/types'
import type { DealType } from '../domain/types'
import { compactCurrency, formatDate } from '../lib/format'
import { PageIntro, SectionCard, StageBadge } from '../ui/primitives'

type SegmentFilter = 'All' | DealType

export function PipelineBoardPage() {
  const [searchParams] = useSearchParams()
  const { deals, borrowers } = useAppState()
  const { advanceDealStage } = useAppActions()
  const [segment, setSegment] = useState<SegmentFilter>('All')
  const highlightDealId = searchParams.get('highlight')

  const filteredDeals =
    segment === 'All'
      ? deals
      : deals.filter((deal) => deal.dealType === segment)

  return (
    <>
      <PageIntro
        eyebrow="Pipeline board"
        title="See every deal without teaching a system"
        subtitle="The board stays simple: one stage, one owner path, one next action."
        actions={
          <div className="row-inline">
            {(['All', 'Residential', 'CRE'] as const).map((option) => (
              <button
                className={segment === option ? 'button' : 'button ghost'}
                key={option}
                onClick={() => setSegment(option)}
                type="button"
              >
                {option}
              </button>
            ))}
          </div>
        }
      />

      <div className="board-grid">
        {pipelineStages.map((stage) => {
          const stageDeals = filteredDeals.filter((deal) => deal.stage === stage)

          return (
            <SectionCard
              key={stage}
              title={stage}
              description={`${stageDeals.length} deal${stageDeals.length === 1 ? '' : 's'}`}
            >
              <div className="board-column">
                {stageDeals.map((deal) => {
                  const borrower = borrowers.find(
                    (item) => item.id === deal.borrowerId,
                  )

                  return (
                    <article
                      className={
                        highlightDealId === deal.id ? 'deal-card highlighted' : 'deal-card'
                      }
                      key={deal.id}
                    >
                      <div className="deal-card-head">
                        <StageBadge stage={deal.stage} />
                        <span className="subdued">{deal.dealType}</span>
                      </div>
                      <strong>{deal.name}</strong>
                      <p>{borrower?.name}</p>
                      <div className="mini-grid">
                        <div>
                          <span>Loan</span>
                          <strong>{compactCurrency(deal.loanAmount)}</strong>
                        </div>
                        <div>
                          <span>Target close</span>
                          <strong>{formatDate(deal.targetCloseDate)}</strong>
                        </div>
                      </div>
                      <p className="subdued">
                        {deal.market} • {deal.program}
                      </p>
                      <div className="card-actions">
                        <Link className="text-link" to={`/deals/${deal.id}`}>
                          Open workspace
                        </Link>
                        <button
                          className="text-link"
                          onClick={() => advanceDealStage(deal.id)}
                          type="button"
                        >
                          Advance stage
                        </button>
                      </div>
                    </article>
                  )
                })}
              </div>
            </SectionCard>
          )
        })}
      </div>
    </>
  )
}
