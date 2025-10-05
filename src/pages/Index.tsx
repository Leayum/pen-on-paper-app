import { useState } from "react";
import { ImageUpload } from "@/components/ImageUpload";
import { PreviewCanvas } from "@/components/PreviewCanvas";
import { TextControls } from "@/components/TextControls";
import { PenLine } from "lucide-react";
import { toast } from "sonner";
import { GoogleGenerativeAI } from "@google/generative-ai";

// ADVERTENCIA: Almacenar API keys en el código es inseguro para producción
// Considera usar Lovable AI en su lugar
const GEMINI_API_KEY = "AIzaSyDQPXC8fVU5soEs4AwVTZ57fgH1dGTGVhM";

const dataUrlToGenerativePart = (dataUrl: string, mimeType: string) => {
  const base64Data = dataUrl.split(",")[1]; 
  return {
    inlineData: {
      data: base64Data,
      mimeType,
    },
  };
};

const Index = () => {
  const [image, setImage] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [fontStyle, setFontStyle] = useState("Dancing Script");
  const [inkColor, setInkColor] = useState("#000000");
  
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [imageMimeType, setImageMimeType] = useState<string | null>(null);

  const handleImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setImage(e.target?.result as string);
      setGeneratedImage(null);
      setImageMimeType(file.type);
    };
    reader.readAsDataURL(file);
  };

  const handleImageRemove = () => {
    setImage(null);
    setGeneratedImage(null);
    setImageMimeType(null);
  };

  const handleGenerateImage = async () => {
    if (!image || !text.trim() || !imageMimeType) {
      toast.error("Sube una imagen y escribe una frase.");
      return;
    }

    setIsGenerating(true);
    setGeneratedImage(null);

    try {
      const inkColorMap: { [key: string]: string } = {
        "#000000": "tinta negra oscura, simulando un bolígrafo de gel",
        "#1e40af": "tinta azul clásica, con ligero desvanecimiento en los bordes",
        "#991b1b": "tinta roja intensa, como de pluma",
        "#064e3b": "tinta verde oscuro, con textura de tiza",
      };

      const fontStyleMap: { [key: string]: string } = {
        "Dancing Script": "cursiva elegante y fluida con trazos finos",
        "Pacifico": "manuscrita atrevida y redondeada, tipo marcador",
        "Caveat": "escritura casual con letras ligeramente irregulares",
      };

      const inkDescription = inkColorMap[inkColor] || "tinta de color realista";
      const styleDescription = fontStyleMap[fontStyle] || "estilo de caligrafía natural";

      const realismPrompt = `
Añade el siguiente texto directamente sobre la imagen de la hoja de papel en blanco que he proporcionado.

El objetivo es lograr un efecto de escritura a mano **ultra-realista**, donde la **tinta parezca haber sido absorbida en las fibras del papel** y genere una **sombra ligera** para dar profundidad. No debe verse como texto digital plano; la imagen editada debe parecer una fotografía real de la hoja con el texto **integrado** como si siempre hubiera estado allí.

* **Estilo de Caligrafía:** Utiliza una fuente que simule una escritura "${styleDescription}" con un trazo natural y humano.
* **Color de la Tinta:** Utiliza ${inkDescription}.
* **Contenido:** El texto a añadir es: "${text}"

Genera solo la imagen editada como resultado.
      `;

      console.log("--- PROMPT ENVIADO A GEMINI ---");
      console.log(realismPrompt);
      console.log("------------------------------");

      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-image" });

      const imagePart = dataUrlToGenerativePart(image, imageMimeType);
      
      toast.info("Generando imagen realista con Gemini...");

      const result = await model.generateContent([realismPrompt, imagePart]);
      const response = await result.response;
      
      // Gemini devuelve imágenes en diferentes formatos dependiendo del modelo
      // Intentamos extraer la imagen generada
      if (response.candidates && response.candidates[0]) {
        const candidate = response.candidates[0];
        
        // Buscar partes de imagen en la respuesta
        if (candidate.content && candidate.content.parts) {
          for (const part of candidate.content.parts) {
            if (part.inlineData) {
              const base64Image = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
              setGeneratedImage(base64Image);
              toast.success("¡Imagen generada con éxito!");
              return;
            }
          }
        }
      }

      // Si no se encontró imagen, mostrar el texto de respuesta
      const textResponse = response.text();
      console.log("Respuesta de Gemini:", textResponse);
      toast.warning("Gemini respondió pero no generó una imagen. Revisa la consola.");

    } catch (error) {
      console.error("Error en la generación:", error);
      toast.error(`Error: ${error instanceof Error ? error.message : "Error desconocido"}`);
    } finally {
      setIsGenerating(false);
    }
  };

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

      <main className="container mx-auto px-4 py-8">
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
              fontStyle={fontStyle}
              inkColor={inkColor}
              generatedImage={generatedImage}
              isGenerating={isGenerating}
            />
          </div>

          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
            <TextControls
              text={text}
              fontStyle={fontStyle}
              inkColor={inkColor}
              onTextChange={setText}
              onFontStyleChange={setFontStyle}
              onInkColorChange={setInkColor}
              onGenerate={handleGenerateImage}
              isGenerating={isGenerating}
              isImageLoaded={!!image}
            />
          </div>
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
