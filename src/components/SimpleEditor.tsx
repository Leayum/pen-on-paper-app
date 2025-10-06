import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Upload, Link as LinkIcon, X, Download } from "lucide-react";
import { toast } from "sonner";
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
  const [fontSize, setFontSize] = useState<number>(40);
  const [imageUrl, setImageUrl] = useState("");
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setImage(e.target?.result as string);
      toast.success("Imagen cargada correctamente");
    };
    reader.readAsDataURL(file);
  };

  const handleImageRemove = () => {
    setImage(null);
    setImageUrl("");
    toast.info("Imagen eliminada");
  };

  const handleLoadFromUrl = () => {
    if (!imageUrl.trim()) {
      toast.error("Por favor ingresa una URL válida");
      return;
    }
    
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      setImage(imageUrl);
      toast.success("Imagen cargada desde URL");
    };
    img.onerror = () => {
      toast.error("Error al cargar la imagen desde la URL");
    };
    img.src = imageUrl;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  // Lógica del canvas: dibuja imagen y texto con sombra
  useEffect(() => {
    if (!canvasRef.current || !image) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Dibuja la imagen de fondo
      ctx.drawImage(img, 0, 0);

      // Dibuja el texto principal si existe
      if (text.trim()) {
        ctx.fillStyle = inkColor;
        ctx.textBaseline = "middle";

        // Añade sombra visible
        ctx.shadowColor = "rgba(0, 0, 0, 0.7)";
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;

        const maxWidth = canvas.width * 0.8;
        const lineHeight = fontSize * 1.4;

        // Función para parsear formato de una palabra
        const parseWordFormat = (word: string) => {
          // **texto** = negrita
          if (word.startsWith("**") && word.endsWith("**") && word.length > 4) {
            return { text: word.slice(2, -2), style: "bold" };
          }
          // *texto* = cursiva
          if (word.startsWith("*") && word.endsWith("*") && word.length > 2) {
            return { text: word.slice(1, -1), style: "italic" };
          }
          return { text: word, style: "normal" };
        };

        // Dividir en líneas con word wrapping
        const words = text.split(" ");
        const lines: Array<Array<{ text: string; style: string }>> = [];
        let currentLine: Array<{ text: string; style: string }> = [];
        let currentLineWidth = 0;

        words.forEach((word) => {
          const parsed = parseWordFormat(word);
          const testFont = `${parsed.style === "bold" ? "bold" : parsed.style === "italic" ? "italic" : ""} ${fontSize}px Arial`.trim();
          ctx.font = testFont || `${fontSize}px Arial`;
          const wordWidth = ctx.measureText(parsed.text + " ").width;

          if (currentLineWidth + wordWidth > maxWidth && currentLine.length > 0) {
            lines.push(currentLine);
            currentLine = [parsed];
            currentLineWidth = wordWidth;
          } else {
            currentLine.push(parsed);
            currentLineWidth += wordWidth;
          }
        });
        if (currentLine.length > 0) {
          lines.push(currentLine);
        }

        // Dibujar cada línea con estilos aplicados
        const startY = canvas.height / 2 - (lines.length * lineHeight) / 2;
        lines.forEach((line, lineIndex) => {
          // Calcular ancho total de la línea para centrado
          let totalLineWidth = 0;
          line.forEach((word) => {
            const testFont = `${word.style === "bold" ? "bold" : word.style === "italic" ? "italic" : ""} ${fontSize}px Arial`.trim();
            ctx.font = testFont || `${fontSize}px Arial`;
            totalLineWidth += ctx.measureText(word.text + " ").width;
          });

          // Posición inicial para centrar la línea
          let currentX = canvas.width / 2 - totalLineWidth / 2;
          const currentY = startY + lineIndex * lineHeight;

          // Dibujar cada palabra con su estilo
          line.forEach((word) => {
            const fontStyle = word.style === "bold" ? "bold" : word.style === "italic" ? "italic" : "";
            ctx.font = fontStyle ? `${fontStyle} ${fontSize}px Arial` : `${fontSize}px Arial`;
            
            ctx.fillText(word.text, currentX, currentY);
            currentX += ctx.measureText(word.text + " ").width;
          });
        });
      }

      // Dibuja el autor si existe
      if (author.trim()) {
        const authorFontSize = fontSize * 0.6;
        const extraSpacingFactor = 3.5;
        
        const textLines = text.trim() ? Math.ceil(ctx.measureText(text).width / (canvas.width * 0.8)) : 0;
        const lineHeight = fontSize * 1.4;
        const startY = canvas.height / 2 - (textLines * lineHeight) / 2;
        const authorY = startY + textLines * lineHeight + authorFontSize * 0.8 + lineHeight * extraSpacingFactor;
        const authorX = canvas.width * 0.9 - authorFontSize * 0.5;
        
        ctx.font = `${authorFontSize}px Arial`;
        ctx.textAlign = "right";
        
        // Sombra para el autor
        ctx.shadowColor = "rgba(0, 0, 0, 0.7)";
        ctx.shadowBlur = 8;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        
        ctx.fillText(author.trim(), authorX, authorY);
      }
    };

    img.src = image;
  }, [image, text, author, fontStyle, inkColor, fontSize]);

  const handleDownload = () => {
    if (!canvasRef.current || !image) {
      toast.warning("No hay imagen para descargar");
      return;
    }

    const link = document.createElement("a");
    link.download = "editor-simple-resultado.png";
    link.href = canvasRef.current.toDataURL("image/png");
    link.click();
    toast.success("Imagen descargada");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Columna 1: Cargar Imagen */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <Card className="h-full shadow-medium">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold">Subir Imagen Original</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-border rounded-lg overflow-hidden bg-gradient-soft relative">
              {image ? (
                <div className="relative">
                  <img
                    src={image}
                    alt="Imagen cargada"
                    className="w-full h-64 object-contain"
                  />
                  <Button
                    onClick={handleImageRemove}
                    size="icon"
                    variant="destructive"
                    className="absolute top-2 right-2"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="w-full h-64 flex items-center justify-center text-muted-foreground">
                  <p>Sube una imagen para comenzar</p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-base font-medium">Cargar desde Archivo:</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="w-full"
                variant="outline"
              >
                <Upload className="h-4 w-4 mr-2" />
                Seleccionar Archivo
              </Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="image-url" className="text-base font-medium">
                O cargar desde URL:
              </Label>
              <div className="flex gap-2">
                <Input
                  id="image-url"
                  type="url"
                  placeholder="https://ejemplo.com/imagen.jpg"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleLoadFromUrl} variant="outline">
                  <LinkIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Columna 2: Canvas Preview */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
        <Card className="h-full shadow-medium">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold">Previsualización</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-border rounded-lg overflow-hidden bg-gradient-soft relative">
              {image ? (
                <canvas
                  ref={canvasRef}
                  className="w-full h-80 object-contain"
                />
              ) : (
                <div className="w-full h-80 flex items-center justify-center text-muted-foreground">
                  <p>La vista previa aparecerá aquí</p>
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
      </div>

      {/* Columna 3: Controles */}
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
              <Label htmlFor="font-size" className="text-base font-medium">
                Tamaño de Fuente: {fontSize}px
              </Label>
              <Slider
                id="font-size"
                min={10}
                max={100}
                step={1}
                value={[fontSize]}
                onValueChange={(value) => setFontSize(value[0])}
                className="w-full"
              />
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
                Vista previa en tiempo real con sombras realistas
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
