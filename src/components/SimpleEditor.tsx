import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Upload, Link as LinkIcon, X, Download, Bold, Italic, Type } from "lucide-react";
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
  const [baseTextStyle, setBaseTextStyle] = useState<"normal" | "bold" | "italic">("normal");
  
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

  const handleLoadFromUrl = async () => {
    if (!imageUrl.trim()) {
      toast.error("Por favor ingresa una URL válida");
      return;
    }

    const toDataURL = (blob: Blob): Promise<string> =>
      new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

    // Probar diferentes rutas (directa y proxies)
    const candidates = [
      imageUrl,
      `https://corsproxy.io/?${encodeURIComponent(imageUrl)}`,
      `https://cors.isomorphic-git.org/${imageUrl}`,
    ];

    toast.info("Cargando imagen desde URL...");

    for (const url of candidates) {
      try {
        const res = await fetch(url, { mode: "cors" as RequestMode });
        if (!res.ok) continue;
        const ct = res.headers.get("content-type") || "";
        if (!ct.startsWith("image/")) continue;
        const blob = await res.blob();
        const dataUrl = await toDataURL(blob);
        setImage(dataUrl);
        toast.success("Imagen cargada desde URL");
        return;
      } catch (_) {
        // intentar siguiente opción
      }
    }

    toast.error(
      "No se pudo cargar la imagen. Prueba con un enlace directo a la imagen (.jpg, .png) o descarga el archivo."
    );
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

    // Dibuja el texto principal si existe
    if (text.trim()) {
      ctx.fillStyle = inkColor;
      ctx.textBaseline = "middle";

      // Añade sombra mejorada
      ctx.shadowColor = "rgba(0, 0, 0, 0.9)";
      ctx.shadowBlur = 15;
      ctx.shadowOffsetX = 3;
      ctx.shadowOffsetY = 3;

      const maxWidth = canvas.width * 0.8;
      const lineHeight = fontSize * 1.4;

      // Función para determinar el estilo final considerando el estilo base
      const getEffectiveStyle = (markerStyle: "normal" | "bold" | "italic"): "normal" | "bold" | "italic" => {
        if (markerStyle === "normal") return baseTextStyle;
        // Si el marcador indica bold/italic, hacer toggle con el estilo base
        if (baseTextStyle === "normal") return markerStyle;
        if (baseTextStyle === markerStyle) return "normal"; // toggle off
        return markerStyle; // base es diferente, aplicar el marcador
      };

      const getFontString = (style: "normal" | "bold" | "italic"): string => {
        if (style === "bold") return `bold ${fontSize}px Arial`;
        if (style === "italic") return `italic ${fontSize}px Arial`;
        return `${fontSize}px Arial`;
      };

      // Procesar texto con marcadores ** y _ que funcionan con frases completas
      const paragraphs = text.split("\n");
      
      interface StyledSegment {
        text: string;
        style: "normal" | "bold" | "italic";
      }
      const lines: StyledSegment[][] = [];

      paragraphs.forEach((paragraph) => {
        if (paragraph.trim() === "") {
          lines.push([]);
          return;
        }

        // Parsear el párrafo buscando ** y _
        const segments: StyledSegment[] = [];
        let remaining = paragraph;

        while (remaining.length > 0) {
          // Buscar ** (negrita)
          const boldMatch = remaining.match(/^\*\*(.+?)\*\*/);
          if (boldMatch) {
            segments.push({ text: boldMatch[1], style: getEffectiveStyle("bold") });
            remaining = remaining.slice(boldMatch[0].length);
            continue;
          }

          // Buscar _ (cursiva)
          const italicMatch = remaining.match(/^_(.+?)_/);
          if (italicMatch) {
            segments.push({ text: italicMatch[1], style: getEffectiveStyle("italic") });
            remaining = remaining.slice(italicMatch[0].length);
            continue;
          }

          // Texto normal hasta el próximo marcador
          const nextMarker = remaining.search(/\*\*|_/);
          if (nextMarker === -1) {
            segments.push({ text: remaining, style: getEffectiveStyle("normal") });
            remaining = "";
          } else {
            segments.push({ text: remaining.slice(0, nextMarker), style: getEffectiveStyle("normal") });
            remaining = remaining.slice(nextMarker);
          }
        }

        // Dividir los segmentos en palabras para ajuste de línea
        interface StyledWord {
          text: string;
          style: "normal" | "bold" | "italic";
        }
        const words: StyledWord[] = [];
        segments.forEach(seg => {
          const segWords = seg.text.split(" ");
          segWords.forEach((w, idx) => {
            if (w) words.push({ text: w, style: seg.style });
            // Añadir espacio excepto en la última palabra
            if (idx < segWords.length - 1) {
              words.push({ text: " ", style: seg.style });
            }
          });
        });

        // Ajustar palabras en líneas según maxWidth
        let currentLine: StyledWord[] = [];
        let currentLineWidth = 0;

        words.forEach((word) => {
          ctx.font = getFontString(word.style);
          const wordWidth = ctx.measureText(word.text).width;
          const totalWidth = currentLineWidth + wordWidth;

          if (totalWidth > maxWidth && currentLine.length > 0 && word.text !== " ") {
            lines.push([...currentLine]);
            currentLine = [word];
            currentLineWidth = wordWidth;
          } else {
            currentLine.push(word);
            currentLineWidth = totalWidth;
          }
        });
        if (currentLine.length > 0) {
          lines.push(currentLine);
        }
      });

      const startY = canvas.height / 2 - (lines.length * lineHeight) / 2;
      
      lines.forEach((line, lineIndex) => {
        // Si es una línea vacía, solo avanzar el espacio
        if (line.length === 0) {
          return;
        }

        let lineWidth = 0;
        line.forEach((word, wordIndex) => {
          ctx.font = getFontString(word.style);
          lineWidth += ctx.measureText(word.text).width;
          if (wordIndex < line.length - 1) {
            lineWidth += ctx.measureText(" ").width;
          }
        });

        let x = (canvas.width - lineWidth) / 2;
        const y = startY + lineIndex * lineHeight;

        line.forEach((word, wordIndex) => {
          ctx.font = getFontString(word.style);
          ctx.textAlign = "left";
          ctx.fillText(word.text, x, y);
          
          x += ctx.measureText(word.text).width;
          if (wordIndex < line.length - 1) {
            x += ctx.measureText(" ").width;
          }
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
      
      ctx.shadowColor = "rgba(0, 0, 0, 0.7)";
      ctx.shadowBlur = 8;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      
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
  }, [image, text, author, fontStyle, inkColor, fontSize, aspectRatio, baseTextStyle]);

  const handleDownload = () => {
    if (!image) {
      toast.warning("No hay imagen para descargar");
      return;
    }

    try {
      const dataUrl = canvasRef.current?.toDataURL("image/png");
      if (!dataUrl) throw new Error("toDataURL vacío");
      const link = document.createElement("a");
      link.download = `editor-simple-${aspectRatio === "1:1" ? "cuadrado" : "tiktok"}.png`;
      link.href = dataUrl;
      link.click();
      toast.success(`Imagen ${aspectRatio} descargada`);
    } catch (err) {
      console.error(err);
      toast.error(
        "No se pudo exportar por restricciones CORS. Intenta cargar la imagen por archivo o usando la opción URL (proxy)."
      );
    }
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
              
              <div className="flex items-center gap-2 pt-2">
                <Label className="text-sm font-medium">Formato base:</Label>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    size="sm"
                    variant={baseTextStyle === "normal" ? "default" : "outline"}
                    onClick={() => setBaseTextStyle("normal")}
                    className="h-8 w-8 p-0"
                  >
                    <Type className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={baseTextStyle === "bold" ? "default" : "outline"}
                    onClick={() => setBaseTextStyle("bold")}
                    className="h-8 w-8 p-0"
                  >
                    <Bold className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={baseTextStyle === "italic" ? "default" : "outline"}
                    onClick={() => setBaseTextStyle("italic")}
                    className="h-8 w-8 p-0"
                  >
                    <Italic className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
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
