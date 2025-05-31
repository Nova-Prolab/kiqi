
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Settings, LogIn, UserPlus, LogOut, LayoutDashboard } from 'lucide-react';
import { ModeToggle } from '@/components/layout/ModeToggle';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar"


export default function AppHeader() {
  const { currentUser, logout, isLoading } = useAuth();

  const getInitials = (name: string | undefined) => {
    if (!name) return 'U';
    return name.substring(0, 2).toUpperCase();
  };


  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <Link href="/" className="flex items-center space-x-2 mr-auto">
          <Image 
            src="https://i.imgur.com/oDm44VN.png" 
            alt="Kiqi! Logo" 
            width={32} // Adjust as needed
            height={32} // Adjust as needed
            className="h-8 w-8" // Tailwind classes for responsive size
          />
          <span className="font-bold text-xl text-primary tracking-tight">
            Kiqi!
          </span>
        </Link>
        
        <nav className="flex items-center space-x-2 lg:space-x-4">
          {/* Future nav links can go here */}
        </nav>

        <div className="flex items-center space-x-2 ml-4">
          <ModeToggle />
          {isLoading ? (
            <div className="w-24 h-9 bg-muted rounded-md animate-pulse"></div>
          ) : currentUser ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9">
                    {/* Placeholder for user avatar image if you add it later */}
                    {/* <AvatarImage src="https://github.com/shadcn.png" alt={currentUser.username} /> */}
                    <AvatarFallback>{getInitials(currentUser.username)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">Hola, {currentUser.username}</p>
                    {/* <p className="text-xs leading-none text-muted-foreground">
                      m@example.com
                    </p> */}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/admin/dashboard">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    <span>Panel de Administración</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Cerrar Sesión</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="outline" size="sm" asChild>
                <Link href="/auth/login">
                  <LogIn className="mr-1.5 h-4 w-4" /> Iniciar Sesión
                </Link>
              </Button>
              <Button variant="default" size="sm" asChild>
                <Link href="/auth/register">
                  <UserPlus className="mr-1.5 h-4 w-4" /> Registrarse
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
