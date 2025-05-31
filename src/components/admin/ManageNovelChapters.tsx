
'use client';

import { useActionState, useEffect, useRef, useState, useTransition } from 'react';
import { useFormStatus } from 'react-dom';
import { saveChapterAction } from '@/actions/novelAdminActions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle, AlertTriangle, Edit3, Bold, Italic, Highlighter, Sparkles, Lightbulb, SpellCheck } from 'lucide-react';
import Link from 'next/link';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ManageNovelChaptersProps {
  novelId: string;
  novelTitle: string;
}

const initialChapterSaveState = {
  message: '',
  success: false,
  chapterPath: undefined as string | undefined,
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
  const [isPendingFormActions, startFormResetTransition] = useTransition();
  const [chapterContent, setChapterContent] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (state?.message && !isPendingFormActions) {
      toast({
        title: state.success ? 'Capítulo Guardado' : 'Error al Guardar Capítulo',
        description: state.message,
        variant: state.success ? 'default' : 'destructive',
        duration: 5000,
      });

      if (state.success) {
        startFormResetTransition(() => {
          formRef.current?.reset();
          setChapterContent(''); 
        });
      }
    }
  }, [state, toast, isPendingFormActions]);

  const applyFormat = (formatType: 'bold' | 'italic' | 'highlight') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);

    if (!selectedText) {
      toast({ title: "Sin Selección", description: "Por favor, selecciona el texto al que quieres aplicar el formato.", variant: "destructive" });
      return;
    }

    let prefix = '', suffix = '';
    switch (formatType) {
      case 'bold':
        prefix = '<strong>'; suffix = '</strong>';
        break;
      case 'italic':
        prefix = '<em>'; suffix = '</em>';
        break;
      case 'highlight':
        prefix = '<mark>'; suffix = '</mark>';
        break;
    }

    const newText = `${textarea.value.substring(0, start)}${prefix}${selectedText}${suffix}${textarea.value.substring(end)}`;
    setChapterContent(newText);

    // Intenta re-seleccionar el texto o mover el cursor
    // Esto es una simplificación y puede no ser perfecto
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + selectedText.length);
    }, 0);
  };

  const handleIaFeature = (featureName: string) => {
    alert(`${featureName}: Esta funcionalidad aún no está implementada.`);
  };

  return (
    <Card className="mt-8 border-primary/50 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center text-xl">
          <Edit3 className="mr-3 h-6 w-6 text-primary" />
          Escribir/Editar Capítulo para: <span className="ml-2 font-semibold">{novelTitle}</span>
        </CardTitle>
        <CardDescription>
          Escribe el contenido del capítulo. Utiliza las herramientas de formato o escribe HTML directamente.
          Si guardas un capítulo con un número existente, se sobrescribirá.
        </CardDescription>
      </CardHeader>
      <form action={formAction} ref={formRef}>
        <input type="hidden" name="novelId" value={novelId} />
        {/* Campo oculto para enviar el contenido HTML al server action */}
        <input type="hidden" name="chapterContent" value={chapterContent} />

        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="space-y-2 sm:col-span-1">
              <Label htmlFor="chapterNumber">Número de Capítulo <span className="text-destructive">*</span></Label>
              <Input
                id="chapterNumber"
                name="chapterNumber"
                type="number"
                min="1"
                placeholder="Ej: 1"
                required
                disabled={isPendingFormActions}
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
                disabled={isPendingFormActions}
              />
              <p className="text-xs text-muted-foreground">Si se proporciona, se añadirá como un encabezado H1 al inicio del capítulo.</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="chapterContentArea">Contenido del Capítulo <span className="text-destructive">*</span></Label>
            
            <TooltipProvider delayDuration={100}>
              <div className="flex items-center gap-1 p-2 border rounded-t-md bg-muted/50">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button type="button" variant="ghost" size="icon" onClick={() => applyFormat('bold')} aria-label="Negrita">
                      <Bold className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p>Negrita (Ctrl+B)</p></TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button type="button" variant="ghost" size="icon" onClick={() => applyFormat('italic')} aria-label="Cursiva">
                      <Italic className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p>Cursiva (Ctrl+I)</p></TooltipContent>
                </Tooltip>
                 <Tooltip>
                  <TooltipTrigger asChild>
                    <Button type="button" variant="ghost" size="icon" onClick={() => applyFormat('highlight')} aria-label="Resaltar">
                      <Highlighter className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p>Resaltar</p></TooltipContent>
                </Tooltip>

                <div className="mx-2 h-5 border-l border-border"></div> {/* Separador */}

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button type="button" variant="ghost" size="icon" onClick={() => handleIaFeature('Sugerir Diálogo')} aria-label="Sugerir Diálogo con IA">
                      <Sparkles className="h-4 w-4 text-purple-500" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p>Sugerir Diálogo (IA) - Próximamente</p></TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                     <Button type="button" variant="ghost" size="icon" onClick={() => handleIaFeature('Sugerir Idea de Trama')} aria-label="Sugerir Idea de Trama con IA">
                      <Lightbulb className="h-4 w-4 text-yellow-500" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p>Sugerir Idea (IA) - Próximamente</p></TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button type="button" variant="ghost" size="icon" onClick={() => handleIaFeature('Corregir Ortografía')} aria-label="Corregir Ortografía con IA">
                      <SpellCheck className="h-4 w-4 text-blue-500" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p>Corregir Ortografía (IA) - Próximamente</p></TooltipContent>
                </Tooltip>
              </div>
            </TooltipProvider>
            
            <Textarea
              id="chapterContentArea" // ID diferente para evitar conflicto con el input oculto
              ref={textareaRef}
              value={chapterContent}
              onChange={(e) => setChapterContent(e.target.value)}
              placeholder="Escribe el contenido del capítulo aquí. Puedes usar las herramientas de formato o escribir HTML directamente (ej: <p>Párrafo</p>, <strong>Negrita</strong>)."
              rows={25} // Aumentado para más espacio
              required
              disabled={isPendingFormActions}
              className="min-h-[500px] resize-y rounded-t-none focus:z-10" // rounded-t-none para que se junte con la barra
            />
             <p className="text-xs text-muted-foreground mt-1">El contenido se guardará como HTML. Las herramientas básicas insertan etiquetas HTML.</p>
          </div>
           <p className="text-xs text-muted-foreground"><span className="text-destructive">*</span> Campos obligatorios</p>
        </CardContent>
        <CardFooter className="flex flex-col items-start sm:flex-row sm:justify-end gap-4 pt-6">
          <SubmitChapterButton />
        </CardFooter>
      </form>

      {state?.message && !isPendingFormActions && (
        <div className="p-4 mt-4 text-sm rounded-md">
          {state.success && state.chapterPath && (
            <div className="bg-green-50 dark:bg-green-900/30 border border-green-300 dark:border-green-700 p-4 rounded-md text-green-700 dark:text-green-300">
              <div className="flex items-center font-semibold mb-2">
                <CheckCircle className="mr-2 h-5 w-5" />
                ¡Éxito!
              </div>
              <p>{state.message}</p>
              <p className="mt-1">
                Puedes <Link href={state.chapterPath} className="underline hover:text-primary font-medium">ver el capítulo aquí</Link> (puede tardar unos segundos en reflejar los cambios).
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
