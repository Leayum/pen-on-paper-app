import { useState } from "react";
import { ImageUpload } from "@/components/ImageUpload";
import { PreviewCanvas } from "@/components/PreviewCanvas";
import { TextControls } from "@/components/TextControls";
import { PenLine } from "lucide-react";

const Index = () => {
  const [image, setImage] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [fontStyle, setFontStyle] = useState("Dancing Script");
  const [inkColor, setInkColor] = useState("#000000");

  const handleImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleImageRemove = () => {
    setImage(null);
  };

  return (
    <div className="min-h-screen bg-gradient-soft">
      {/* Header */}
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

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Column 1: Upload Image */}
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <ImageUpload
              image={image}
              onImageUpload={handleImageUpload}
              onImageRemove={handleImageRemove}
            />
          </div>

          {/* Column 2: Preview */}
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
            <PreviewCanvas
              image={image}
              text={text}
              fontStyle={fontStyle}
              inkColor={inkColor}
            />
          </div>

          {/* Column 3: Text Controls */}
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
            <TextControls
              text={text}
              fontStyle={fontStyle}
              inkColor={inkColor}
              onTextChange={setText}
              onFontStyleChange={setFontStyle}
              onInkColorChange={setInkColor}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-12 py-6 border-t border-border bg-card">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>Crea textos manuscritos realistas con un solo clic</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
