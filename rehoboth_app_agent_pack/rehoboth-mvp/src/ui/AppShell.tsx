import { useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAppState } from '../domain/store'

type NavItem = {
  to: string
  label: string
  badge?: number
  matchPrefixes?: string[]
}

type NavSection = {
  id: string
  title: string
  summary: string
  pinned?: boolean
  items: NavItem[]
}

function matchesPath(pathname: string, item: NavItem) {
  if (item.to === '/') {
    return pathname === '/'
  }

  if (pathname === item.to || pathname.startsWith(`${item.to}/`)) {
    return true
  }

  return item.matchPrefixes?.some((prefix) => pathname.startsWith(prefix)) ?? false
}

function activeSectionForPath(pathname: string) {
  if (pathname.startsWith('/tasks') || pathname.startsWith('/documents')) {
    return 'operations'
  }

  return 'core'
}

export function AppShell() {
  const location = useLocation()
  const { officeName, deals, tasks, documentRequests } = useAppState()
  const openTasks = tasks.filter((task) => task.status === 'Open').length
  const pendingDocs = documentRequests.filter((doc) => doc.status === 'Requested').length
  const activeSectionId = activeSectionForPath(location.pathname)
  const [expandedSectionId, setExpandedSectionId] = useState('')
  const [isNavOpen, setIsNavOpen] = useState(false)

  const navSections: NavSection[] = [
    {
      id: 'core',
      title: 'Core workflow',
      summary: 'Keep the main operating path visible at all times.',
      pinned: true,
      items: [
        { to: '/', label: 'Dashboard' },
        { to: '/intake', label: 'Lead Intake' },
        {
          to: '/pipeline',
          label: 'Pipeline Board',
          badge: deals.length,
          matchPrefixes: ['/deals/'],
        },
      ],
    },
    {
      id: 'operations',
      title: 'Operations',
      summary: 'Queues and file work around the active deal pipeline.',
      items: [
        { to: '/tasks', label: 'Task Center', badge: openTasks },
        { to: '/documents', label: 'Documents', badge: pendingDocs },
      ],
    },
  ]

  function toggleSection(section: NavSection) {
    if (section.pinned) {
      return
    }

    setExpandedSectionId((current) => (current === section.id ? '' : section.id))
  }

  return (
    <div className={isNavOpen ? 'app-shell nav-open' : 'app-shell'}>
      {isNavOpen ? (
        <button
          aria-label="Close navigation"
          className="sidebar-backdrop"
          onClick={() => setIsNavOpen(false)}
          type="button"
        />
      ) : null}

      <aside className="sidebar">
        <div className="sidebar-panel">
          <div className="brand-block">
            <div className="brand-mark">R</div>
            <div className="brand-copy">
              <strong>{officeName}</strong>
              <p>Single-tenant lending demo</p>
            </div>
            <button
              aria-label="Close navigation"
              className="sidebar-dismiss"
              onClick={() => setIsNavOpen(false)}
              type="button"
            >
              Close
            </button>
          </div>

          <nav aria-label="Primary" className="nav-groups">
            {navSections.map((section) => {
              const isExpanded =
                section.pinned ||
                section.id === activeSectionId ||
                section.id === expandedSectionId

              return (
                <section
                  className={isExpanded ? 'nav-section expanded' : 'nav-section'}
                  key={section.id}
                >
                  <div className="nav-section-header">
                    <div className="nav-section-copy">
                      <span className="nav-section-title">{section.title}</span>
                      <p>{section.summary}</p>
                    </div>
                    {section.pinned ? (
                      <span className="nav-section-chip">Pinned</span>
                    ) : (
                      <button
                        aria-expanded={isExpanded}
                        className="nav-section-toggle"
                        onClick={() => toggleSection(section)}
                        type="button"
                      >
                        {isExpanded ? 'Hide' : 'Show'}
                      </button>
                    )}
                  </div>

                  {isExpanded ? (
                    <div className="nav-list">
                      {section.items.map((item) => {
                        const isCurrent = matchesPath(location.pathname, item)

                        return (
                          <NavLink
                            aria-current={isCurrent ? 'page' : undefined}
                            className={isCurrent ? 'nav-link active' : 'nav-link'}
                            key={item.to}
                            onClick={() => setIsNavOpen(false)}
                            to={item.to}
                          >
                            <span className="nav-link-label">{item.label}</span>
                            {item.badge !== undefined ? (
                              <span className="nav-badge">{item.badge}</span>
                            ) : null}
                          </NavLink>
                        )
                      })}
                    </div>
                  ) : null}
                </section>
              )
            })}
          </nav>

          <div className="sidebar-note">
            <span className="eyebrow">At a glance</span>
            <strong>{deals.length} live deals</strong>
            <p>{openTasks} open tasks across CRE and residential lending.</p>
          </div>
        </div>
      </aside>

      <main className="main-scroll">
        <header className="shell-header">
          <button
            aria-expanded={isNavOpen}
            aria-label="Open navigation"
            className="mobile-nav-button"
            onClick={() => setIsNavOpen(true)}
            type="button"
          >
            Menu
          </button>
          <div className="header-badges">
            <span className="header-chip">Web-first MVP</span>
            <span className="header-chip muted">Low-tech friendly workflow</span>
          </div>
          <div className="header-meta">
            <strong>Avery Shaw</strong>
            <span>Originations lead</span>
          </div>
        </header>
        <div className="page">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
