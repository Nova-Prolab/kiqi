
'use client';

import { useActionState, useEffect, useRef, useState, useTransition } from 'react';
import { useFormStatus } from 'react-dom';
import { saveChapterAction } from '@/actions/novelAdminActions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea'; // Import Textarea
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle, AlertTriangle, Edit3 } from 'lucide-react';
import Link from 'next/link';

interface ManageNovelChaptersProps {
  novelId: string;
  novelTitle: string;
}

const initialChapterSaveState = {
  message: '',
  success: false,
  chapterPath: undefined,
};

function SubmitChapterButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full sm:w-auto">
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Guardando Capítulo...
        </>
      ) : (
        'Guardar Capítulo'
      )}
    </Button>
  );
}

export default function ManageNovelChapters({ novelId, novelTitle }: ManageNovelChaptersProps) {
  const [state, formAction] = useActionState(saveChapterAction, initialChapterSaveState);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition(); // For form reset

  // State for chapter content is no longer needed here if Textarea value is directly read by FormData
  // const [chapterContent, setChapterContent] = useState(''); 

  useEffect(() => {
    if (state?.message) {
      toast({
        title: state.success ? 'Capítulo Guardado' : 'Error al Guardar Capítulo',
        description: state.message,
        variant: state.success ? 'default' : 'destructive',
        duration: 5000,
      });

      if (state.success) {
        startTransition(() => {
          formRef.current?.reset();
          // No need to clear a separate chapterContent state for Textarea
        });
      }
    }
  }, [state, toast]);

  return (
    <Card className="mt-8 border-primary/50 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center text-xl">
          <Edit3 className="mr-3 h-6 w-6 text-primary" />
          Escribir Capítulo para: <span className="ml-2 font-semibold">{novelTitle}</span>
        </CardTitle>
        <CardDescription>
          Escribe el contenido del capítulo. Si guardas un capítulo con un número existente, se sobrescribirá.
          Cada salto de línea en el área de texto se convertirá en un nuevo párrafo.
        </CardDescription>
      </CardHeader>
      <form action={formAction} ref={formRef}>
        <input type="hidden" name="novelId" value={novelId} />
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="space-y-2 sm:col-span-1">
              <Label htmlFor="chapterNumber">Número de Capítulo</Label>
              <Input
                id="chapterNumber"
                name="chapterNumber"
                type="number"
                min="1"
                placeholder="Ej: 1"
                required
                disabled={isPending}
              />
               <p className="text-xs text-muted-foreground">Este número se usará para el nombre del archivo y el orden.</p>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="chapterTitle">Título del Capítulo (Opcional)</Label>
              <Input
                id="chapterTitle"
                name="chapterTitle"
                type="text"
                placeholder="Ej: El Comienzo de la Aventura"
                disabled={isPending}
              />
              <p className="text-xs text-muted-foreground">Si se proporciona, se añadirá como un encabezado H1 al inicio del capítulo.</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="chapterContent">Contenido del Capítulo</Label>
            <Textarea
              id="chapterContent"
              name="chapterContent"
              placeholder="Escribe el contenido del capítulo aquí. Cada nueva línea será un nuevo párrafo en el HTML final."
              rows={15} // Adjust rows as needed
              required
              disabled={isPending}
              className="min-h-[400px] resize-y"
            />
             <p className="text-xs text-muted-foreground mt-1">El texto se guardará como HTML simple (párrafos).</p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-start sm:flex-row sm:justify-end gap-4 pt-6">
          <SubmitChapterButton />
        </CardFooter>
      </form>

      {state?.message && !isPending && ( // Only show feedback if not transitioning (form reset)
        <div className="p-4 mt-4 text-sm rounded-md">
          {state.success && state.chapterPath && (
            <div className="bg-green-50 dark:bg-green-900/30 border border-green-300 dark:border-green-700 p-4 rounded-md text-green-700 dark:text-green-300">
              <div className="flex items-center font-semibold mb-2">
                <CheckCircle className="mr-2 h-5 w-5" />
                ¡Éxito!
              </div>
              <p>{state.message}</p>
              <p className="mt-1">
                Puedes <Link href={state.chapterPath} className="underline hover:text-primary">ver el capítulo aquí</Link> (puede tardar unos segundos en reflejar los cambios).
              </p>
            </div>
          )}
          {!state.success && state.message && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-300 dark:border-red-700 p-4 rounded-md text-red-700 dark:text-red-400">
              <div className="flex items-center font-semibold mb-2">
                <AlertTriangle className="mr-2 h-5 w-5" />
                 Error:
              </div>
              <p>{state.message}</p>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
