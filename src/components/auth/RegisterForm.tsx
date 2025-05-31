
'use client';

import { useActionState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { registerUserAction } from '@/actions/userActions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { UserPlus, LogIn, KeyRound } from 'lucide-react';
import { useRouter } from 'next/navigation';

const initialRegisterState = {
  message: '',
  success: false,
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? 'Registrando...' : 'Registrarse'}
    </Button>
  );
}

export default function RegisterForm() {
  const [state, formAction] = useActionState(registerUserAction, initialRegisterState);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (state?.message) {
      toast({
        title: state.success ? 'Registro Exitoso' : 'Error en Registro',
        description: state.message,
        variant: state.success ? 'default' : 'destructive',
      });
      if (state.success) {
        router.push('/auth/login');
      }
    }
  }, [state, toast, router]);

  return (
    <div className="max-w-md mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-2xl">
            <UserPlus className="mr-3 h-6 w-6 text-primary" />
            Crear Cuenta
          </CardTitle>
          <CardDescription>
            Ingresa tus datos para crear una nueva cuenta. El nombre de usuario y el correo electrónico deben ser únicos.
            La contraseña debe tener al menos 6 caracteres.
          </CardDescription>
        </CardHeader>
        <form action={formAction}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username">Nombre de Usuario</Label>
              <Input id="username" name="username" placeholder="Ej: LectorPro123" required />
              <p className="text-xs text-muted-foreground">Mínimo 3 caracteres. Solo letras, números, '_', '-', '.'</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input id="email" name="email" type="email" placeholder="Ej: tu_correo@ejemplo.com" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" name="password" type="password" placeholder="Tu contraseña" required />
               <p className="text-xs text-muted-foreground">Mínimo 6 caracteres.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
              <Input id="confirmPassword" name="confirmPassword" type="password" placeholder="Confirma tu contraseña" required />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 pt-6">
            <SubmitButton />
             <p className="text-sm text-muted-foreground">
              ¿Ya tienes una cuenta?{' '}
              <Button variant="link" asChild className="p-0 h-auto">
                <Link href="/auth/login">
                  Inicia Sesión Aquí
                  <LogIn className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
            </p>
          </CardFooter>
        </form>
      </Card>
      {state?.message && !state.success && (
         <Card className="mt-6 bg-red-50 dark:bg-red-900/30 border-red-300 dark:border-red-700">
          <CardHeader>
            <CardTitle className="text-red-700 dark:text-red-400 text-base">Error en Registro</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-red-600 dark:text-red-500">
            <p>{state.message}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
