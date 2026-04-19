export default function SettingsPage() {
  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h2 className="text-3xl font-semibold">Settings</h2>
        <p className="mt-2 text-black/60">
          Update your account preferences and app settings.
        </p>
      </div>

      <div className="rounded-[28px] bg-white p-6 shadow-sm">
        <div className="space-y-6">
          <div>
            <h3 className="mb-2 font-semibold">Account</h3>
            <p className="text-sm text-black/60">
              Email notifications, password, and account details will go here later.
            </p>
          </div>

          <div>
            <h3 className="mb-2 font-semibold">Preferences</h3>
            <p className="text-sm text-black/60">
              Job preferences and personalization settings will be added in Phase 2.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}