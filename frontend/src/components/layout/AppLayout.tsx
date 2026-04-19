import { Link, Outlet, useLocation } from 'react-router-dom'
import { Bell, MessageSquareMore, CircleHelp, ChevronDown } from 'lucide-react'

export default function AppLayout() {
  const location = useLocation()

  const navItems = [
    { name: 'Matches', path: '/matches' },
    { name: 'Jobs', path: '/jobs' },
    { name: 'Documents', path: '/documents' },
    { name: 'Profile', path: '/profile' },
  ]

  return (
    <div className="min-h-screen bg-[#41413F] text-white">
      <header className="flex h-20 items-center justify-between border-b border-white/5 bg-[#161616] px-6 md:px-10">
        <div className="flex items-center gap-12">
          <Link to="/matches" className="flex items-center gap-1">
            <span className="text-[34px] font-black italic leading-none tracking-tight text-white">
              Flash
            </span>
            <span className="mb-4 block h-2.5 w-2.5 rounded-full bg-[#E7F12E]" />
          </Link>

          <nav className="hidden items-center gap-10 md:flex">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`text-[15px] transition ${
                    isActive
                      ? 'text-[#E7F12E]'
                      : 'text-[#E7F12E] opacity-80 hover:opacity-100'
                  }`}
                >
                  {item.name}
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="flex items-center gap-5">
          <button className="text-white/85 transition hover:text-white">
            <Bell size={20} strokeWidth={2} />
          </button>
          <button className="text-white/85 transition hover:text-white">
            <MessageSquareMore size={20} strokeWidth={2} />
          </button>
          <button className="text-white/85 transition hover:text-white">
            <CircleHelp size={20} strokeWidth={2} />
          </button>

          <div className="mx-1 h-10 w-px bg-white/20" />

          <button className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#E7F12E] font-semibold text-black">
              FL
            </div>
            <ChevronDown size={18} className="text-white" />
          </button>
        </div>
      </header>

      <main className="px-4 py-6 md:px-8">
        <Outlet />
      </main>
    </div>
  )
}