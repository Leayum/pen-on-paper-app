import { useState } from "react";
import { PenLine, Bold, Italic, Type } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AIEditor } from "@/components/AIEditor";
import { SimpleEditor } from "@/components/SimpleEditor";
import { BulkEditor } from "@/components/BulkEditor"; // Asegúrate de crear este archivo
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Definiciones de colores (puedes moverlas a un archivo de constantes si prefieres)
const inkColors = [
  { value: "#000000", label: "Negro" },
  { value: "#FFFFFF", label: "Blanco" },
  { value: "#1e40af", label: "Azul" },
  { value: "#991b1b", label: "Rojo" },
  { value: "#064e3b", label: "Verde" },
];

const Index = () => {
  // Estado compartido para la configuración del texto (movido desde SimpleEditor)
  const [inkColor, setInkColor] = useState("#000000");
  const [fontSize, setFontSize] = useState<number>(40);
  const [aspectRatio, setAspectRatio] = useState<"1:1" | "9:16">("1:1");
  const [baseTextStyle, setBaseTextStyle] = useState<"normal" | "bold" | "italic">("normal");
  const [authorTextStyle, setAuthorTextStyle] = useState<"normal" | "bold" | "italic">("normal");
  const [authorFontSize, setAuthorFontSize] = useState<number>(24);

  return (
    <div className="min-h-screen bg-gradient-soft">
      <header className="bg-card border-b border-border shadow-soft">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-primary">
              <PenLine className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Editor de Texto Manuscrito
              </h1>
              <p className="text-muted-foreground">
                Añade texto realista escrito a mano sobre tus imágenes
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Contenedor principal ajustado para incluir controles globales */}
      <main className="container mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-4 gap-6">

        {/* Columna de Controles Globales (visible en Simple y Masivo) */}
        <div className="lg:col-span-1 animate-in fade-in slide-in-from-left-4 duration-500">
           <Card className="shadow-medium sticky top-4"> {/* Hacerla sticky */}
            <CardHeader>
              <CardTitle className="text-xl font-semibold">Configuración Global</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Controles de Texto movidos aquí */}
               <div className="space-y-2">
                 <Label className="text-base font-medium">Proporción:</Label>
                 <div className="grid grid-cols-2 gap-2">
                   <Button
                    onClick={() => setAspectRatio("1:1")}
                    variant={aspectRatio === "1:1" ? "default" : "outline"}
                    size="sm"
                   >
                    1:1
                   </Button>
                   <Button
                    onClick={() => setAspectRatio("9:16")}
                    variant={aspectRatio === "9:16" ? "default" : "outline"}
                    size="sm"
                   >
                    9:16
                   </Button>
                 </div>
               </div>

               <div className="space-y-2">
                 <Label htmlFor="global-color" className="text-base font-medium">Color Tinta:</Label>
                 <Select value={inkColor} onValueChange={setInkColor}>
                   <SelectTrigger id="global-color"><SelectValue /></SelectTrigger>
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

               <div className="space-y-2">
                 <Label htmlFor="font-size" className="text-base font-medium">Tamaño Frase: {fontSize}px</Label>
                 <Slider id="font-size" min={10} max={100} step={1} value={[fontSize]} onValueChange={(v) => setFontSize(v[0])} />
               </div>
               <div className="flex items-center gap-2">
                 <Label className="text-sm font-medium">Formato Frase:</Label>
                 <div className="flex gap-1">
                    <Button type="button" size="sm" variant={baseTextStyle === "normal" ? "default" : "outline"} onClick={() => setBaseTextStyle("normal")} className="h-8 w-8 p-0"><Type className="h-4 w-4" /></Button>
                    <Button type="button" size="sm" variant={baseTextStyle === "bold" ? "default" : "outline"} onClick={() => setBaseTextStyle("bold")} className="h-8 w-8 p-0"><Bold className="h-4 w-4" /></Button>
                    <Button type="button" size="sm" variant={baseTextStyle === "italic" ? "default" : "outline"} onClick={() => setBaseTextStyle("italic")} className="h-8 w-8 p-0"><Italic className="h-4 w-4" /></Button>
                 </div>
               </div>

               <div className="space-y-2 pt-2 border-t">
                 <Label htmlFor="author-font-size" className="text-base font-medium">Tamaño Autor: {authorFontSize}px</Label>
                 <Slider id="author-font-size" min={10} max={60} step={1} value={[authorFontSize]} onValueChange={(v) => setAuthorFontSize(v[0])} />
               </div>
                <div className="flex items-center gap-2">
                 <Label className="text-sm font-medium">Formato Autor:</Label>
                 <div className="flex gap-1">
                    <Button type="button" size="sm" variant={authorTextStyle === "normal" ? "default" : "outline"} onClick={() => setAuthorTextStyle("normal")} className="h-8 w-8 p-0"><Type className="h-4 w-4" /></Button>
                    <Button type="button" size="sm" variant={authorTextStyle === "bold" ? "default" : "outline"} onClick={() => setAuthorTextStyle("bold")} className="h-8 w-8 p-0"><Bold className="h-4 w-4" /></Button>
                    <Button type="button" size="sm" variant={authorTextStyle === "italic" ? "default" : "outline"} onClick={() => setAuthorTextStyle("italic")} className="h-8 w-8 p-0"><Italic className="h-4 w-4" /></Button>
                 </div>
               </div>
               <p className="text-xs text-muted-foreground pt-2">
                 Esta configuración se aplica al Editor Simple y a la Carga Masiva.
               </p>
             </CardContent>
           </Card>
        </div>

        {/* Columna de Editores */}
        <div className="lg:col-span-3">
          <Tabs defaultValue="ai" className="w-full">
            <TabsList className="grid w-full max-w-lg mx-auto grid-cols-3 mb-8"> {/* Cambiado a 3 columnas */}
              <TabsTrigger value="ai">Generador IA</TabsTrigger>
              <TabsTrigger value="simple">Editor Simple</TabsTrigger>
              <TabsTrigger value="bulk">Carga Masiva</TabsTrigger> {/* Nueva Pestaña */}
            </TabsList>

            <TabsContent value="ai">
              <AIEditor />
            </TabsContent>

            <TabsContent value="simple">
              {/* Pasar props de configuración global */}
              <SimpleEditor {...{ inkColor, fontSize, aspectRatio, baseTextStyle, authorTextStyle, authorFontSize }} />
            </TabsContent>

            <TabsContent value="bulk">
              {/* Pasar props de configuración global */}
              <BulkEditor {...{ inkColor, fontSize, aspectRatio, baseTextStyle, authorTextStyle, authorFontSize }} />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <footer className="mt-12 py-6 border-t border-border bg-card">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>Crea textos manuscritos realistas con un solo clic</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;