export function Footer() {
  return (
    <footer className="border-t">
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Mentorship. All rights reserved.
          </p>
          <div className="flex gap-4">
            <a
              href="/privacy"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Privacy
            </a>
            <a
              href="/terms"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Terms
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
