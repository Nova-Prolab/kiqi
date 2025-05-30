
'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { handleChapterUploadsAction } from '@/actions/novelAdminActions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { UploadCloud, AlertTriangle, CheckCircle } from 'lucide-react';

interface ChapterUploadFormProps {
  novelId: string;
  novelTitle: string;
}

const initialChapterUploadState = {
  message: '',
  successFiles: [],
  failedFiles: [],
  isSuccessOverall: undefined,
};

function SubmitChaptersButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full sm:w-auto">
      {pending ? 'Subiendo Capítulos...' : 'Subir Capítulos Seleccionados'}
      {pending && <UploadCloud className="ml-2 h-4 w-4 animate-pulse" />}
    </Button>
  );
}

export default function ChapterUploadForm({ novelId, novelTitle }: ChapterUploadFormProps) {
  const [state, formAction] = useFormState(handleChapterUploadsAction, initialChapterUploadState);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null); // Ref for resetting file input

  useEffect(() => {
    if (state?.message) {
      const successCount = state.successFiles.length;
      const failureCount = state.failedFiles.length;
      let title = 'Resultado de Subida de Capítulos';
      let variant: 'default' | 'destructive' = 'default';

      if (failureCount > 0 && successCount === 0) {
        title = 'Error al Subir Capítulos';
        variant = 'destructive';
      } else if (failureCount > 0 && successCount > 0) {
        title = 'Subida de Capítulos Parcial';
        variant = 'default'; // Or a custom warning variant if you have one
      } else if (successCount > 0 && failureCount === 0) {
        title = 'Capítulos Subidos con Éxito';
      } else if (state.message === 'No se seleccionaron archivos de capítulo.' || state.message === "No se procesaron archivos válidos."){
        // Don't toast for "no files selected" as it's not a server error.
        // The message will be displayed below the form.
        return;
      }


      toast({
        title: title,
        description: state.message,
        variant: variant,
        duration: (successCount > 0 || failureCount > 0) ? 8000 : 5000, // Longer duration if there are results
      });

      // Reset file input if there were successful uploads to prevent re-uploading same files
      if (successCount > 0 && fileInputRef.current) {
        fileInputRef.current.value = ''; 
      }
    }
  }, [state, toast]);

  return (
    <Card className="mt-8 border-primary/50 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center text-xl">
          <UploadCloud className="mr-3 h-6 w-6 text-primary" />
          Subir Capítulos para: <span className="ml-2 font-semibold">{novelTitle}</span>
        </CardTitle>
        <CardDescription>
          Selecciona los archivos HTML de los capítulos para la novela.
          Asegúrate de que los archivos estén nombrados correctamente (ej: <code>chapter-1.html</code>, <code>chapter-2.html</code>).
          Los archivos existentes con el mismo nombre no se sobrescribirán y la subida fallará para esos archivos.
        </CardDescription>
      </CardHeader>
      <form action={formAction}>
        <input type="hidden" name="novelId" value={novelId} />
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="chapterFiles">Archivos de Capítulo (.html)</Label>
            <Input
              id="chapterFiles"
              name="chapterFiles"
              type="file"
              multiple
              accept=".html"
              ref={fileInputRef}
              className="block w-full text-sm text-slate-500 dark:text-slate-400
                         file:mr-4 file:py-2 file:px-4
                         file:rounded-full file:border-0
                         file:text-sm file:font-semibold
                         file:bg-primary/10 file:text-primary
                         hover:file:bg-primary/20
                         dark:file:bg-primary/80 dark:file:text-primary-foreground
                         dark:hover:file:bg-primary/70"
              required
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-start sm:flex-row sm:justify-end gap-4 pt-6">
          <SubmitChaptersButton />
        </CardFooter>
      </form>

      {state?.message && state.message !== 'No se seleccionaron archivos de capítulo.' && state.message !== "No se procesaron archivos válidos." && (
        <div className="p-4 mt-4 text-sm rounded-md">
          {state.isSuccessOverall === true && (
            <div className="bg-green-50 dark:bg-green-900/30 border border-green-300 dark:border-green-700 p-4 rounded-md text-green-700 dark:text-green-300">
              <div className="flex items-center font-semibold mb-2">
                <CheckCircle className="mr-2 h-5 w-5" />
                Resultados de la Subida:
              </div>
              <p>{state.message}</p>
            </div>
          )}
          {state.isSuccessOverall === false && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-300 dark:border-red-700 p-4 rounded-md text-red-700 dark:text-red-400">
              <div className="flex items-center font-semibold mb-2">
                <AlertTriangle className="mr-2 h-5 w-5" />
                 Resultados de la Subida:
              </div>
              <p>{state.message}</p>
            </div>
          )}
           {state.isSuccessOverall === undefined && state.failedFiles.length > 0 && state.successFiles.length > 0 && ( // Partial success
            <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700 p-4 rounded-md text-blue-700 dark:text-blue-300">
              <div className="flex items-center font-semibold mb-2">
                <AlertTriangle className="mr-2 h-5 w-5" /> {/* Could use a different icon for partial */}
                 Resultados de la Subida:
              </div>
              <p>{state.message}</p>
            </div>
          )}
        </div>
      )}
      {state?.message && (state.message === 'No se seleccionaron archivos de capítulo.' || state.message === "No se procesaron archivos válidos.") && !state.successFiles.length && !state.failedFiles.length && (
        <div className="p-4 mt-2 text-sm text-muted-foreground">
            <p>{state.message}</p>
        </div>
      )}
    </Card>
  );
}
