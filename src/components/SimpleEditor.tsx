import { useState } from "react";
import { ImageUpload } from "@/components/ImageUpload";
import { PreviewCanvas } from "@/components/PreviewCanvas";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const fontStyles = [
  { value: "Dancing Script", label: "Cursiva Elegante" },
  { value: "Pacifico", label: "Manuscrita Atrevida" },
  { value: "Caveat", label: "Escritura Casual" },
  { value: "Indie Flower", label: "Flor Independiente" },
];

const inkColors = [
  { value: "#000000", label: "Negro Profundo" },
  { value: "#1e40af", label: "Azul Clásico" },
  { value: "#991b1b", label: "Rojo Intenso" },
  { value: "#064e3b", label: "Verde Bosque" },
];

export const SimpleEditor = () => {
  const [image, setImage] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [author, setAuthor] = useState("");
  const [fontStyle, setFontStyle] = useState("Dancing Script");
  const [inkColor, setInkColor] = useState("#000000");

  const handleImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleImageRemove = () => {
    setImage(null);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <ImageUpload
          image={image}
          onImageUpload={handleImageUpload}
          onImageRemove={handleImageRemove}
        />
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
        <PreviewCanvas
          image={image}
          text={text}
          author={author}
          fontStyle={fontStyle}
          inkColor={inkColor}
          generatedImage={null}
          isGenerating={false}
        />
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
        <Card className="h-full shadow-medium">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold">
              Configurar Texto
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="simple-text" className="text-base font-medium">
                Tu Frase a Escribir:
              </Label>
              <Textarea
                id="simple-text"
                placeholder="Escribe tu mensaje aquí..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="min-h-32 resize-none transition-all focus:shadow-soft"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="simple-author" className="text-base font-medium">
                Autor (Opcional):
              </Label>
              <Textarea
                id="simple-author"
                placeholder="@TuNombreDeUsuario..."
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="min-h-16 resize-none transition-all focus:shadow-soft"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="simple-font" className="text-base font-medium">
                Estilo de Caligrafía:
              </Label>
              <Select value={fontStyle} onValueChange={setFontStyle}>
                <SelectTrigger id="simple-font" className="transition-all focus:shadow-soft">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {fontStyles.map((font) => (
                    <SelectItem
                      key={font.value}
                      value={font.value}
                      style={{ fontFamily: font.value }}
                    >
                      {font.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="simple-color" className="text-base font-medium">
                Color de Tinta:
              </Label>
              <Select value={inkColor} onValueChange={setInkColor}>
                <SelectTrigger id="simple-color" className="transition-all focus:shadow-soft">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {inkColors.map((color) => (
                    <SelectItem key={color.value} value={color.value}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded-full border border-border"
                          style={{ backgroundColor: color.value }}
                        />
                        {color.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground text-center">
                Vista previa en tiempo real. Descarga directamente desde el canvas.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
