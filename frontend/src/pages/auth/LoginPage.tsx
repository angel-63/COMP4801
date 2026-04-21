import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { fetchUserProfileByEmail, setCurrentUserEmail, setCurrentUserId } from '../../lib/profileApi'
import { useState } from 'react'
import illustration from '../../assets/Right.png'

export default function LoginPage() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    const form = new FormData(e.currentTarget)
    const email = String(form.get('email') || '').trim()

    if (!email) {
      setError('Please enter your email.')
      return
    }

    try {
      const profile = await fetchUserProfileByEmail(email)
      setCurrentUserId(profile.id || email)
      setCurrentUserEmail(email)
    } catch (loadError) {
      if (loadError instanceof Error && loadError.message.includes('404')) {
        setError('No account was found for that email. Please register first.')
      } else {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load your profile.')
      }
      return
    }

    localStorage.setItem('isLoggedIn', 'true')
    navigate('/matches')
  }

  return (
    <div className="min-h-screen bg-[#1E1E1D] text-white">
      <header className="flex h-20 items-center justify-between border-b border-white/5 bg-[#161616] px-6 md:px-10">
        <Link to="/matches" className="flex items-center gap-1">
          <span className="text-[34px] font-black italic leading-none tracking-tight text-white">
            Flash
          </span>
          <span className="mb-4 block h-2.5 w-2.5 rounded-full bg-[#E7F12E]" />
        </Link>
      </header>

      <main className="flex min-h-[calc(100vh-80px)]">
        <section className="flex w-full items-center justify-center px-6 py-10 lg:w-1/2">
          <div className="w-full max-w-md rounded-[28px] bg-[#2A2A2A] p-8 shadow-lg">
            <h1 className="text-3xl font-semibold leading-tight">Welcome back</h1>
            <p className="mt-2 text-sm text-white/65">Sign in to continue with Flash.</p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium">Email</label>
                <input
                  name="email"
                  type="email"
                  placeholder="Email address"
                  required
                  className="w-full rounded-2xl border border-white/10 bg-[#1E1E1D] px-4 py-3 text-white outline-none placeholder:text-white/35 focus:border-[#FCFF56]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Password</label>
                <input
                  name="password"
                  type="password"
                  placeholder="Password"
                  required
                  className="w-full rounded-2xl border border-white/10 bg-[#1E1E1D] px-4 py-3 text-white outline-none placeholder:text-white/35 focus:border-[#FCFF56]"
                />
              </div>

              {error ? <p className="text-sm text-red-300">{error}</p> : null}

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-white/65">
                  <input type="checkbox" className="rounded" />
                  Remember me
                </label>
                <button type="button" className="text-[#FCFF56] hover:underline">
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                className="w-full rounded-2xl bg-[#FCFF56] px-4 py-3 font-semibold text-black transition hover:opacity-95"
              >
                Log in
              </button>
            </form>

            <p className="mt-6 text-sm text-white/65">
              Don&apos;t have an account?{' '}
              <Link to="/register" className="font-medium text-[#FCFF56] hover:underline">
                Register
              </Link>
            </p>
          </div>
        </section>

        <section className="hidden items-center justify-center lg:flex lg:w-1/2">
          <div className="flex h-full w-full items-center justify-center px-10 py-10">
            <img
              src={illustration}
              alt="Job application illustration"
              className="max-h-[78vh] max-w-[88%] object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.18)]"
            />
          </div>
        </section>
      </main>
    </div>
  )
}