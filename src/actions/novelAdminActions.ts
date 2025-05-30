
'use server';

import { z } from 'zod';
import { createFileInRepo } from '@/lib/github';
import type { InfoJson, CreateNovelInput } from '@/lib/types';
import { revalidatePath } from 'next/cache';

const createNovelSchema = z.object({
  title: z.string().min(1, "El título es obligatorio."),
  author: z.string().min(1, "El autor es obligatorio."),
  description: z.string().min(1, "La descripción es obligatoria."),
  coverImageUrl: z.string().url("URL de portada inválida.").optional().or(z.literal('')),
  category: z.string().optional(),
  tags: z.string().optional(), // Comma-separated
  translator: z.string().optional(),
  releaseDate: z.string().optional(), // Expects YYYY-MM-DD format if provided
});

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w-]+/g, '') // Remove all non-word chars
    .replace(/--+/g, '-'); // Replace multiple - with single -
}

export async function createNovelAction(
  prevState: { message: string; success: boolean; novelId?: string, novelTitle?: string } | null,
  formData: FormData
): Promise<{ message: string; success: boolean; novelId?: string, novelTitle?: string }> {
  
  const rawFormData: CreateNovelInput = {
    title: formData.get('title') as string,
    author: formData.get('author') as string,
    description: formData.get('description') as string,
    coverImageUrl: formData.get('coverImageUrl') as string | undefined,
    category: formData.get('category') as string | undefined,
    tags: formData.get('tags') as string | undefined, // Will be comma-separated
    translator: formData.get('translator') as string | undefined,
    releaseDate: formData.get('releaseDate') as string | undefined,
  };

  const validatedFields = createNovelSchema.safeParse(rawFormData);

  if (!validatedFields.success) {
    console.error("Validation errors:", validatedFields.error.flatten().fieldErrors);
    return {
      message: "Error de validación: " + Object.values(validatedFields.error.flatten().fieldErrors).flat().join(' '),
      success: false,
    };
  }

  const { data } = validatedFields;
  const novelId = slugify(data.title);

  if (!novelId) {
    return { message: "No se pudo generar un ID para la novela a partir del título.", success: false };
  }

  const tagsArray = data.tags ? data.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : undefined;

  const infoJson: InfoJson = {
    titulo: data.title,
    autor: data.author,
    descripcion: data.description.replace(/\r\n|\r|\n/g, '\\n'), // Ensure newlines are escaped for JSON
    coverImageUrl: data.coverImageUrl || undefined,
    categoria: data.category || undefined,
    etiquetas: tagsArray,
    traductor: data.translator || undefined,
    fecha_lanzamiento: data.releaseDate || undefined,
  };

  const infoJsonContent = JSON.stringify(infoJson, null, 2);
  const filePath = `${novelId}/info.json`;
  const commitMessage = `feat: Add new novel - ${data.title}`;

  try {
    console.log(`[AdminAction] Attempting to create file: ${filePath} for novel ID: ${novelId}`);
    await createFileInRepo(filePath, infoJsonContent, commitMessage);
    
    revalidatePath('/');
    revalidatePath(`/novels/${novelId}`);

    return { 
      message: `Novela '${data.title}' creada con éxito con ID '${novelId}'. El archivo de información ha sido añadido.`, 
      success: true, 
      novelId,
      novelTitle: data.title 
    };
  } catch (error) {
    console.error("Error creating novel info.json:", error);
    const errorMessage = error instanceof Error ? error.message : "Error desconocido al crear el archivo de información de la novela.";
    return {
      message: `Error al crear la novela: ${errorMessage}`,
      success: false,
    };
  }
}


// Schema for chapter saving
const saveChapterSchema = z.object({
  novelId: z.string().min(1, "El ID de la novela es obligatorio."),
  chapterNumber: z.coerce.number().int().positive("El número de capítulo debe ser un entero positivo."),
  chapterTitle: z.string().optional(),
  chapterContent: z.string().min(1, "El contenido del capítulo no puede estar vacío."),
});

interface SaveChapterState {
  message: string;
  success: boolean;
  chapterPath?: string;
}

export async function saveChapterAction(
  prevState: SaveChapterState | null,
  formData: FormData
): Promise<SaveChapterState> {
  const rawFormData = {
    novelId: formData.get('novelId') as string,
    chapterNumber: formData.get('chapterNumber') as string, // Will be coerced by Zod
    chapterTitle: formData.get('chapterTitle') as string | undefined,
    chapterContent: formData.get('chapterContent') as string,
  };

  const validatedFields = saveChapterSchema.safeParse(rawFormData);

  if (!validatedFields.success) {
    const fieldErrors = validatedFields.error.flatten().fieldErrors;
    const errorMessages = Object.values(fieldErrors).flat().join(' ');
    console.error("Chapter validation errors:", fieldErrors);
    return {
      message: `Error de validación: ${errorMessages}`,
      success: false,
    };
  }

  const { novelId, chapterNumber, chapterContent } = validatedFields.data;
  // chapterTitle is also in validatedFields.data but not directly used for filename or basic HTML structure

  // Convert plain text content to simple HTML: wrap each non-empty line in <p> tags
  const htmlContent = chapterContent
    .split('\n')
    .filter(line => line.trim() !== '') // Filter out lines that are only whitespace
    .map(line => `<p>${line.trim()}</p>`)
    .join('\n');
  
  if (!htmlContent.trim()) {
    return {
        message: "El contenido del capítulo resultó vacío después de procesar.",
        success: false,
    }
  }

  const chapterFilename = `chapter-${chapterNumber}.html`;
  const filePathInRepo = `${novelId}/${chapterFilename}`;
  const commitMessage = `feat: Add/Update chapter ${chapterNumber} for ${novelId}`;

  try {
    console.log(`[ChapterSaveAction] Attempting to save chapter: ${filePathInRepo}`);
    await createFileInRepo(filePathInRepo, htmlContent, commitMessage);

    revalidatePath(`/novels/${novelId}`);
    revalidatePath(`/novels/${novelId}/chapters/chapter-${chapterNumber}`); // Revalidate specific chapter page

    return {
      message: `Capítulo ${chapterNumber} guardado con éxito para la novela '${novelId}'.`,
      success: true,
      chapterPath: `/novels/${novelId}/chapters/chapter-${chapterNumber}`,
    };
  } catch (error) {
    console.error(`[ChapterSaveAction] Error saving chapter ${chapterNumber} for novel ${novelId}:`, error);
    const errorMessage = error instanceof Error ? error.message : `Error desconocido al guardar el capítulo ${chapterNumber}.`;
    return {
      message: `Error al guardar capítulo: ${errorMessage}`,
      success: false,
    };
  }
}
