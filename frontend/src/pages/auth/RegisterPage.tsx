import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useState } from "react";
import { setCurrentUserEmail, setCurrentUserId } from '../../lib/profileApi'

import illustration from '../../assets/Right.png'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    const form = new FormData(e.currentTarget);

    const firstName = String(form.get("firstName") || "").trim();
    const lastName = String(form.get("lastName") || "").trim();
    const email = String(form.get("email") || "").trim();
    const password = String(form.get("password") || "");
    const confirmPassword = String(form.get("confirmPassword") || "");

    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setIsSubmitting(true);

      const pendingRegistration = {
        firstName,
        lastName,
        email,
      };

      localStorage.setItem("pendingRegistration", JSON.stringify(pendingRegistration));
      localStorage.setItem("isLoggedIn", "true");
      setCurrentUserId(email);
      setCurrentUserEmail(email);

      navigate("/onboarding");

    } catch (err) {
      console.error(err);
      setError("Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1E1E1D] text-white">
      <header className="flex h-20 items-center justify-between border-b border-white/5 bg-[#161616] px-6 md:px-10">
        <Link to="/" className="flex items-center gap-1">
          <span className="text-[34px] font-black italic leading-none tracking-tight text-white">
            Flash
          </span>
          <span className="mb-4 block h-2.5 w-2.5 rounded-full bg-[#E7F12E]" />
        </Link>
      </header>

      <main className="flex min-h-[calc(100vh-80px)]">
        <section className="flex w-full items-center justify-center px-6 py-10 lg:w-1/2">
          <div className="w-full max-w-md rounded-[28px] bg-[#2A2A2A] p-8 shadow-lg">
            <h1 className="text-3xl font-semibold leading-tight">Create account</h1>
            <p className="mt-2 text-sm text-white/65">Start your journey with Flash.</p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium">First name</label>
                  <input
                    name="firstName"
                    type="text"
                    placeholder="First name"
                    required
                    className="w-full rounded-2xl border border-white/10 bg-[#1E1E1D] px-4 py-3 text-white outline-none placeholder:text-white/35 focus:border-[#FCFF56]"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">Last name</label>
                  <input
                    name="lastName"
                    type="text"
                    placeholder="Last name"
                    required
                    className="w-full rounded-2xl border border-white/10 bg-[#1E1E1D] px-4 py-3 text-white outline-none placeholder:text-white/35 focus:border-[#FCFF56]"
                  />
                </div>
              </div>

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

              <div>
                <label className="mb-2 block text-sm font-medium">Confirm password</label>
                <input
                  name="confirmPassword"
                  type="password"
                  placeholder="Confirm password"
                  required
                  className="w-full rounded-2xl border border-white/10 bg-[#1E1E1D] px-4 py-3 text-white outline-none placeholder:text-white/35 focus:border-[#FCFF56]"
                />
              </div>

              <p className="text-xs leading-5 text-white/55">
                By signing up, you agree to our Terms and Conditions and Privacy Policy.
              </p>

              {error ? <p className="text-sm text-red-300">{error}</p> : null}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-2xl bg-[#FCFF56] px-4 py-3 font-semibold text-black transition hover:opacity-95"
              >
                {isSubmitting ? "Preparing..." : "Create account"}
              </button>
            </form>

            <p className="mt-6 text-sm text-white/65">
              Already have an account?{' '}
              <Link to="/" className="font-medium text-[#FCFF56] hover:underline">
                Log in
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
