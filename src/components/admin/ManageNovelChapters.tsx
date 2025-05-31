
'use client';

import { useActionState, useEffect, useRef, useState, useTransition } from 'react';
import { useFormStatus } from 'react-dom';
import { saveChapterAction } from '@/actions/novelAdminActions';
import { enhanceTextAction } from '@/actions/aiChapterActions'; // New AI action
import type { EnhancementType } from '@/ai/flows/enhance-text-flow'; // Type for AI
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
  Heading1, Heading2, Heading3, Pilcrow, Quote, Minus // New formatting icons
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

  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [activeAiFeature, setActiveAiFeature] = useState<EnhancementType | null>(null);


  useEffect(() => {
    if (state?.message && !isSavePending && !isPendingFormActions) { // Check isSavePending as well
      toast({
        title: state.success ? 'Capítulo Guardado' : 'Error al Guardar Capítulo',
        description: state.message,
        variant: state.success ? 'default' : 'destructive',
        duration: 5000,
      });

      if (state.success) {
        startFormResetTransition(() => {
          formRef.current?.reset(); // Resets native form fields
          // For chapterContent, which is controlled, we might need to clear it if desired,
          // or perhaps the user wants to continue editing the next chapter.
          // For now, let's clear it after successful save of a chapter.
          // If it's an "edit" scenario (loading existing content), this behavior might need adjustment.
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
      // Insert new line with tags if no text is selected for block elements
      const lineContent = `Título de ejemplo`; // Placeholder for new line
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

  const handleAiFeature = async (featureType: EnhancementType) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    let textToEnhance = textarea.value.substring(textarea.selectionStart, textarea.selectionEnd);
    const selectionStart = textarea.selectionStart;
    const selectionEnd = textarea.selectionEnd;

    if (!textToEnhance && (featureType === 'suggestDialogue' || featureType === 'correctGrammar' || featureType === 'summarizeSection')) {
      toast({ title: "Texto Requerido", description: `Por favor, selecciona algo de texto para '${featureType}'.`, variant: "destructive" });
      return;
    }
    if (!textToEnhance && featureType === 'suggestPlotIdea') {
        // For plot idea, if no selection, consider using a small portion of text around cursor or whole content?
        // For now, let's use the whole content if no selection.
        textToEnhance = chapterContent;
        if(!textToEnhance) {
             toast({ title: "Contenido Requerido", description: "Escribe algo de contenido en el capítulo para obtener una idea de trama.", variant: "destructive" });
             return;
        }
    }


    setIsAiLoading(true);
    setAiError(null);
    setActiveAiFeature(featureType);

    try {
      const result = await enhanceTextAction({ text: textToEnhance, enhancementType: featureType });
      if (result.enhancedText) {
        // Insert or replace text
        if (selectionStart !== selectionEnd || featureType === 'correctGrammar' || featureType === 'summarizeSection') { // If there was a selection or it's a replacement task
            const newFullText = chapterContent.substring(0, selectionStart) + result.enhancedText + chapterContent.substring(selectionEnd);
            setChapterContent(newFullText);
             setTimeout(() => {
                textarea.focus();
                textarea.setSelectionRange(selectionStart, selectionStart + result.enhancedText.length);
            }, 0);
        } else { // For suggestions like dialogue or plot idea if no text was selected (plot idea might append)
            const newFullText = `${chapterContent.substring(0, selectionEnd)}\n\n${result.enhancedText}\n\n${chapterContent.substring(selectionEnd)}`;
            setChapterContent(newFullText);
            setTimeout(() => {
                textarea.focus();
                textarea.setSelectionRange(selectionEnd + 2, selectionEnd + 2 + result.enhancedText.length);
            }, 0);
        }
        toast({ title: "Sugerencia de IA Aplicada", description: `La sugerencia para '${featureType}' ha sido aplicada.`, variant: "default" });

      } else if (result.error) {
        setAiError(result.error);
        toast({ title: "Error de IA", description: result.error, variant: "destructive" });
      }
    } catch (e: any) {
      setAiError(e.message || "Un error desconocido ocurrió con la IA.");
      toast({ title: "Error de IA", description: e.message || "Un error desconocido ocurrió con la IA.", variant: "destructive" });
    } finally {
      setIsAiLoading(false);
      setActiveAiFeature(null);
    }
  };
  
  const AiButton = ({ featureType, icon: Icon, label, tooltip }: { featureType: EnhancementType, icon: React.ElementType, label: string, tooltip: string }) => (
    <Tooltip>
        <TooltipTrigger asChild>
            <Button 
                type="button" 
                variant="ghost" 
                size="icon" 
                onClick={() => handleAiFeature(featureType)} 
                disabled={isAiLoading}
                aria-label={label}
            >
                {isAiLoading && activeAiFeature === featureType ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
            </Button>
        </TooltipTrigger>
        <TooltipContent><p>{tooltip}</p></TooltipContent>
    </Tooltip>
  );


  return (
    <Card className="mt-8 border-primary/50 shadow-lg flex flex-col h-full"> {/* h-full for card to expand */}
      <CardHeader>
        <CardTitle className="flex items-center text-xl">
          <Edit3 className="mr-3 h-6 w-6 text-primary" />
          Escribir/Editar Capítulo para: <span className="ml-2 font-semibold">{novelTitle}</span>
        </CardTitle>
        <CardDescription>
          Escribe el contenido del capítulo. Usa las herramientas para formato básico HTML o asistencia de IA.
          Si guardas un capítulo con un número existente, se sobrescribirá.
        </CardDescription>
      </CardHeader>
      <form action={formAction} ref={formRef} className="flex flex-col flex-grow"> {/* flex-grow for form */}
        <input type="hidden" name="novelId" value={novelId} />
        <input type="hidden" name="chapterContent" value={chapterContent} />

        <CardContent className="space-y-6 flex flex-col flex-grow"> {/* flex-grow for content */}
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

          <div className="space-y-2 flex flex-col flex-grow"> {/* flex-grow for editor area */}
            <Label htmlFor="chapterContentArea">Contenido del Capítulo <span className="text-destructive">*</span></Label>
            
            <TooltipProvider delayDuration={100}>
              <div className="flex flex-wrap items-center gap-1 p-2 border rounded-t-md bg-muted/50">
                {/* Basic Formatting */}
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

                {/* AI Features */}
                <AiButton featureType="suggestDialogue" icon={Sparkles} label="Sugerir Diálogo" tooltip="Sugerir Diálogo (IA) - Selecciona texto para contexto" />
                <AiButton featureType="suggestPlotIdea" icon={Lightbulb} label="Sugerir Idea" tooltip="Sugerir Idea de Trama (IA) - Usa texto seleccionado o todo el capítulo" />
                <AiButton featureType="correctGrammar" icon={SpellCheck} label="Corregir Ortografía" tooltip="Corregir Ortografía y Gramática (IA) - Selecciona texto" />
                <AiButton featureType="summarizeSection" icon={Edit3} label="Resumir Sección" tooltip="Resumir Sección (IA) - Selecciona texto" />

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
              disabled={isSavePending || isPendingFormActions || isAiLoading}
              className="min-h-[calc(100vh-28rem)] sm:min-h-[calc(100vh-25rem)] resize-y rounded-t-none focus:z-10 flex-grow w-full" 
            />
             <p className="text-xs text-muted-foreground mt-1">El contenido se guardará como HTML. Las herramientas insertan etiquetas HTML.</p>
             {aiError && <p className="text-xs text-destructive mt-1">Error IA: {aiError}</p>}
          </div>
           <p className="text-xs text-muted-foreground"><span className="text-destructive">*</span> Campos obligatorios</p>
        </CardContent>
        <CardFooter className="flex flex-col items-start sm:flex-row sm:justify-end gap-4 pt-6 mt-auto"> {/* mt-auto to push footer down */}
          <SubmitChapterButton />
        </CardFooter>
      </form>

      {state?.message && !isSavePending && !isPendingFormActions && ( // Use isSavePending
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
