import { PenLine } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AIEditor } from "@/components/AIEditor";
import { SimpleEditor } from "@/components/SimpleEditor";

const Index = () => {

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
        <Tabs defaultValue="ai" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
            <TabsTrigger value="ai">Generador IA</TabsTrigger>
            <TabsTrigger value="simple">Editor Simple</TabsTrigger>
          </TabsList>
          
          <TabsContent value="ai">
            <AIEditor />
          </TabsContent>
          
          <TabsContent value="simple">
            <SimpleEditor />
          </TabsContent>
        </Tabs>
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