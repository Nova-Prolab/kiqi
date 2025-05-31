
'use client';

import { useActionState, useEffect, useRef, useState, useTransition } from 'react';
import { useFormStatus } from 'react-dom';
import { saveChapterAction } from '@/actions/novelAdminActions';
// import { enhanceTextAction } from '@/actions/aiChapterActions'; // AI action removed
// import type { EnhancementType } from '@/ai/flows/enhance-text-flow'; // Type for AI removed
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { 
  Loader2, 
  CheckCircle, 
  AlertTriangle, 
  Edit3, 
  Bold, 
  Italic, 
  Highlighter, 
  Sparkles, // Suggest Dialogue
  Lightbulb, // Suggest Plot Idea
  SpellCheck, // Correct Grammar
  Heading1, Heading2, Heading3, Pilcrow, Quote, Minus
} from 'lucide-react';
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
  const [state, formAction, isSavePending] = useActionState(saveChapterAction, initialChapterSaveState);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const [isPendingFormActions, startFormResetTransition] = useTransition();
  
  const [chapterContent, setChapterContent] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // AI related states and functions removed
  // const [isAiLoading, setIsAiLoading] = useState(false);
  // const [aiError, setAiError] = useState<string | null>(null);
  // const [activeAiFeature, setActiveAiFeature] = useState<EnhancementType | null>(null);


  useEffect(() => {
    if (state?.message && !isSavePending && !isPendingFormActions) {
      toast({
        title: state.success ? 'Capítulo Guardado' : 'Error al Guardar Capítulo',
        description: state.message,
        variant: state.success ? 'default' : 'destructive',
        duration: 5000,
      });

      if (state.success) {
        startFormResetTransition(() => {
          formRef.current?.reset();
          // setChapterContent(''); 
        });
      }
    }
  }, [state, toast, isSavePending, isPendingFormActions]);


  const applyFormat = (formatType: 'bold' | 'italic' | 'highlight' | 'h1' | 'h2' | 'h3' | 'p' | 'blockquote' | 'hr') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    let newText = '';

    let prefix = '', suffix = '';
    let insertLine = false;

    switch (formatType) {
      case 'bold': prefix = '<strong>'; suffix = '</strong>'; break;
      case 'italic': prefix = '<em>'; suffix = '</em>'; break;
      case 'highlight': prefix = '<mark>'; suffix = '</mark>'; break;
      case 'h1': prefix = '<h1>'; suffix = '</h1>'; insertLine = true; break;
      case 'h2': prefix = '<h2>'; suffix = '</h2>'; insertLine = true; break;
      case 'h3': prefix = '<h3>'; suffix = '</h3>'; insertLine = true; break;
      case 'p': prefix = '<p>'; suffix = '</p>'; insertLine = true; break;
      case 'blockquote': prefix = '<blockquote><p>'; suffix = '</p></blockquote>'; insertLine = true; break;
      case 'hr': 
        newText = `${textarea.value.substring(0, start)}\n<hr />\n${textarea.value.substring(end)}`;
        setChapterContent(newText);
        setTimeout(() => { textarea.focus(); textarea.setSelectionRange(start + 8, start + 8); }, 0);
        return;
    }

    if (!selectedText && (formatType === 'h1' || formatType === 'h2' || formatType === 'h3' || formatType === 'p' || formatType === 'blockquote')) {
      const lineContent = `Título de ejemplo`;
      newText = `${textarea.value.substring(0, start)}${prefix}${lineContent}${suffix}\n${textarea.value.substring(end)}`;
      setChapterContent(newText);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + prefix.length, start + prefix.length + lineContent.length);
      }, 0);
      return;
    } else if (!selectedText && (formatType === 'bold' || formatType === 'italic' || formatType === 'highlight')) {
        toast({ title: "Sin Selección", description: "Por favor, selecciona el texto al que quieres aplicar el formato.", variant: "destructive" });
        return;
    }

    newText = `${textarea.value.substring(0, start)}${prefix}${selectedText}${suffix}${insertLine && end === textarea.value.length ? '\n' : ''}${textarea.value.substring(end)}`;
    setChapterContent(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + selectedText.length);
    }, 0);
  };

  // handleAiFeature function removed

  // AiButton component removed, direct disabled buttons with tooltips will be used.

  return (
    <Card className="mt-8 border-primary/50 shadow-lg flex flex-col h-full">
      <CardHeader>
        <CardTitle className="flex items-center text-xl">
          <Edit3 className="mr-3 h-6 w-6 text-primary" />
          Escribir/Editar Capítulo para: <span className="ml-2 font-semibold">{novelTitle}</span>
        </CardTitle>
        <CardDescription>
          Escribe el contenido del capítulo. Usa las herramientas para formato básico HTML.
          Si guardas un capítulo con un número existente, se sobrescribirá. Las funciones de IA están temporalmente desactivadas.
        </CardDescription>
      </CardHeader>
      <form action={formAction} ref={formRef} className="flex flex-col flex-grow">
        <input type="hidden" name="novelId" value={novelId} />
        <input type="hidden" name="chapterContent" value={chapterContent} />

        <CardContent className="space-y-6 flex flex-col flex-grow">
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
                disabled={isSavePending || isPendingFormActions}
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
                disabled={isSavePending || isPendingFormActions}
              />
              <p className="text-xs text-muted-foreground">Si se proporciona, se añadirá como un encabezado H1 al inicio del capítulo.</p>
            </div>
          </div>

          <div className="space-y-2 flex flex-col flex-grow">
            <Label htmlFor="chapterContentArea">Contenido del Capítulo <span className="text-destructive">*</span></Label>
            
            <TooltipProvider delayDuration={100}>
              <div className="flex flex-wrap items-center gap-1 p-2 border rounded-t-md bg-muted/50">
                <Tooltip><TooltipTrigger asChild><Button type="button" variant="ghost" size="icon" onClick={() => applyFormat('bold')} aria-label="Negrita"><Bold className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Negrita (Ctrl+B)</p></TooltipContent></Tooltip>
                <Tooltip><TooltipTrigger asChild><Button type="button" variant="ghost" size="icon" onClick={() => applyFormat('italic')} aria-label="Cursiva"><Italic className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Cursiva (Ctrl+I)</p></TooltipContent></Tooltip>
                <Tooltip><TooltipTrigger asChild><Button type="button" variant="ghost" size="icon" onClick={() => applyFormat('highlight')} aria-label="Resaltar"><Highlighter className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Resaltar</p></TooltipContent></Tooltip>
                <div className="mx-1 h-5 border-l border-border"></div>
                <Tooltip><TooltipTrigger asChild><Button type="button" variant="ghost" size="icon" onClick={() => applyFormat('p')} aria-label="Párrafo"><Pilcrow className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Párrafo</p></TooltipContent></Tooltip>
                <Tooltip><TooltipTrigger asChild><Button type="button" variant="ghost" size="icon" onClick={() => applyFormat('h1')} aria-label="Encabezado 1"><Heading1 className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Encabezado 1</p></TooltipContent></Tooltip>
                <Tooltip><TooltipTrigger asChild><Button type="button" variant="ghost" size="icon" onClick={() => applyFormat('h2')} aria-label="Encabezado 2"><Heading2 className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Encabezado 2</p></TooltipContent></Tooltip>
                <Tooltip><TooltipTrigger asChild><Button type="button" variant="ghost" size="icon" onClick={() => applyFormat('h3')} aria-label="Encabezado 3"><Heading3 className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Encabezado 3</p></TooltipContent></Tooltip>
                <Tooltip><TooltipTrigger asChild><Button type="button" variant="ghost" size="icon" onClick={() => applyFormat('blockquote')} aria-label="Cita"><Quote className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Cita en bloque</p></TooltipContent></Tooltip>
                 <Tooltip><TooltipTrigger asChild><Button type="button" variant="ghost" size="icon" onClick={() => applyFormat('hr')} aria-label="Línea Horizontal"><Minus className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Línea Horizontal</p></TooltipContent></Tooltip>

                <div className="mx-1 h-5 border-l border-border"></div>

                {/* AI Features Disabled */}
                <Tooltip><TooltipTrigger asChild><Button type="button" variant="ghost" size="icon" disabled aria-label="Sugerir Diálogo (Próximamente)"><Sparkles className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Sugerir Diálogo (Próximamente)</p></TooltipContent></Tooltip>
                <Tooltip><TooltipTrigger asChild><Button type="button" variant="ghost" size="icon" disabled aria-label="Sugerir Idea (Próximamente)"><Lightbulb className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Sugerir Idea de Trama (Próximamente)</p></TooltipContent></Tooltip>
                <Tooltip><TooltipTrigger asChild><Button type="button" variant="ghost" size="icon" disabled aria-label="Corregir Ortografía (Próximamente)"><SpellCheck className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Corregir Ortografía y Gramática (Próximamente)</p></TooltipContent></Tooltip>
                <Tooltip><TooltipTrigger asChild><Button type="button" variant="ghost" size="icon" disabled aria-label="Resumir Sección (Próximamente)"><Edit3 className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Resumir Sección (Próximamente)</p></TooltipContent></Tooltip>
              </div>
            </TooltipProvider>
            
            <Textarea
              id="chapterContentArea"
              ref={textareaRef}
              value={chapterContent}
              onChange={(e) => setChapterContent(e.target.value)}
              placeholder="Escribe el contenido del capítulo aquí. Puedes usar las herramientas de formato o escribir HTML directamente (ej: <p>Párrafo</p>, <strong>Negrita</strong>)."
              rows={30} 
              required
              disabled={isSavePending || isPendingFormActions /* || isAiLoading removed */}
              className="min-h-[calc(100vh-28rem)] sm:min-h-[calc(100vh-25rem)] resize-y rounded-t-none focus:z-10 flex-grow w-full" 
            />
             <p className="text-xs text-muted-foreground mt-1">El contenido se guardará como HTML. Las herramientas insertan etiquetas HTML.</p>
             {/* aiError display removed */}
          </div>
           <p className="text-xs text-muted-foreground"><span className="text-destructive">*</span> Campos obligatorios</p>
        </CardContent>
        <CardFooter className="flex flex-col items-start sm:flex-row sm:justify-end gap-4 pt-6 mt-auto">
          <SubmitChapterButton />
        </CardFooter>
      </form>

      {state?.message && !isSavePending && !isPendingFormActions && (
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
