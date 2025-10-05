import { Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRef } from "react";

interface ImageUploadProps {
  image: string | null;
  onImageUpload: (file: File) => void;
  onImageRemove: () => void;
}

export const ImageUpload = ({ image, onImageUpload, onImageRemove }: ImageUploadProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      onImageUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      onImageUpload(file);
    }
  };

  return (
    <Card className="h-full shadow-medium">
      <CardHeader>
        <CardTitle className="text-2xl font-semibold">Subir Imagen Original</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {image ? (
          <div className="relative">
            <img
              src={image}
              alt="Uploaded"
              className="w-full h-80 object-contain rounded-lg border-2 border-border"
            />
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 shadow-medium"
              onClick={onImageRemove}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className="border-2 border-dashed border-border rounded-lg p-8 text-center h-80 flex flex-col items-center justify-center bg-gradient-soft transition-all hover:border-primary cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-2">
              Arrastra una imagen aquí o haz clic para seleccionar
            </p>
            <p className="text-sm text-muted-foreground">PNG, JPG, WEBP (máx. 10MB)</p>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="flex gap-2">
          <Button
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 bg-gradient-primary shadow-medium hover:shadow-strong transition-all"
          >
            <Upload className="h-4 w-4 mr-2" />
            Cargar Imagen
          </Button>
          {image && (
            <Button
              variant="outline"
              onClick={onImageRemove}
              className="transition-all hover:bg-destructive hover:text-destructive-foreground"
            >
              <X className="h-4 w-4 mr-2" />
              Eliminar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
