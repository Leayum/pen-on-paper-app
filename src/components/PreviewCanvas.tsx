import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useEffect, useRef } from "react";

interface PreviewCanvasProps {
  image: string | null;
  text: string;
  fontStyle: string;
  inkColor: string;
}

export const PreviewCanvas = ({ image, text, fontStyle, inkColor }: PreviewCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !image) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      // Set canvas size to match image
      canvas.width = img.width;
      canvas.height = img.height;

      // Draw image
      ctx.drawImage(img, 0, 0);

      // Draw text if provided
      if (text) {
        // Calculate font size based on canvas width
        const fontSize = Math.max(canvas.width / 20, 24);
        ctx.font = `${fontSize}px ${fontStyle}`;
        ctx.fillStyle = inkColor;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        // Add shadow for more realistic effect
        ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
        ctx.shadowBlur = 2;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;

        // Split text into lines if too long
        const maxWidth = canvas.width * 0.8;
        const words = text.split(" ");
        let line = "";
        const lines: string[] = [];
        const lineHeight = fontSize * 1.4;

        words.forEach((word) => {
          const testLine = line + word + " ";
          const metrics = ctx.measureText(testLine);
          if (metrics.width > maxWidth && line) {
            lines.push(line);
            line = word + " ";
          } else {
            line = testLine;
          }
        });
        lines.push(line);

        // Draw each line
        const startY = canvas.height / 2 - (lines.length * lineHeight) / 2;
        lines.forEach((line, index) => {
          ctx.fillText(line.trim(), canvas.width / 2, startY + index * lineHeight);
        });
      }
    };
    img.src = image;
  }, [image, text, fontStyle, inkColor]);

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const link = document.createElement("a");
    link.download = "imagen-con-texto.png";
    link.href = canvasRef.current.toDataURL("image/png");
    link.click();
  };

  return (
    <Card className="h-full shadow-medium">
      <CardHeader>
        <CardTitle className="text-2xl font-semibold">Previsualización con Texto</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="border-2 border-border rounded-lg overflow-hidden bg-gradient-soft">
          {image ? (
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
          disabled={!image}
          className="w-full bg-gradient-accent shadow-medium hover:shadow-strong transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="h-4 w-4 mr-2" />
          Descargar Imagen
        </Button>
      </CardContent>
    </Card>
  );
};
