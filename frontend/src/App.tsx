import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DocumentChat } from './components/DocumentChat';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <div className="flex min-h-screen flex-col bg-gradient-to-br from-fpYellow/20 to-fpBlue/20">
        <header className="bg-fpRed p-4 text-center text-white shadow-lg">
          <h1 className="text-2xl font-bold">Document Chat</h1>
        </header>
        <main className="flex-1 container mx-auto p-4">
          <DocumentChat />
        </main>
      </div>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
