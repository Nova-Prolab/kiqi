
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import React, { useState, useEffect, useRef } from 'react';

// Inline SVG for Discord Icon
const DiscordIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    aria-hidden="true"
    role="img"
    width="24"
    height="24"
    preserveAspectRatio="xMidYMid meet"
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M19.27 5.33C17.94 4.71 16.5 4.26 15 4a.09.09 0 0 0-.07.03c-.18.33-.39.76-.53 1.09a16.09 16.09 0 0 0-4.8 0c-.14-.32-.35-.76-.54-1.09c0-.02-.03-.03-.07-.03c-1.5.26-2.93.71-4.27 1.33c-.01 0-.02.01-.03.02c-2.72 4.07-3.47 8.03-3.1 11.95c0 .02.01.04.03.05c1.8 1.32 3.53 2.12 5.24 2.65c.03.01.06 0 .07-.02c.4-.55.76-1.13 1.07-1.74c.02-.04 0-.08-.04-.09c-.57-.22-1.11-.48-1.64-.78c-.04-.02-.04-.08.01-.11c.11-.08.22-.17.33-.25c.02-.02.05-.02.07-.01c3.44 1.57 7.15 1.57 10.55 0c.02-.01.05-.01.07.01c.11.09.22.17.33.26c.04.03.05.09.01.11c-.52.31-1.07.56-1.64.78c-.04.01-.05.06-.04.09c.32.61.68 1.19 1.07 1.74c.03.01.06.02.09.01c1.72-.53 3.45-1.33 5.25-2.65c.02-.01.03-.03.03-.05c.44-4.53-.73-8.46-3.1-11.95c-.01-.01-.02-.02-.04-.02zM8.52 14.91c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12s1.89.95 1.89 2.12c0 1.17-.84 2.12-1.89 2.12zm6.97 0c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12s1.89.95 1.89 2.12c0 1.17-.84 2.12-1.89 2.12z"/>
  </svg>
);

const EASTER_EGG_TRIGGER_COUNT = 20;
const EASTER_EGG_DURATION = 15000; // 15 seconds

export default function AppHeader() {
  const { currentUser, logout, isLoading } = useAuth();
  const [logoClickCount, setLogoClickCount] = useState(0);
  const [easterEggActive, setEasterEggActive] = useState(false);
  const easterEggTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const getInitials = (name: string | undefined) => {
    if (!name) return 'U';
    return name.substring(0, 2).toUpperCase();
  };

  const handleLogoClick = () => {
    if (easterEggActive) return;
    setLogoClickCount(prevCount => prevCount + 1);
  };

  useEffect(() => {
    if (logoClickCount >= EASTER_EGG_TRIGGER_COUNT && !easterEggActive) {
      setEasterEggActive(true);
      setLogoClickCount(0);
    }
  }, [logoClickCount, easterEggActive]);

  useEffect(() => {
    if (easterEggActive) {
      document.documentElement.classList.add('easter-egg-mode');
      
      if (easterEggTimeoutRef.current) {
        clearTimeout(easterEggTimeoutRef.current);
      }
      
      easterEggTimeoutRef.current = setTimeout(() => {
        setEasterEggActive(false);
      }, EASTER_EGG_DURATION);
    } else {
      document.documentElement.classList.remove('easter-egg-mode');
      if (easterEggTimeoutRef.current) {
        clearTimeout(easterEggTimeoutRef.current);
        easterEggTimeoutRef.current = null;
      }
    }

    return () => {
      if (easterEggTimeoutRef.current) {
        clearTimeout(easterEggTimeoutRef.current);
      }
      // If unmounting while easter egg was active (based on the state when effect was set up)
      // ensure class is removed. This is important for navigation.
      if (easterEggActive && document.documentElement.classList.contains('easter-egg-mode')) {
         document.documentElement.classList.remove('easter-egg-mode');
      }
    };
  }, [easterEggActive]);


  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="flex items-center mr-auto">
          <Link href="/" className="flex items-center" onClick={handleLogoClick} aria-label="Kiqi! Home">
            <Image
              src="https://i.imgur.com/oDm44VN.png"
              alt="Kiqi! Logo"
              width={64}
              height={64}
              className="h-16 w-16" 
              priority
            />
          </Link>
          <Button asChild variant="outline" className="ml-4 hidden sm:flex">
            <a href="https://discord.gg/zQzV4ekTVV" target="_blank" rel="noopener noreferrer">
              <DiscordIcon className="mr-2 h-5 w-5" />
              Unirse a Discord
            </a>
          </Button>
        </div>

        <nav className="flex items-center space-x-2 lg:space-x-4">
          {/* Future nav links can go here */}
        </nav>

        <div className="flex items-center space-x-2 ml-4">
           <Button asChild variant="ghost" size="icon" className="sm:hidden">
            <a href="https://discord.gg/zQzV4ekTVV" target="_blank" rel="noopener noreferrer" aria-label="Unirse a Discord">
              <DiscordIcon className="h-5 w-5" />
            </a>
          </Button>
          <ModeToggle />
          {isLoading ? (
            <div className="w-24 h-9 bg-muted rounded-md animate-pulse"></div>
          ) : currentUser ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback>{getInitials(currentUser.username)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">Hola, {currentUser.username}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/admin/dashboard">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    <span>Panel de Administración</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link href="/admin/create-novel">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Crear Novela</span>
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
              <Button variant="default" size="sm" asChild className="hidden sm:flex">
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
