import { Link, useLocation, useNavigate } from 'react-router-dom'

const pageTitles: Record<string, string> = {
  '/matches': 'Matches',
  '/jobs': 'Jobs',
  '/documents': 'Documents',
  '/profile': 'Profile',
  '/settings': 'Settings',
}

export default function Topbar() {
  const location = useLocation()
  const navigate = useNavigate()

  const title = pageTitles[location.pathname] ?? 'Flash'

  const handleSignOut = () => {
    localStorage.removeItem('isLoggedIn')
    navigate('/login')
  }

  return (
    <header className="flex items-center justify-between border-b border-black/10 bg-[var(--flash-bg)] px-6 py-4">
      <div>
        <p className="text-sm text-black/50">Flash</p>
        <h1 className="text-lg font-semibold">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        <Link
          to="/settings"
          className="rounded-2xl border border-black/10 bg-white px-4 py-2 text-sm hover:bg-black/5"
        >
          Setting
        </Link>

        <Link
          to="/profile"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--flash-yellow)] text-sm font-semibold text-[var(--flash-dark)]"
        >
          FL
        </Link>

        <button
          onClick={handleSignOut}
          className="rounded-2xl border border-black/10 bg-white px-4 py-2 text-sm hover:bg-black/5"
        >
          Sign out
        </button>
      </div>
    </header>
  )
}