export default function AdminPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-lg mx-auto text-center space-y-6">
        <h1 className="text-3xl font-bold">Mentor Admin</h1>
        <p className="text-muted-foreground">
          Manage your mentorship sessions, subscribers, and settings.
        </p>
        <div className="rounded-lg border p-6 bg-muted/50">
          <p className="text-sm text-muted-foreground">
            Admin features coming in Phase 6. This page is protected and only
            accessible to the mentor email.
          </p>
        </div>
      </div>
    </div>
  )
}
