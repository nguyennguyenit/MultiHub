interface GitHubPanelCardProps {
  title: string
  subtitle?: string
  count?: number
  action?: React.ReactNode
  className?: string
  children: React.ReactNode
}

export function GitHubPanelCard({
  title,
  subtitle,
  count,
  action,
  className,
  children,
}: GitHubPanelCardProps) {
  return (
    <section className={['github-panel-card', className].filter(Boolean).join(' ')}>
      <header className="github-panel-card-header">
        <div className="github-panel-card-copy">
          <div className="github-panel-card-title-row">
            <span className="github-panel-card-title">{title}</span>
            {count !== undefined && <span className="github-panel-card-count">{count}</span>}
          </div>
          {subtitle && <p className="github-panel-card-subtitle">{subtitle}</p>}
        </div>
        {action}
      </header>
      <div className="github-panel-card-body">{children}</div>
    </section>
  )
}
