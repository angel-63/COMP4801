import { NavLink } from 'react-router-dom'

const navItems = [
  { to: '/matches', label: 'Matches' },
  { to: '/jobs', label: 'Jobs' },
  { to: '/documents', label: 'Documents' },
  { to: '/profile', label: 'Profile' },
]

export default function Sidebar() {
  return (
    <aside className="hidden w-64 border-r border-black/10 bg-white px-5 py-6 md:block">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--flash-yellow)] font-bold text-[var(--flash-dark)]">
          FL
        </div>
        <div>
          <p className="text-lg font-semibold">Flash</p>
          <p className="text-sm text-black/50">Job platform</p>
        </div>
      </div>

      <nav className="space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `block rounded-2xl px-4 py-3 text-sm font-medium transition ${
                isActive
                  ? 'bg-[var(--flash-navy)] text-white'
                  : 'text-[var(--flash-dark)] hover:bg-black/5'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}