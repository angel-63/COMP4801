import { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'

export default function LoginPage() {
  const navigate = useNavigate()

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    localStorage.setItem('isLoggedIn', 'true')
    navigate('/matches')
  }

  return (
    <div className="min-h-screen bg-[#1E1E1D] text-white">
      <header className="flex items-center justify-between bg-black px-8 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[#FCFF56] font-bold text-black">
            F
          </div>
          <span className="text-lg font-semibold">Flash</span>
        </div>
      </header>

      <main className="flex min-h-[calc(100vh-72px)]">
        <section className="flex w-full items-center justify-center px-6 py-10 lg:w-1/2">
          <div className="w-full max-w-md rounded-[28px] bg-[#2A2A2A] p-8 shadow-lg">
            <h1 className="text-3xl font-semibold leading-tight">Welcome back</h1>
            <p className="mt-2 text-sm text-white/65">Sign in to continue with Flash.</p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium">Email</label>
                <input
                  type="email"
                  placeholder="Email address"
                  required
                  className="w-full rounded-2xl border border-white/10 bg-[#1E1E1D] px-4 py-3 text-white outline-none placeholder:text-white/35 focus:border-[#FCFF56]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Password</label>
                <input
                  type="password"
                  placeholder="Password"
                  required
                  className="w-full rounded-2xl border border-white/10 bg-[#1E1E1D] px-4 py-3 text-white outline-none placeholder:text-white/35 focus:border-[#FCFF56]"
                />
              </div>

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

        <section className="hidden lg:flex lg:w-1/2 items-center justify-center bg-[#CECEC9]">
          <div className="flex h-[72%] w-[72%] items-center justify-center rounded-[32px] border border-black/10 bg-white/30 text-lg font-medium text-black/55">
            Illustration Area
          </div>
        </section>
      </main>
    </div>
  )
}