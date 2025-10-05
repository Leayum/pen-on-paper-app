import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface TextControlsProps {
  text: string;
  fontStyle: string;
  inkColor: string;
  onTextChange: (text: string) => void;
  onFontStyleChange: (style: string) => void;
  onInkColorChange: (color: string) => void;
  onGenerate: () => Promise<void>;
  isGenerating: boolean;
  isImageLoaded: boolean;
}

const fontStyles = [
  { value: "Dancing Script", label: "Cursiva Elegante" },
  { value: "Pacifico", label: "Manuscrita Atrevida" },
  { value: "Caveat", label: "Escritura Casual" },
];

const inkColors = [
  { value: "#000000", label: "Negro Profundo" },
  { value: "#1e40af", label: "Azul Clásico" },
  { value: "#991b1b", label: "Rojo Intenso" },
  { value: "#064e3b", label: "Verde Bosque" },
];

export const TextControls = ({
  text,
  fontStyle,
  inkColor,
  onTextChange,
  onFontStyleChange,
  onInkColorChange,
  onGenerate,
  isGenerating,
  isImageLoaded,
}: TextControlsProps) => {
  
  const handleGenerate = () => {
    if (!isImageLoaded) {
      toast.error("Por favor, sube una imagen de hoja de papel primero.");
      return;
    }
    if (!text.trim()) {
      toast.error("Por favor ingresa un texto primero.");
      return;
    }
    onGenerate();
  };

  const isButtonDisabled = isGenerating || !isImageLoaded || !text.trim();

  return (
    <Card className="h-full shadow-medium">
      <CardHeader>
        <CardTitle className="text-2xl font-semibold">
          Configurar Texto Escrito a Mano
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="text" className="text-base font-medium">
            Tu Frase a Escribir:
          </Label>
          <Textarea
            id="text"
            placeholder="Escribe tu mensaje aquí..."
            value={text}
            onChange={(e) => onTextChange(e.target.value)}
            className="min-h-32 resize-none transition-all focus:shadow-soft"
            disabled={isGenerating}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="font" className="text-base font-medium">
            Estilo de Caligrafía:
          </Label>
          <Select value={fontStyle} onValueChange={onFontStyleChange} disabled={isGenerating}>
            <SelectTrigger id="font" className="transition-all focus:shadow-soft">
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
          <Label htmlFor="color" className="text-base font-medium">
            Color de Tinta:
          </Label>
          <Select value={inkColor} onValueChange={onInkColorChange} disabled={isGenerating}>
            <SelectTrigger id="color" className="transition-all focus:shadow-soft">
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

        <Button
          onClick={handleGenerate}
          disabled={isButtonDisabled}
          className="w-full bg-gradient-primary shadow-medium hover:shadow-strong transition-all mt-6"
          size="lg"
        >
          {isGenerating ? (
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
          ) : (
            <Sparkles className="h-5 w-5 mr-2" />
          )}
          {isGenerating ? "Generando..." : "Generar Imagen con Texto Realista"}
        </Button>
      </CardContent>
    </Card>
  );
};
