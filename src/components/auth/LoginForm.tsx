
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
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

const initialLoginState = {
  message: '',
  success: false,
  username: undefined as string | undefined,
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
  const { login, currentUser, isLoading: authIsLoading } = useAuth();

  useEffect(() => {
    if (authIsLoading) return; // Wait for auth state to load

    if (currentUser) {
      router.push('/admin/dashboard'); // Redirect if already logged in
    }
  }, [currentUser, router, authIsLoading]);

  useEffect(() => {
    if (state?.message) {
      toast({
        title: state.success ? 'Inicio de Sesión Exitoso' : 'Error de Inicio de Sesión',
        description: state.message,
        variant: state.success ? 'default' : 'destructive',
      });
      if (state.success && state.username) {
        login(state.username); // Update auth context/localStorage
        router.push('/admin/dashboard'); // Redirect to dashboard
      }
    }
  }, [state, toast, login, router]);


  if (authIsLoading) {
      return <div className="flex justify-center items-center h-32"><p>Cargando...</p></div>;
  }

  return (
    <div className="max-w-md mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-2xl">
            <LogIn className="mr-3 h-6 w-6 text-primary" />
            Iniciar Sesión
          </CardTitle>
          <CardDescription>
            Ingresa tu nombre de usuario para acceder a tu panel.
          </CardDescription>
        </CardHeader>
        <form action={formAction}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username">Nombre de Usuario</Label>
              <Input id="username" name="username" placeholder="Tu nombre de usuario" required />
            </div>
            {/* Password field would go here in a real system */}
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
