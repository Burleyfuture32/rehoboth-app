import { Navigate, Route, Routes } from 'react-router-dom'
import { DashboardPage } from './routes/DashboardPage'
import { DealWorkspacePage } from './routes/DealWorkspacePage'
import { DocumentsPage } from './routes/DocumentsPage'
import { LeadIntakePage } from './routes/LeadIntakePage'
import { PipelineBoardPage } from './routes/PipelineBoardPage'
import { TaskCenterPage } from './routes/TaskCenterPage'
import { AppShell } from './ui/AppShell'

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route element={<DashboardPage />} index />
        <Route element={<LeadIntakePage />} path="/intake" />
        <Route element={<PipelineBoardPage />} path="/pipeline" />
        <Route element={<DealWorkspacePage />} path="/deals/:dealId" />
        <Route element={<TaskCenterPage />} path="/tasks" />
        <Route element={<DocumentsPage />} path="/documents" />
        <Route element={<Navigate replace to="/" />} path="*" />
      </Route>
    </Routes>
  )
}
