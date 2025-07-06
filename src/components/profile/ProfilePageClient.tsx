'use client';

import { useState, useEffect } from 'react';
import { useReaderSettings } from '@/contexts/ReaderSettingsContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { User, Image as ImageIcon, Save } from 'lucide-react';

export default function ProfilePageClient() {
  const { 
    commentAuthorName, 
    setCommentAuthorName,
    commentAuthorAvatar, 
    setCommentAuthorAvatar 
  } = useReaderSettings();

  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    // Initialize state from context once it's loaded
    if (commentAuthorName) setName(commentAuthorName);
    if (commentAuthorAvatar) setAvatar(commentAuthorAvatar);
  }, [commentAuthorName, commentAuthorAvatar]);

  const handleSave = () => {
    setCommentAuthorName(name);
    setCommentAuthorAvatar(avatar);
    toast({
      title: '¡Perfil Actualizado!',
      description: 'Tu nombre y avatar se han guardado correctamente.',
    });
  };

  const getAvatarFallback = (name: string) => {
    if (!name) return '?';
    const words = name.split(' ').filter(Boolean);
    if (words.length > 1) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      <Card className="shadow-lg border-primary/20">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary/10 rounded-full p-4 w-fit mb-4 border-2 border-primary/20">
            <User className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold text-primary">Tu Perfil de Comentarista</CardTitle>
          <CardDescription className="text-md">
            Personaliza cómo te ven los demás en la sección de comentarios.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8 p-6">
          <div className="space-y-4">
            <h3 className="font-semibold text-lg text-center">Vista Previa</h3>
            <div className="flex items-center justify-center gap-4 rounded-lg border-2 border-dashed p-6 bg-muted/50">
              <Avatar className="h-16 w-16 border-2 border-primary/30">
                <AvatarImage src={avatar} alt={name} />
                <AvatarFallback className="text-2xl bg-muted">
                  {getAvatarFallback(name)}
                </AvatarFallback>
              </Avatar>
              <div className="text-left">
                <p className="font-bold text-lg text-foreground">{name || 'Tu Nombre Aquí'}</p>
                <p className="text-sm text-muted-foreground">Así se verá tu nombre.</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-base font-medium flex items-center gap-2">
                <User className="h-4 w-4" />
                Tu Nombre
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Lector Asombroso"
                className="text-base h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="avatar" className="text-base font-medium flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                URL de tu Avatar
              </Label>
              <Input
                id="avatar"
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
                placeholder="https://i.imgur.com/..."
                className="text-base h-11"
              />
              <p className="text-xs text-muted-foreground pt-1">
                Pega la URL completa de una imagen (se recomienda Imgur).
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSave} size="lg" className="w-full">
            <Save className="mr-2 h-5 w-5" />
            Guardar Cambios
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
