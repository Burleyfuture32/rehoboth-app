import {
  createContext,
  useContext,
  useReducer,
} from 'react'
import type { ReactNode } from 'react'
import { seedState } from '../data/seed'
import {
  pipelineStages,
} from './types'
import type {
  AppState,
  CreateLeadInput,
  Deal,
  DocumentRequest,
} from './types'

type Action =
  | {
      type: 'createLead'
      payload: {
        borrower: AppState['borrowers'][number]
        deal: Deal
        tasks: AppState['tasks']
        documentRequests: DocumentRequest[]
      }
    }
  | {
      type: 'completeTask'
      payload: {
        taskId: string
      }
    }
  | {
      type: 'advanceDealStage'
      payload: {
        dealId: string
      }
    }
  | {
      type: 'uploadDocument'
      payload: {
        requestId: string
        fileName: string
      }
    }
  | {
      type: 'requestDocument'
      payload: {
        documentRequest: DocumentRequest
      }
    }

type AppActions = {
  createLead: (input: CreateLeadInput) => string
  completeTask: (taskId: string) => void
  advanceDealStage: (dealId: string) => void
  uploadDocument: (requestId: string, fileName: string) => void
  requestDocument: (
    dealId: string,
    name: string,
    requestedFrom: string,
  ) => void
}

const StateContext = createContext<AppState | null>(null)
const ActionsContext = createContext<AppActions | null>(null)

const nowIso = () => new Date().toISOString()

const makeId = (prefix: string) =>
  `${prefix}-${Math.random().toString(36).slice(2, 8)}`

function updateDealActivity(deals: Deal[], dealId: string): Deal[] {
  return deals.map((deal) =>
    deal.id === dealId ? { ...deal, lastActivityAt: nowIso() } : deal,
  )
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'createLead': {
      const { borrower, deal, tasks, documentRequests } = action.payload
      return {
        ...state,
        borrowers: [borrower, ...state.borrowers],
        deals: [deal, ...state.deals],
        tasks: [...tasks, ...state.tasks],
        documentRequests: [...documentRequests, ...state.documentRequests],
        activities: [
          {
            id: makeId('activity'),
            dealId: deal.id,
            timestamp: nowIso(),
            title: 'Lead created',
            detail: `${deal.name} entered pipeline from ${deal.source}.`,
          },
          ...state.activities,
        ],
      }
    }
    case 'completeTask': {
      const task = state.tasks.find((item) => item.id === action.payload.taskId)
      if (!task || task.status === 'Done') {
        return state
      }

      return {
        ...state,
        tasks: state.tasks.map((item) =>
          item.id === action.payload.taskId
            ? { ...item, status: 'Done' }
            : item,
        ),
        deals: updateDealActivity(state.deals, task.dealId),
        activities: [
          {
            id: makeId('activity'),
            dealId: task.dealId,
            timestamp: nowIso(),
            title: 'Task completed',
            detail: task.title,
          },
          ...state.activities,
        ],
      }
    }
    case 'advanceDealStage': {
      const deal = state.deals.find((item) => item.id === action.payload.dealId)
      if (!deal) {
        return state
      }

      const currentIndex = pipelineStages.indexOf(deal.stage)
      const nextStage =
        currentIndex < pipelineStages.length - 1
          ? pipelineStages[currentIndex + 1]
          : deal.stage

      if (nextStage === deal.stage) {
        return state
      }

      return {
        ...state,
        deals: state.deals.map((item) =>
          item.id === deal.id
            ? {
                ...item,
                stage: nextStage,
                nextMilestone:
                  nextStage === 'Closing'
                    ? 'Confirm docs and schedule signing'
                    : `Move from ${deal.stage} to ${nextStage}`,
                lastActivityAt: nowIso(),
              }
            : item,
        ),
        activities: [
          {
            id: makeId('activity'),
            dealId: deal.id,
            timestamp: nowIso(),
            title: 'Stage advanced',
            detail: `${deal.stage} moved to ${nextStage}.`,
          },
          ...state.activities,
        ],
      }
    }
    case 'uploadDocument': {
      const request = state.documentRequests.find(
        (item) => item.id === action.payload.requestId,
      )
      if (!request) {
        return state
      }

      return {
        ...state,
        documentRequests: state.documentRequests.map((item) =>
          item.id === request.id
            ? {
                ...item,
                status: 'Uploaded',
                uploadedFileName: action.payload.fileName,
                uploadedAt: nowIso(),
              }
            : item,
        ),
        deals: updateDealActivity(state.deals, request.dealId),
        activities: [
          {
            id: makeId('activity'),
            dealId: request.dealId,
            timestamp: nowIso(),
            title: 'Document uploaded',
            detail: `${request.name} uploaded as ${action.payload.fileName}.`,
          },
          ...state.activities,
        ],
      }
    }
    case 'requestDocument': {
      const request = action.payload.documentRequest
      return {
        ...state,
        documentRequests: [request, ...state.documentRequests],
        deals: updateDealActivity(state.deals, request.dealId),
        activities: [
          {
            id: makeId('activity'),
            dealId: request.dealId,
            timestamp: nowIso(),
            title: 'New document requested',
            detail: `${request.name} requested from ${request.requestedFrom}.`,
          },
          ...state.activities,
        ],
      }
    }
    default:
      return state
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, seedState)

  const actions: AppActions = {
    createLead(input) {
      const borrowerId = makeId('borrower')
      const dealId = makeId('deal')
      const createdAt = nowIso()

      dispatch({
        type: 'createLead',
        payload: {
          borrower: {
            id: borrowerId,
            name: input.borrowerName,
            entityType: input.entityType,
            experience: 'New lead intake',
            email: input.email,
            phone: input.phone,
          },
          deal: {
            id: dealId,
            name: input.dealName,
            borrowerId,
            dealType: input.dealType,
            stage: 'Lead',
            program: input.program,
            propertyAddress: input.propertyAddress,
            market: input.market,
            occupancy: input.occupancy,
            source: input.source,
            loanAmount: input.loanAmount,
            purchasePrice: input.estimatedValue,
            ltv:
              input.estimatedValue > 0
                ? Math.round((input.loanAmount / input.estimatedValue) * 100)
                : 70,
            targetCloseDate: '2026-05-22',
            summary: input.notes,
            nextMilestone: 'Triage borrower basics and request initial docs',
            createdAt,
            lastActivityAt: createdAt,
          },
          tasks: [
            {
              id: makeId('task'),
              dealId,
              title: 'Review intake details and call borrower',
              owner: 'Avery Shaw',
              dueDate: '2026-04-03',
              priority: 'High',
              category: 'Lead Intake',
              status: 'Open',
            },
            {
              id: makeId('task'),
              dealId,
              title: 'Send starter document checklist',
              owner: 'Nora Wells',
              dueDate: '2026-04-04',
              priority: 'Medium',
              category: 'Documents',
              status: 'Open',
            },
          ],
          documentRequests: [
            {
              id: makeId('doc'),
              dealId,
              name: 'Borrower statement of real estate owned',
              requestedFrom: 'Borrower',
              status: 'Requested',
            },
            {
              id: makeId('doc'),
              dealId,
              name: 'Liquidity proof',
              requestedFrom: 'Borrower',
              status: 'Requested',
            },
          ],
        },
      })

      return dealId
    },
    completeTask(taskId) {
      dispatch({ type: 'completeTask', payload: { taskId } })
    },
    advanceDealStage(dealId) {
      dispatch({ type: 'advanceDealStage', payload: { dealId } })
    },
    uploadDocument(requestId, fileName) {
      dispatch({
        type: 'uploadDocument',
        payload: { requestId, fileName },
      })
    },
    requestDocument(dealId, name, requestedFrom) {
      dispatch({
        type: 'requestDocument',
        payload: {
          documentRequest: {
            id: makeId('doc'),
            dealId,
            name,
            requestedFrom,
            status: 'Requested',
          },
        },
      })
    },
  }

  return (
    <StateContext.Provider value={state}>
      <ActionsContext.Provider value={actions}>
        {children}
      </ActionsContext.Provider>
    </StateContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAppState() {
  const context = useContext(StateContext)
  if (!context) {
    throw new Error('useAppState must be used inside AppProvider')
  }

  return context
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAppActions() {
  const context = useContext(ActionsContext)
  if (!context) {
    throw new Error('useAppActions must be used inside AppProvider')
  }

  return context
}
