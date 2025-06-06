
'use client';

import { useActionState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { loginUserAction } from '@/actions/userActions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { LogIn, UserPlus } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import type { User } from '@/lib/types';

const initialLoginState: {
  message: string;
  success: boolean;
  user?: Pick<User, 'id' | 'username'>;
} = {
  message: '',
  success: false,
  user: undefined,
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? 'Iniciando Sesión...' : 'Iniciar Sesión'}
    </Button>
  );
}

export default function LoginForm() {
  const [state, formAction] = useActionState(loginUserAction, initialLoginState);
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, currentUser, isLoading: authIsLoading } = useAuth();

  useEffect(() => {
    if (state?.message) {
      toast({
        title: state.success ? 'Inicio de Sesión Exitoso' : 'Error de Inicio de Sesión',
        description: state.message,
        variant: state.success ? 'default' : 'destructive',
      });
      if (state.success && state.user) {
        login(state.user); // Update auth state for other components like AppHeader

        // Use requestAnimationFrame to ensure state updates are processed before redirect
        requestAnimationFrame(() => {
          const redirectUrl = searchParams.get('redirect') || '/admin/dashboard';
          router.push(redirectUrl);
        });
      }
    }
  }, [state, toast, login, router, searchParams]);

  // This useEffect handles redirecting if the user is already logged in when visiting the page
  useEffect(() => {
    if (!authIsLoading && currentUser) {
      // If already logged in (e.g. navigating back to /login), redirect away
      const redirectUrl = searchParams.get('redirect') || '/admin/dashboard';
      router.push(redirectUrl);
    }
  }, [currentUser, authIsLoading, router, searchParams]);


  if (authIsLoading && !currentUser) {
      return <div className="flex justify-center items-center h-32"><p>Cargando...</p></div>;
  }
  // If already logged in (currentUser is set), the useEffect above will redirect.

  return (
    <div className="max-w-md mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-2xl">
            <LogIn className="mr-3 h-6 w-6 text-primary" />
            Iniciar Sesión
          </CardTitle>
          <CardDescription>
            Ingresa tu nombre de usuario o correo electrónico y tu contraseña.
          </CardDescription>
        </CardHeader>
        <form action={formAction}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="identifier">Nombre de Usuario o Correo Electrónico</Label>
              <Input id="identifier" name="identifier" placeholder="Tu nombre de usuario o correo" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" name="password" type="password" placeholder="Tu contraseña" required />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 pt-6">
            <SubmitButton />
             <p className="text-sm text-muted-foreground">
              ¿No tienes una cuenta?{' '}
              <Button variant="link" asChild className="p-0 h-auto">
                <Link href="/auth/register">
                  Regístrate Aquí
                  <UserPlus className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
            </p>
          </CardFooter>
        </form>
      </Card>
       {state?.message && !state.success && (
         <Card className="mt-6 bg-red-50 dark:bg-red-900/30 border-red-300 dark:border-red-700">
          <CardHeader>
            <CardTitle className="text-red-700 dark:text-red-400 text-base">Error de Inicio de Sesión</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-red-600 dark:text-red-500">
            <p>{state.message}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
