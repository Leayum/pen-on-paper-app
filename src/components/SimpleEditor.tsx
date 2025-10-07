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
  { value: "#FFFFFF", label: "Blanco Puro" },
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
  const [aspectRatio, setAspectRatio] = useState<"1:1" | "9:16">("1:1");
  
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

  // Función reutilizable para dibujar en cualquier canvas
  const drawOnCanvas = (canvas: HTMLCanvasElement, img: HTMLImageElement) => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Dibuja la imagen de fondo cubriendo el canvas (object-fit: cover)
    const imgAspect = img.width / img.height;
    const canvasAspect = canvas.width / canvas.height;
    
    let drawWidth, drawHeight, offsetX, offsetY;
    
    if (imgAspect > canvasAspect) {
      // Imagen más ancha que el canvas
      drawHeight = canvas.height;
      drawWidth = img.width * (canvas.height / img.height);
      offsetX = (canvas.width - drawWidth) / 2;
      offsetY = 0;
    } else {
      // Imagen más alta que el canvas
      drawWidth = canvas.width;
      drawHeight = img.height * (canvas.width / img.width);
      offsetX = 0;
      offsetY = (canvas.height - drawHeight) / 2;
    }
    
    ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

    // Reinicia la sombra para que solo afecte al texto
    ctx.shadowColor = "rgba(0, 0, 0, 0)";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // Dibuja el texto principal si existe
    if (text.trim()) {
      ctx.fillStyle = inkColor;
      ctx.textBaseline = "middle";

      // Añade sombra mejorada para el texto principal
      ctx.shadowColor = "rgba(0, 0, 0, 0.9)";
      ctx.shadowBlur = 15;
      ctx.shadowOffsetX = 3;
      ctx.shadowOffsetY = 3;

      const maxWidth = canvas.width * 0.8;
      const lineHeight = fontSize * 1.4;

      const getFontString = (style: "normal" | "bold" | "italic"): string => {
        if (style === "bold") return `bold ${fontSize}px ${fontStyle}`;
        if (style === "italic") return `italic ${fontSize}px ${fontStyle}`;
        return `${fontSize}px ${fontStyle}`;
      };

      interface StyledToken {
        text: string;
        style: "normal" | "bold" | "italic";
      }

      // --- Nuevo Tokenizador (soporta múltiples palabras y saltos de línea) ---
      const tokenize = (input: string): StyledToken[] => {
        const tokens: StyledToken[] = [];
        
        // Split text by paragraphs (newlines) first
        const paragraphs = input.split('\n');

        paragraphs.forEach((paragraph, pIndex) => {
            if (pIndex > 0) {
                // Add explicit line break token for each newline
                tokens.push({ text: '\n', style: 'normal' });
            }
            
            // Regex to find markdown: 1. **bold**, 2. _italic_, 3. Plain text/spaces
            // Updated regex to use _..._ for italic
            const regex = /(\*\*.*?\*\*)|(_.*?_)|([^*_]+)/g;
            let match;
            
            while ((match = regex.exec(paragraph)) !== null) {
                const fullMatch = match[0];
                
                if (fullMatch.startsWith('**') && fullMatch.endsWith('**') && fullMatch.length > 3) {
                    // Bold: text inside **...** (min length is 4: ****)
                    fullMatch.slice(2, -2).split(/(\s+)/).forEach(part => {
                        if (part.length > 0) {
                            tokens.push({ text: part, style: 'bold' });
                        }
                    });
                } else if (fullMatch.startsWith('_') && fullMatch.endsWith('_') && fullMatch.length > 2) {
                    // Italic: text inside _..._ (min length is 3: __)
                    fullMatch.slice(1, -1).split(/(\s+)/).forEach(part => {
                        if (part.length > 0) {
                            tokens.push({ text: part, style: 'italic' });
                        }
                    });
                } else if (fullMatch.length > 0) {
                    // Plain text or unclosed/misformatted tags treated as literal text.
                    // Split by spaces, keeping spaces
                    fullMatch.split(/(\s+)/).forEach(part => {
                        if (part.length > 0) {
                            tokens.push({ text: part, style: 'normal' });
                        }
                    });
                }
            }
        });

        return tokens;
      };
      
      const tokens = tokenize(text);
      
      // --- New Line Breaking Logic (Flow) ---
      const finalLines: StyledToken[][] = [];
      let currentLine: StyledToken[] = [];
      let currentLineWidth = 0;

      tokens.forEach(token => {
          // Explicit line break from \n in the source text
          if (token.text === '\n') {
              if (currentLine.length > 0) {
                  finalLines.push(currentLine);
              }
              finalLines.push([]); // Add an empty line token for spacing
              currentLine = [];
              currentLineWidth = 0;
              return;
          }
          
          // Spaces don't wrap a line, but they advance the cursor
          const isSpace = token.text.match(/^\s+$/);
          
          // Calculate the width of the current token (which is a word or space)
          ctx.font = getFontString(token.style);
          const tokenWidth = ctx.measureText(token.text).width;
          
          // Check for line wrapping:
          // 1. If adding the token exceeds max width
          // 2. The token is not just a space
          // 3. The current line is not empty (to prevent an empty line if the first word is too long)
          if (currentLineWidth + tokenWidth > maxWidth && !isSpace && currentLine.length > 0) {
              // Wrap: Push current line and start new one
              finalLines.push(currentLine);
              currentLine = [token];
              currentLineWidth = tokenWidth;
          } else {
              // No wrap: Add to current line
              currentLine.push(token);
              currentLineWidth += tokenWidth;
          }
      });
      
      // Push the last remaining line if it's not empty
      if (currentLine.length > 0) {
          finalLines.push(currentLine);
      }
      
      // --- Drawing Lines ---
      const finalLineCount = finalLines.length;
      const contentHeight = finalLineCount * lineHeight;

      // Start Y position calculation for vertical centering
      let currentY = canvas.height / 2 - contentHeight / 2 + lineHeight / 2;
      
      finalLines.forEach((line) => {
        if (line.length === 0) { 
            currentY += lineHeight; // Advance y for the explicit newline
            return;
        }

        // Calculate the total width of the *current* line to center it
        let lineWidth = 0;
        line.forEach(token => {
            ctx.font = getFontString(token.style);
            lineWidth += ctx.measureText(token.text).width;
        });

        // Calculate start X for horizontal centering
        let currentX = (canvas.width - lineWidth) / 2;
        
        // Draw each token in the line
        line.forEach(token => {
            // Apply font style and draw
            ctx.font = getFontString(token.style);
            ctx.textAlign = "left";
            
            // Draw the text
            ctx.fillText(token.text, currentX, currentY);
            
            // Move cursor for the next token
            currentX += ctx.measureText(token.text).width;
        });
        
        currentY += lineHeight;
      });

      // --- Drawing Author (when text is present) ---
      if (author.trim()) {
        // Reset shadow for author text (it uses the same shadow as the main text)
        ctx.shadowColor = "rgba(0, 0, 0, 0.7)";
        ctx.shadowBlur = 8;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        
        const authorFontSize = fontSize * 0.6;
        const extraSpacingFactor = 3.5;
        
        // The Y position starts after the entire text block, plus spacing
        const authorY = (canvas.height / 2) - (contentHeight / 2) + contentHeight + authorFontSize * 0.8 + lineHeight * extraSpacingFactor;
        
        const authorX = canvas.width * 0.9 - authorFontSize * 0.5;
        
        ctx.font = `${authorFontSize}px ${fontStyle}`;
        ctx.textAlign = "right";
        
        ctx.fillText(author.trim(), authorX, authorY);
      }
    }

    // --- Drawing Author (when text is NOT present) ---
    if (author.trim() && !text.trim()) {
        // Reset shadow for author text
        ctx.shadowColor = "rgba(0, 0, 0, 0.7)";
        ctx.shadowBlur = 8;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;

        const authorFontSize = fontSize * 0.6;
        const authorX = canvas.width * 0.9 - authorFontSize * 0.5;
        const authorY = canvas.height / 2; 

        ctx.font = `${authorFontSize}px ${fontStyle}`;
        ctx.textAlign = "right";

        ctx.fillText(author.trim(), authorX, authorY);
    }
  };

  // Lógica del canvas: dibuja imagen y texto con sombra
  useEffect(() => {
    if (!canvasRef.current || !image) return;

    const canvas = canvasRef.current;
    const img = new Image();
    img.crossOrigin = "anonymous";
    
    img.onload = () => {
      // Usar las dimensiones según la proporción seleccionada
      if (aspectRatio === "1:1") {
        canvas.width = 1080;
        canvas.height = 1080;
      } else {
        canvas.width = 1080;
        canvas.height = 1920;
      }
      drawOnCanvas(canvas, img);
    };

    img.src = image;
  }, [image, text, author, fontStyle, inkColor, fontSize, aspectRatio]);

  const handleDownload = () => {
    if (!image) {
      toast.warning("No hay imagen para descargar");
      return;
    }

    const link = document.createElement("a");
    link.download = `editor-simple-${aspectRatio === "1:1" ? "cuadrado" : "tiktok"}.png`;
    link.href = canvasRef.current?.toDataURL("image/png") || "";
    link.click();
    toast.success(`Imagen ${aspectRatio} descargada`);
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

            <div className="space-y-3">
              <div className="space-y-2">
                <Label className="text-base font-medium">
                  Proporción de Previsualización:
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={() => setAspectRatio("1:1")}
                    variant={aspectRatio === "1:1" ? "default" : "outline"}
                    className="w-full"
                  >
                    Cuadrado (1:1)
                  </Button>
                  <Button
                    onClick={() => setAspectRatio("9:16")}
                    variant={aspectRatio === "9:16" ? "default" : "outline"}
                    className="w-full"
                  >
                    TikTok (9:16)
                  </Button>
                </div>
              </div>
              
              <Button
                onClick={handleDownload}
                disabled={!image}
                className="w-full bg-gradient-accent shadow-medium hover:shadow-strong transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="h-4 w-4 mr-2" />
                Descargar {aspectRatio}
              </Button>
            </div>
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
              <p className="text-sm text-muted-foreground">
                💡 Tip: Usa **texto** para <strong>negrita</strong> y _texto_ para <em>cursiva</em>. Presiona Enter para saltos de línea.
              </p>
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