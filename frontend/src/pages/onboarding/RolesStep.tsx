import { useNavigate } from 'react-router-dom'

const roleGroups = {
  Accounting: ['Accountant', 'Tax specialist', 'Payroll specialist', 'Auditor'],
  'Information Technology': ['Software developer', 'Software engineer', 'IT support', 'Database developer'],
  Marketing: ['Branding', 'Marketing analytics', 'Customer insights'],
  'Product Management': ['Product manager'],
}

export default function RolesStep() {
  const navigate = useNavigate()

  return (
    <div>
      <button className="mb-4 text-sm text-black/50">Back</button>
      <h2 className="text-2xl font-semibold">What kinds of roles are you interested in?</h2>

      <input
        placeholder="Search by job title"
        className="mt-5 w-full rounded-2xl border border-black/10 px-4 py-3"
      />

      <div className="mt-6 space-y-6">
        {Object.entries(roleGroups).map(([group, items]) => (
          <div key={group}>
            <h3 className="mb-3 font-medium">{group}</h3>
            <div className="flex flex-wrap gap-2">
              {items.map((item) => (
                <button
                  key={item}
                  className="rounded-full border border-black/10 px-4 py-2 text-sm hover:bg-[var(--flash-yellow)]"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 flex justify-end">
        <button
          onClick={() => navigate('/onboarding/personal')}
          className="rounded-2xl bg-[var(--flash-navy)] px-5 py-3 text-white"
        >
          Save and continue
        </button>
      </div>
    </div>
  )
}