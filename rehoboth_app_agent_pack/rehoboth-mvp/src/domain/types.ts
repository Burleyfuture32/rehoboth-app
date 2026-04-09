export const pipelineStages = [
  'Lead',
  'Screening',
  'Underwriting',
  'Docs Requested',
  'Closing',
] as const

export type PipelineStage = (typeof pipelineStages)[number]
export type DealType = 'Residential' | 'CRE'
export type TaskStatus = 'Open' | 'Done'
export type TaskPriority = 'High' | 'Medium' | 'Low'
export type DocumentStatus = 'Requested' | 'Uploaded' | 'Reviewed'

export type Borrower = {
  id: string
  name: string
  entityType: string
  experience: string
  email: string
  phone: string
}

export type Deal = {
  id: string
  name: string
  borrowerId: string
  dealType: DealType
  stage: PipelineStage
  program: string
  propertyAddress: string
  market: string
  occupancy: string
  units?: number
  source: string
  loanAmount: number
  purchasePrice: number
  ltv: number
  targetCloseDate: string
  summary: string
  nextMilestone: string
  createdAt: string
  lastActivityAt: string
}

export type Task = {
  id: string
  dealId: string
  title: string
  owner: string
  dueDate: string
  priority: TaskPriority
  category: string
  status: TaskStatus
}

export type DocumentRequest = {
  id: string
  dealId: string
  name: string
  requestedFrom: string
  status: DocumentStatus
  uploadedFileName?: string
  uploadedAt?: string
}

export type Activity = {
  id: string
  dealId: string
  timestamp: string
  title: string
  detail: string
}

export type AppState = {
  officeName: string
  borrowers: Borrower[]
  deals: Deal[]
  tasks: Task[]
  documentRequests: DocumentRequest[]
  activities: Activity[]
}

export type CreateLeadInput = {
  borrowerName: string
  entityType: string
  email: string
  phone: string
  dealName: string
  dealType: DealType
  program: string
  propertyAddress: string
  market: string
  occupancy: string
  loanAmount: number
  estimatedValue: number
  source: string
  notes: string
}
