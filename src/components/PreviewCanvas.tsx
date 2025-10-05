import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

interface PreviewCanvasProps {
  image: string | null;
  text: string;
  author: string; // <-- NUEVA PROP: Autor
  fontStyle: string;
  inkColor: string;
  generatedImage: string | null;
  isGenerating: boolean;
}

export const PreviewCanvas = ({ 
  image, 
  text, 
  author, // <-- Añadir a destructuring
  fontStyle, 
  inkColor, 
  generatedImage, 
  isGenerating, 
}: PreviewCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !image || generatedImage) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.drawImage(img, 0, 0);
      
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;

      if (text) {
        // Configuración para texto principal
        const fontSize = Math.max(canvasWidth / 20, 24);
        ctx.font = `${fontSize}px ${fontStyle}`;
        ctx.fillStyle = inkColor;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        // Asegurar que no hay sombra artificial en la previsualización (Sombra desactivada para realismo)
        ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        const maxWidth = canvasWidth * 0.8;
        const words = text.split(" ");
        let line = "";
        const lines: string[] = [];
        const lineHeight = fontSize * 1.4;

        // 1. Dibuja el texto principal
        words.forEach((word) => {
          const testLine = line + word + " ";
          const metrics = ctx.measureText(testLine);
          if (metrics.width > maxWidth && line.trim()) {
            lines.push(line);
            line = word + " ";
          } else {
            line = testLine;
          }
        });
        lines.push(line);

        let startY = canvasHeight / 2 - (lines.length * lineHeight) / 2;
        lines.forEach((line, index) => {
          ctx.fillText(line.trim(), canvasWidth / 2, startY + index * lineHeight);
        });
        
        // 2. Dibuja el Autor (si existe)
        if (author.trim()) {
          // Usar 60% del tamaño del texto principal para el autor
          const authorFontSize = fontSize * 0.6; 
          const extraSpacingFactor = 3.5; // <-- AUMENTADO a 3.5 para mayor separación
          
          // Calcular la posición Y, dejando espacio debajo del texto principal
          // Ahora usa el factor 3.5
          const authorY = startY + lines.length * lineHeight + authorFontSize * 0.8 + lineHeight * extraSpacingFactor; 
          
          // Calcular la posición X para alineación a la derecha (ajustado para que el texto no toque el borde)
          const authorX = canvasWidth * 0.9 - authorFontSize * 0.5; 
          
          ctx.font = `${authorFontSize}px ${fontStyle}`;
          ctx.textAlign = "right"; // Asegura que el texto se alinee a la derecha de authorX
          
          ctx.fillText(author.trim(), authorX, authorY);
        }
      }
    };
    img.src = image;
  }, [image, text, author, fontStyle, inkColor, generatedImage]); // <-- Dependencias correctas

  const handleDownload = () => {
    const source = generatedImage || (canvasRef.current && image ? canvasRef.current.toDataURL("image/png") : null);
    
    if (source) {
      const link = document.createElement("a");
      link.download = generatedImage ? "imagen-manuscrita-realista.png" : "previsualizacion-con-texto.png";
      link.href = source;
      link.click();
    } else {
      toast.warning("No hay imagen para descargar.");
    }
  };
  
  const displayImage = generatedImage || image;

  return ( // <-- EL COMPONENTE COMPLETO RETORNA AQUÍ
    <Card className="h-full shadow-medium">
      <CardHeader>
        <CardTitle className="text-2xl font-semibold">Previsualización con Texto</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="border-2 border-border rounded-lg overflow-hidden bg-gradient-soft relative">
          {isGenerating ? (
            <div className="w-full h-80 flex flex-col items-center justify-center text-primary animate-pulse">
              <Loader2 className="h-12 w-12 mb-4 animate-spin" />
              <p className="text-muted-foreground">Esperando la generación realista de Gemini...</p>
            </div>
          ) : generatedImage ? (
            <img
              src={generatedImage}
              alt="Imagen generada con texto realista"
              className="w-full h-80 object-contain"
            />
          ) : displayImage ? (
            <canvas
              ref={canvasRef}
              className="w-full h-80 object-contain"
            />
          ) : (
            <div className="w-full h-80 flex items-center justify-center text-muted-foreground">
              <p>Sube una imagen para comenzar</p>
            </div>
          )}
        </div>

        <Button
          onClick={handleDownload}
          disabled={!displayImage || isGenerating}
          className="w-full bg-gradient-accent shadow-medium hover:shadow-strong transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="h-4 w-4 mr-2" />
          Descargar Imagen
        </Button>
      </CardContent>
    </Card>
  );
};