import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Upload, Link as LinkIcon, X, Download } from "lucide-react";
import { toast } from "sonner";
import { loadImageFromUrl, drawTextOnCanvas } from "@/lib/canvasUtils"; // <-- Importar utilidades

// Props para configuración global
interface SimpleEditorProps {
  inkColor: string;
  fontSize: number;
  aspectRatio: "1:1" | "9:16";
  baseTextStyle: "normal" | "bold" | "italic";
  authorTextStyle: "normal" | "bold" | "italic";
  authorFontSize: number;
}

export const SimpleEditor = ({
    inkColor, fontSize, aspectRatio, baseTextStyle, authorTextStyle, authorFontSize
}: SimpleEditorProps) => { // <-- Recibir props
  const [image, setImage] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [author, setAuthor] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [imageScale, setImageScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setImage(e.target?.result as string);
       // Resetear zoom y posición al cargar nueva imagen
      setImagePosition({ x: 0, y: 0 });
      setImageScale(1);
      toast.success("Imagen cargada correctamente");
    };
    reader.readAsDataURL(file);
  };

  const handleImageRemove = () => {
    setImage(null);
    setImageUrl("");
    toast.info("Imagen eliminada");
  };

  // Usar la utilidad importada
  const handleLoadFromUrl = async () => {
     const dataUrl = await loadImageFromUrl(imageUrl);
     if (dataUrl) {
         setImage(dataUrl);
         // Resetear zoom y posición al cargar nueva imagen
         setImagePosition({ x: 0, y: 0 });
         setImageScale(1);
     }
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
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
       // Usar la utilidad importada para dibujar
       drawTextOnCanvas(canvas, img, text, {
           author,
           inkColor,
           fontSize,
           aspectRatio,
           baseTextStyle,
           authorTextStyle,
           authorFontSize,
           imagePosition,
           imageScale
       });
    };

    img.src = image;
  // Dependencias actualizadas para usar props globales
  }, [image, text, author, inkColor, fontSize, aspectRatio, baseTextStyle, authorTextStyle, authorFontSize, imagePosition, imageScale]);

  // Resetear posición y escala al cambiar proporción desde props
  useEffect(() => {
    setImagePosition({ x: 0, y: 0 });
    setImageScale(1);
  }, [aspectRatio]);

  // Handlers para arrastrar la imagen (sin cambios)
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!image) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    setIsDragging(true);
    setDragStart({
      x: e.clientX - rect.left - imagePosition.x,
      y: e.clientY - rect.top - imagePosition.y,
    });
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !image || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    if (!rect) return;

    const canvas = canvasRef.current;
    const img = new Image();
    // Añadir comprobación para evitar error si image es null momentáneamente
    if (!image) return;
    img.src = image;

    const imgAspect = img.width / img.height;
    const canvasAspect = canvas.width / canvas.height;

    // Solo permitir movimiento en el eje correspondiente
    if (imgAspect > canvasAspect) {
      // Imagen ancha - solo horizontal
      const newX = e.clientX - rect.left - dragStart.x;
      // Añadir límites básicos para que la imagen no se salga completamente
      const drawHeight = canvas.height * imageScale;
      const drawWidth = img.width * (drawHeight / img.height);
      const minX = canvas.width - drawWidth;
      const maxX = 0;
      setImagePosition({ x: Math.max(minX, Math.min(maxX, newX)), y: 0 });

    } else {
      // Imagen alta - solo vertical
      const newY = e.clientY - rect.top - dragStart.y;
       // Añadir límites básicos
      const drawWidth = canvas.width * imageScale;
      const drawHeight = img.height * (drawWidth / img.width);
      const minY = canvas.height - drawHeight;
      const maxY = 0;
      setImagePosition({ x: 0, y: Math.max(minY, Math.min(maxY, newY)) });
    }
  };

  const handleCanvasMouseUp = () => {
    setIsDragging(false);
  };

  const handleCanvasTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!image || e.touches.length === 0) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    setIsDragging(true);
    setDragStart({
      x: e.touches[0].clientX - rect.left - imagePosition.x,
      y: e.touches[0].clientY - rect.top - imagePosition.y,
    });
  };

  const handleCanvasTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDragging || !image || e.touches.length === 0 || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    if (!rect) return;

    const canvas = canvasRef.current;
    const img = new Image();
     // Añadir comprobación
    if (!image) return;
    img.src = image;

    const imgAspect = img.width / img.height;
    const canvasAspect = canvas.width / canvas.height;

    // Solo permitir movimiento en el eje correspondiente con límites
    if (imgAspect > canvasAspect) {
      const newX = e.touches[0].clientX - rect.left - dragStart.x;
      const drawHeight = canvas.height * imageScale;
      const drawWidth = img.width * (drawHeight / img.height);
      const minX = canvas.width - drawWidth;
      const maxX = 0;
      setImagePosition({ x: Math.max(minX, Math.min(maxX, newX)), y: 0 });
    } else {
      const newY = e.touches[0].clientY - rect.top - dragStart.y;
      const drawWidth = canvas.width * imageScale;
      const drawHeight = img.height * (drawWidth / img.width);
      const minY = canvas.height - drawHeight;
      const maxY = 0;
      setImagePosition({ x: 0, y: Math.max(minY, Math.min(maxY, newY)) });
    }
  };

  const handleCanvasTouchEnd = () => {
    setIsDragging(false);
  };

  // Manejar scroll para zoom
  const handleCanvasWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    if (!image) return;
    e.preventDefault();

    const delta = -e.deltaY * 0.001;
    const newScale = Math.max(1, Math.min(3, imageScale + delta)); // Mantener entre 1x y 3x
    setImageScale(newScale);

    // Reajustar posición si el zoom haría que se saliera de los límites (opcional pero mejora UX)
    // Esto es un poco más complejo, lo omitimos por simplicidad ahora
  };

  const handleDownload = () => {
    if (!image || !canvasRef.current) {
      toast.warning("No hay imagen para descargar");
      return;
    }

    // Crear un canvas temporal con resolución completa para la descarga
    const downloadCanvas = document.createElement('canvas');
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
        try {
            // Dibujar en el canvas de descarga con la configuración actual
            const success = drawTextOnCanvas(downloadCanvas, img, text, {
                author,
                inkColor,
                fontSize,
                aspectRatio,
                baseTextStyle,
                authorTextStyle,
                authorFontSize,
                imagePosition, // Usar la posición/zoom actual
                imageScale
            });

            if (!success) throw new Error("Error al dibujar para descarga.");

            const dataUrl = downloadCanvas.toDataURL("image/png");
            const link = document.createElement("a");
            link.download = `editor-simple-${aspectRatio === "1:1" ? "cuadrado" : "tiktok"}.png`;
            link.href = dataUrl;
            link.click();
            toast.success(`Imagen ${aspectRatio} descargada`);
        } catch (err) {
            console.error(err);
            toast.error(
                "No se pudo exportar. Si usaste una URL, la imagen podría tener restricciones CORS. Intenta cargarla por archivo."
            );
        }
    };
     img.onerror = () => {
         toast.error(
             "Error al cargar la imagen para la descarga (posible problema CORS)."
         );
     };
    img.src = image; // Iniciar carga
  };


  return (
    // Layout ajustado a 2 columnas principales + 1 para inputs de texto
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Columna 1: Cargar Imagen */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <Card className="h-full shadow-medium">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold">1. Subir Imagen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-border rounded-lg overflow-hidden bg-gradient-soft relative">
              {image ? (
                <div className="relative">
                  <img
                    src={image}
                    alt="Imagen cargada"
                    className="w-full h-64 object-contain" // Reducido un poco para dar espacio
                  />
                  <Button
                    onClick={handleImageRemove}
                    size="icon"
                    variant="destructive"
                    className="absolute top-2 right-2 rounded-full w-8 h-8" // Más pequeño
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  className="w-full h-64 flex flex-col items-center justify-center text-muted-foreground p-4 cursor-pointer hover:border-primary transition-colors"
                   onClick={() => fileInputRef.current?.click()}
                >
                   <Upload className="h-10 w-10 text-muted-foreground mb-3" />
                   <p className="mb-1 text-center">Arrastra o haz clic para seleccionar</p>
                   <p className="text-xs text-muted-foreground text-center">PNG, JPG, WEBP (máx. 10MB)</p>
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
                  placeholder="https://ejemplo.com/imagen.jpg o pin.it/..."
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleLoadFromUrl} variant="outline" size="icon" className="shrink-0">
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
            <CardTitle className="text-2xl font-semibold">2. Previsualizar y Ajustar</CardTitle>
           </CardHeader>
          <CardContent className="space-y-4 flex flex-col h-full"> {/* Flex col para llenar espacio */}
            <div className={`border-2 border-border rounded-lg overflow-hidden bg-gradient-soft relative ${aspectRatio === '1:1' ? 'aspect-square' : 'aspect-[9/16]'}`}>
              {image ? (
                <canvas
                  ref={canvasRef}
                  className="w-full h-full object-contain cursor-move touch-none" // touch-none previene scroll
                  onMouseDown={handleCanvasMouseDown}
                  onMouseMove={handleCanvasMouseMove}
                  onMouseUp={handleCanvasMouseUp}
                  onMouseLeave={handleCanvasMouseUp} // Asegura detener el drag al salir
                  onTouchStart={handleCanvasTouchStart}
                  onTouchMove={handleCanvasTouchMove}
                  onTouchEnd={handleCanvasTouchEnd}
                  onWheel={handleCanvasWheel} // Zoom con rueda del ratón
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground p-4">
                  <p className="text-center">La vista previa aparecerá aquí una vez cargues una imagen</p>
                </div>
              )}
            </div>
            {image && (
              <div className="space-y-2 mt-auto"> {/* Empujar controles hacia abajo */}
                <p className="text-sm text-muted-foreground text-center">
                  💡 Arrastra para mover | Rueda/Pellizca para zoom
                </p>
                <div className="space-y-1">
                  <Label className="text-sm font-medium">Zoom: {imageScale.toFixed(2)}x</Label>
                  <Slider
                    min={1}
                    max={3}
                    step={0.05} // Paso más fino
                    value={[imageScale]}
                    onValueChange={(value) => setImageScale(value[0])}
                    className="w-full"
                  />
                </div>
                 <div className="pt-4 border-t border-border">
                    <Button
                        onClick={handleDownload}
                        disabled={!image}
                        className="w-full bg-gradient-accent shadow-medium hover:shadow-strong transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                         size="lg" // Botón más grande
                     >
                       <Download className="h-5 w-5 mr-2" />
                       Descargar Imagen ({aspectRatio})
                    </Button>
                 </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Fila inferior (ocupa todo el ancho): Inputs de Texto */}
      <div className="md:col-span-2 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
        <Card className="h-full shadow-medium">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">3. Texto y Autor</CardTitle>
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

            <div className="pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground text-center">
                Usa los controles globales de la izquierda para estilo, tamaño y color.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};