import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { ChevronDown } from 'lucide-react'
import { fetchCurrentUserProfile, getCachedUserProfile } from '../../lib/profileApi'
import { clearAuthSession } from '../../lib/authApi'
import type { UserProfile } from '../../types/profile'


const isTokenExpired = (): boolean => {
  const token = localStorage.getItem('authToken');
  if (!token) return true;
  try {
    const payloadBase64 = token.split('.')[1];
    const payload = JSON.parse(atob(payloadBase64));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
};

export default function AppLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [profile, setProfile] = useState<UserProfile | null>(() => getCachedUserProfile())
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false)
  const accountMenuRef = useRef<HTMLDivElement | null>(null)

  const navItems = [
    { name: 'Matches', path: '/matches' },
    { name: 'Jobs', path: '/jobs' },
    { name: 'Documents', path: '/documents' },
    { name: 'Profile', path: '/profile' },
  ]

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const nextProfile = await fetchCurrentUserProfile()
        setProfile(nextProfile)
      } catch {
        const cachedProfile = getCachedUserProfile()
        if (cachedProfile) {
          setProfile(cachedProfile)
        }
      }
    }

    void loadProfile()
  }, [])

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!accountMenuRef.current?.contains(event.target as Node)) {
        setIsAccountMenuOpen(false)
      }
    }

    window.addEventListener('mousedown', handlePointerDown)
    return () => {
      window.removeEventListener('mousedown', handlePointerDown)
    }
  }, [])

  const initials = useMemo(() => {
    const fullName =
      profile?.fullName?.trim() ||
      [profile?.firstName, profile?.lastName].filter(Boolean).join(' ').trim()

    if (!fullName) {
      return 'U'
    }

    return fullName
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || '')
      .join('')
  }, [profile?.firstName, profile?.fullName, profile?.lastName])

  const handleLogout = () => {
    clearAuthSession()
    window.localStorage.removeItem('userProfile')
    window.localStorage.removeItem('profile')
    window.localStorage.removeItem('pendingRegistration')
    window.localStorage.removeItem('pendingRegistrationEmail')
    setIsAccountMenuOpen(false)
    navigate('/')
  }

  useEffect(() => {
  const checkToken = () => {
    if (isTokenExpired()) {
      handleLogout(); // re‑use your existing logout function
    }
  };

  // periodic check whether jwt is expired (every 60s)
  checkToken();
  const intervalId = setInterval(checkToken, 60000);

  return () => clearInterval(intervalId);
}, []);

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

        <div ref={accountMenuRef} className="relative flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsAccountMenuOpen((prev) => !prev)}
            className="flex items-center gap-3 rounded-md px-1 py-1 transition hover:bg-white/5"
            aria-haspopup="menu"
            aria-expanded={isAccountMenuOpen}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#E7F12E] font-semibold text-black">
              {initials}
            </div>
            <ChevronDown
              size={18}
              className={`text-white transition ${isAccountMenuOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {isAccountMenuOpen ? (
            <div className="absolute right-0 top-[calc(100%+10px)] z-20 min-w-[160px] rounded-xl border border-white/10 bg-[#222220] p-2 shadow-[0_16px_36px_rgba(0,0,0,0.35)]">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full rounded-lg px-4 py-2 text-left text-sm text-white/90 transition hover:bg-white/8 hover:text-[#E7F12E]"
              >
                Logout
              </button>
            </div>
          ) : null}
        </div>
      </header>

      <main className="px-4 py-6 md:px-8">
        <Outlet />
      </main>
    </div>
  )
}
