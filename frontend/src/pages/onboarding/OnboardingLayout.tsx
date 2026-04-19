import { Outlet } from 'react-router-dom'

const steps = ['Roles', 'Personal', 'Education', 'Experience', 'Project', 'Skills']

export default function OnboardingLayout() {
  return (
    <div className="min-h-screen bg-[var(--flash-bg)] px-6 py-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 rounded-3xl bg-white p-6 shadow-sm">
          <div className="mb-4 flex flex-wrap gap-2">
            {steps.map((step) => (
              <span
                key={step}
                className="rounded-full border border-black/10 px-4 py-2 text-sm"
              >
                {step}
              </span>
            ))}
          </div>

          <Outlet />
        </div>
      </div>
    </div>
  )
}