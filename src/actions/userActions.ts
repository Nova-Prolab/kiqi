
'use server';

import { z } from 'zod';
import { createFileInRepo, fetchFileContent, fetchFromGitHub } from '@/lib/github';
import type { User } from '@/lib/types';
import dns from 'node:dns/promises'; // For MX record lookup

// Define GitHubFile interface locally if not centrally available and needed for fetchFromGitHub response
interface GitHubFile {
  name: string;
  path: string;
  type: 'file' | 'dir';
  // Add other properties if needed, like sha, download_url etc.
}


const registerUserSchema = z.object({
  username: z.string().min(3, "El nombre de usuario debe tener al menos 3 caracteres.").regex(/^[a-zA-Z0-9_.-]+$/, "Nombre de usuario inválido. Solo letras, números, '_', '-', '.' son permitidos."),
  email: z.string().email("Formato de correo electrónico inválido."),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres."),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden.",
  path: ["confirmPassword"], // Path of the error
});

export async function registerUserAction(
  prevState: { message: string; success: boolean; } | null,
  formData: FormData
): Promise<{ message: string; success: boolean; }> {
  const rawFormData = {
    username: formData.get('username') as string,
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    confirmPassword: formData.get('confirmPassword') as string,
  };

  const validatedFields = registerUserSchema.safeParse(rawFormData);

  if (!validatedFields.success) {
    return {
      message: "Error de validación: " + Object.values(validatedFields.error.flatten().fieldErrors).flat().join(' '),
      success: false,
    };
  }

  const { username, email, password } = validatedFields.data;
  const filePath = `users/${username}.json`;

  // MX Record Check for the email's domain
  try {
    const domain = email.substring(email.lastIndexOf('@') + 1);
    if (!domain) { 
        return {
            message: "El formato del correo electrónico es inválido (no se pudo extraer el dominio).",
            success: false,
        };
    }
    const addresses = await dns.resolveMx(domain);
    if (!addresses || addresses.length === 0) {
      return {
        message: `El dominio del correo electrónico '${domain}' no parece estar configurado para recibir correos. Por favor, usa un correo electrónico válido.`,
        success: false,
      };
    }
  } catch (error: any) {
    console.error(`[MX Check Error] Failed to resolve MX records for domain in email '${email}':`, error.code || error.message);
    let userMessage = "No se pudo verificar el dominio del correo electrónico. Por favor, inténtalo de nuevo más tarde o usa un correo diferente.";
    if (error.code === 'ENODATA' || error.code === 'ENOTFOUND') {
        userMessage = `El dominio del correo electrónico '${email.substring(email.lastIndexOf('@') + 1)}' no parece ser válido o no está configurado para recibir correos.`;
    }
    return {
      message: userMessage,
      success: false,
    };
  }

  // Check if user file (username) already exists
  try {
    const existingUserFile = await fetchFileContent(filePath);
    if (existingUserFile) {
      return { message: `El nombre de usuario '${username}' ya está en uso. Por favor, elige otro.`, success: false };
    }
  } catch (error) {
    // Assuming fetchFileContent returns null for 404s and doesn't throw for that.
  }

  // Check if email already exists in another user's file
  try {
    const allUserFiles = await fetchFromGitHub<GitHubFile[]>('contents/users/');
    if (allUserFiles && Array.isArray(allUserFiles)) {
      for (const file of allUserFiles) {
        if (file.type === 'file' && file.name.endsWith('.json') && file.name !== `${username}.json`) {
          const fileData = await fetchFileContent(file.path);
          if (fileData) {
            try {
              const otherUser: User = JSON.parse(fileData.content);
              if (otherUser.email && otherUser.email.toLowerCase() === email.toLowerCase()) {
                return { message: `El correo electrónico '${email}' ya está registrado con otro usuario.`, success: false };
              }
            } catch (parseError) {
              console.warn(`Could not parse user file ${file.path} during email check:`, parseError);
            }
          }
        }
      }
    }
  } catch (error) {
     console.error("Error fetching user list for email check:", error);
  }


  const userJson: User = {
    username,
    email,
    password, // Storing password in plain text - UNSAFE FOR PRODUCTION
  };
  const userJsonContent = JSON.stringify(userJson, null, 2);
  const commitMessage = `feat: Register new user - ${username}`;

  try {
    await createFileInRepo(filePath, userJsonContent, commitMessage);
    return { message: `Usuario '${username}' registrado con éxito. Ahora puedes iniciar sesión.`, success: true };
  } catch (error) {
    console.error("Error creating user file:", error);
    const errorMessage = error instanceof Error ? error.message : "Error desconocido al registrar el usuario.";
    if (errorMessage.includes('422') || (error && typeof error === 'object' && 'status' in error && error.status === 422)) {
      return {
        message: `Error al registrar: El nombre de usuario '${username}' ya existe. Elige otro.`,
        success: false,
      };
    }
    return { message: `Error al registrar usuario: ${errorMessage}`, success: false };
  }
}

const loginUserSchema = z.object({
  identifier: z.string().min(1, "El nombre de usuario o correo es obligatorio."),
  password: z.string().min(1, "La contraseña es obligatoria."),
});

export async function loginUserAction(
  prevState: { message: string; success: boolean; username?: string; } | null,
  formData: FormData
): Promise<{ message: string; success: boolean; username?: string; }> {
  const rawFormData = {
    identifier: formData.get('identifier') as string,
    password: formData.get('password') as string,
  };

  const validatedFields = loginUserSchema.safeParse(rawFormData);

  if (!validatedFields.success) {
    return {
      message: "Error de validación: " + Object.values(validatedFields.error.flatten().fieldErrors).flat().join(' '),
      success: false,
    };
  }

  const { identifier, password } = validatedFields.data;
  let userToVerify: User | null = null;
  let foundBy: 'username' | 'email' | null = null;

  // Try fetching by username first
  const usernameFilePath = `users/${identifier}.json`;
  try {
    const userFileByUsername = await fetchFileContent(usernameFilePath);
    if (userFileByUsername) {
      userToVerify = JSON.parse(userFileByUsername.content) as User;
      foundBy = 'username';
    }
  } catch (error) {
    // console.log("User not found by username, will try by email if applicable.");
  }

  // If not found by username and identifier looks like an email, try searching by email
  if (!userToVerify && identifier.includes('@')) {
    try {
      const allUserFiles = await fetchFromGitHub<GitHubFile[]>('contents/users/');
      if (allUserFiles && Array.isArray(allUserFiles)) {
        for (const file of allUserFiles) {
          if (file.type === 'file' && file.name.endsWith('.json')) {
            const fileData = await fetchFileContent(file.path);
            if (fileData) {
              try {
                const otherUser: User = JSON.parse(fileData.content);
                if (otherUser.email && otherUser.email.toLowerCase() === identifier.toLowerCase()) {
                  userToVerify = otherUser;
                  foundBy = 'email';
                  break; 
                }
              } catch (parseError) {
                console.warn(`Could not parse user file ${file.path} during email login check:`, parseError);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("Error fetching user list for email login check:", error);
      // Allow to proceed to password check, it will fail if userToVerify is still null
    }
  }

  if (userToVerify) {
    // IMPORTANT: This is plain text password comparison. UNSAFE FOR PRODUCTION.
    if (userToVerify.password === password) {
      return { message: `Inicio de sesión exitoso para '${userToVerify.username}'.`, success: true, username: userToVerify.username };
    } else {
      return { message: "Contraseña incorrecta.", success: false };
    }
  } else {
    return { message: `Usuario o correo '${identifier}' no encontrado.`, success: false };
  }
}
