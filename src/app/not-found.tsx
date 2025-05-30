import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Home } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-18rem)] text-center px-4">
      <AlertTriangle className="w-20 h-20 sm:w-24 sm:h-24 text-destructive mb-6 sm:mb-8" />
      <h1 className="text-4xl sm:text-5xl font-bold text-primary mb-3 sm:mb-4">404 - Page Not Found</h1>
      <p className="text-lg sm:text-xl text-muted-foreground mb-6 sm:mb-8 max-w-md">
        Oops! The page you are looking for does not exist, may have been moved, or you might not have permission to view it.
      </p>
      <Button asChild size="lg">
        <Link href="/">
          <Home className="mr-2 h-5 w-5" />
          Return to Home
        </Link>
      </Button>
    </div>
  )
}
