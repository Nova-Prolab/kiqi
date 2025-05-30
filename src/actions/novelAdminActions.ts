
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
  prevState: { message: string; success: boolean; novelId?: string } | null,
  formData: FormData
): Promise<{ message: string; success: boolean; novelId?: string }> {
  
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
    descripcion: data.description.replace(/\r\n|\r|\n/g, '\\n'), // Ensure newlines are escaped
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
    
    // Revalidate the home page to reflect the new novel
    revalidatePath('/');
    // Optionally revalidate the (future) novel detail page if it existed or if you want to pre-warm
    // revalidatePath(`/novels/${novelId}`);


    return { message: `Novela '${data.title}' creada con éxito con ID '${novelId}'. El archivo info.json ha sido añadido al repositorio.`, success: true, novelId };
  } catch (error) {
    console.error("Error creating novel in GitHub:", error);
    const errorMessage = error instanceof Error ? error.message : "Error desconocido al crear la novela en GitHub.";
    return {
      message: `Error al crear la novela: ${errorMessage}`,
      success: false,
    };
  }
}
