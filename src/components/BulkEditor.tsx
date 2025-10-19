import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Download, Loader2, ListChecks } from "lucide-react";
import { toast } from "sonner";
// Asumiendo que refactorizamos las utilidades
import { loadImageFromUrl, drawTextOnCanvas } from "@/lib/canvasUtils";
import { Progress } from "@/components/ui/progress"; // Para barra de progreso

interface BulkEditorProps {
    // Props de configuración global recibidas desde Index.tsx
    inkColor: string;
    fontSize: number;
    aspectRatio: "1:1" | "9:16";
    baseTextStyle: "normal" | "bold" | "italic";
    authorTextStyle: "normal" | "bold" | "italic";
    authorFontSize: number;
}

// Estructura para manejar cada par de URL/Frase
interface BulkItem {
    id: number;
    url: string;
    phrase: string;
    author?: string; // Permitir autor opcional por línea? O global? Global por ahora.
    status: "pending" | "loading" | "drawing" | "done" | "error";
    error?: string;
    resultDataUrl?: string; // Para la descarga
}

export const BulkEditor = ({
    inkColor,
    fontSize,
    aspectRatio,
    baseTextStyle,
    authorTextStyle,
    authorFontSize,
}: BulkEditorProps) => {
    const [urlsInput, setUrlsInput] = useState("");
    const [phrasesInput, setPhrasesInput] = useState("");
    const [authorInput, setAuthorInput] = useState(""); // Autor global para el lote
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [processedItems, setProcessedItems] = useState<BulkItem[]>([]); // Para mostrar resultados/errores
    const hiddenCanvasRef = useRef<HTMLCanvasElement>(null); // Canvas oculto para procesar

    const handleProcessBatch = async () => {
        const urls = urlsInput.trim().split('\n').filter(url => url.trim() !== "");
        const phrases = phrasesInput.trim().split('\n').filter(phrase => phrase.trim() !== "");

        if (urls.length === 0 || phrases.length === 0) {
            toast.error("Ingresa al menos una URL y una frase.");
            return;
        }

        if (urls.length !== phrases.length) {
            toast.warning(`Advertencia: El número de URLs (${urls.length}) no coincide con el número de frases (${phrases.length}). Se procesarán ${Math.min(urls.length, phrases.length)} pares.`);
        }

        const itemsToProcess: BulkItem[] = [];
        const count = Math.min(urls.length, phrases.length);
        for (let i = 0; i < count; i++) {
            itemsToProcess.push({
                id: i,
                url: urls[i].trim(),
                phrase: phrases[i].trim(),
                author: authorInput.trim() || undefined, // Usar autor global
                status: "pending",
            });
        }

        setProcessing(true);
        setProgress(0);
        setProcessedItems(itemsToProcess); // Inicializar con estado pendiente

        const canvas = hiddenCanvasRef.current;
        if (!canvas) {
            toast.error("Error interno: No se encontró el canvas.");
            setProcessing(false);
            return;
        }

        const results: BulkItem[] = [];
        let completedCount = 0;

        for (const item of itemsToProcess) {
             const updateItemStatus = (status: BulkItem["status"], error?: string, resultDataUrl?: string) => {
                setProcessedItems(prev => prev.map(p => p.id === item.id ? { ...p, status, error, resultDataUrl } : p));
             };

            updateItemStatus("loading");
            let imageDataUrl: string | null = null;
            try {
                imageDataUrl = await loadImageFromUrl(item.url); // Usar utilidad
                if (!imageDataUrl) throw new Error("No se pudo cargar la imagen desde la URL.");

                updateItemStatus("drawing");
                const img = new Image();
                img.crossOrigin = "anonymous";

                await new Promise((resolve, reject) => {
                    img.onload = resolve;
                    img.onerror = reject;
                    img.src = imageDataUrl!;
                });

                // Dibujar en el canvas oculto
                const success = drawTextOnCanvas(canvas, img, item.phrase, {
                    // Pasar todas las opciones de configuración
                    author: item.author,
                    inkColor,
                    fontSize,
                    aspectRatio, // Usar para establecer tamaño de canvas
                    baseTextStyle,
                    authorTextStyle,
                    authorFontSize,
                    // Necesitamos pasar estado inicial de imagen (pos/scale) o valores fijos
                    imagePosition: { x: 0, y: 0 },
                    imageScale: 1, // O alguna lógica de ajuste inicial si es necesario
                });

                if (!success) throw new Error("Error al dibujar en el canvas.");

                // Obtener Data URL del canvas
                 const resultUrl = canvas.toDataURL("image/png");
                 updateItemStatus("done", undefined, resultUrl);

                 // Descargar automáticamente (o podríamos acumular y zip)
                 const link = document.createElement("a");
                 link.download = `resultado_${item.id + 1}_${aspectRatio}.png`;
                 link.href = resultUrl;
                 link.click();
                 await new Promise(res => setTimeout(res, 100)); // Pequeña pausa entre descargas

            } catch (err: any) {
                console.error(`Error procesando item ${item.id}:`, err);
                updateItemStatus("error", err.message || "Error desconocido");
            } finally {
                completedCount++;
                setProgress(Math.round((completedCount / count) * 100));
            }
        }

        toast.success(`Proceso completado. ${results.filter(r => r.status === 'done').length} imágenes descargadas.`);
        setProcessing(false);
    };

    return (
        <div className="space-y-6">
             {/* Canvas oculto */}
            <canvas ref={hiddenCanvasRef} style={{ display: 'none' }} />

            <Card className="shadow-medium">
                <CardHeader>
                    <CardTitle className="text-xl font-semibold">Entrada Masiva</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="bulk-urls" className="text-base font-medium">
                            URLs de Imágenes (una por línea)
                        </Label>
                        <Textarea
                            id="bulk-urls"
                            placeholder="https://ejemplo.com/imagen1.jpg&#10;https://ejemplo.com/imagen2.png&#10;..."
                            value={urlsInput}
                            onChange={(e) => setUrlsInput(e.target.value)}
                            className="min-h-48 resize-y font-mono text-sm"
                            disabled={processing}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="bulk-phrases" className="text-base font-medium">
                            Frases (una por línea, en orden)
                        </Label>
                        <Textarea
                            id="bulk-phrases"
                            placeholder="Frase para imagen 1...&#10;Frase para imagen 2...&#10;..."
                            value={phrasesInput}
                            onChange={(e) => setPhrasesInput(e.target.value)}
                            className="min-h-48 resize-y"
                            disabled={processing}
                        />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                         <Label htmlFor="bulk-author" className="text-base font-medium">
                             Autor Global (Opcional - se aplicará a todas)
                         </Label>
                         <Textarea
                            id="bulk-author"
                            placeholder="@TuNombreDeUsuario..."
                            value={authorInput}
                            onChange={(e) => setAuthorInput(e.target.value)}
                            className="min-h-16 resize-none"
                            disabled={processing}
                        />
                    </div>
                </CardContent>
            </Card>

            <div className="text-center">
                 <Button
                    onClick={handleProcessBatch}
                    disabled={processing}
                    size="lg"
                    className="bg-gradient-primary shadow-medium hover:shadow-strong transition-all"
                >
                    {processing ? (
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    ) : (
                        <ListChecks className="h-5 w-5 mr-2" />
                    )}
                    {processing ? `Procesando... (${progress}%)` : "Procesar y Descargar Lote"}
                </Button>
                 {processing && <Progress value={progress} className="w-full max-w-md mx-auto mt-4" />}
            </div>

            {/* Opcional: Mostrar tabla de resultados/errores */}
            {processedItems.length > 0 && !processing && (
                 <Card className="shadow-medium mt-6">
                     <CardHeader>
                         <CardTitle className="text-xl font-semibold">Resultados del Procesamiento</CardTitle>
                     </CardHeader>
                     <CardContent>
                         <ul className="space-y-2 max-h-60 overflow-y-auto">
                             {processedItems.map(item => (
                                 <li key={item.id} className={`text-sm p-2 rounded ${item.status === 'done' ? 'bg-green-100 dark:bg-green-900' : item.status === 'error' ? 'bg-red-100 dark:bg-red-900' : 'bg-gray-100 dark:bg-gray-800'}`}>
                                     <strong>Item {item.id + 1}:</strong> {item.url.substring(0, 30)}... - {item.phrase.substring(0, 30)}...
                                     <span className={`ml-2 font-semibold ${item.status === 'done' ? 'text-green-700 dark:text-green-300' : item.status === 'error' ? 'text-red-700 dark:text-red-300' : 'text-gray-500'}`}>
                                        {item.status === 'done' ? '✅ Completado' : item.status === 'error' ? `❌ Error: ${item.error}` : 'Pendiente'}
                                     </span>
                                 </li>
                             ))}
                         </ul>
                     </CardContent>
                 </Card>
             )}

        </div>
    );
};