
import Link from 'next/link';
import { BookMarked, PlusCircle } from 'lucide-react';
import { ModeToggle } from '@/components/layout/ModeToggle';
import { Button } from '@/components/ui/button';

export default function AppHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <Link href="/" className="flex items-center space-x-2 mr-6">
          <BookMarked className="h-8 w-8 text-primary" />
          <span className="font-bold text-xl text-primary tracking-tight">
            Literary Nexus
          </span>
        </Link>
        <nav className="flex items-center space-x-4 lg:space-x-6 flex-grow">
           {/* Example Nav Link:
           <Link
            href="/novels"
            className="text-sm font-medium transition-colors hover:text-primary text-muted-foreground data-[active=true]:text-primary"
            // Add logic for active state if using usePathname
           >
            Novels
          </Link> 
          */}
        </nav>
        <div className="flex items-center justify-end space-x-2">
          <Button variant="ghost" size="sm" asChild title="Crear Nueva Novela">
            <Link href="/admin/create-novel">
              <PlusCircle className="h-5 w-5" />
              <span className="sr-only sm:not-sr-only sm:ml-2">Crear</span>
            </Link>
          </Button>
          <ModeToggle />
        </div>
      </div>
    </header>
  );
}
