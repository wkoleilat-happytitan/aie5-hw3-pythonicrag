import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Paperclip, Send } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  onFileUpload: (file: File) => void;
  disabled?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ 
  onSendMessage, 
  onFileUpload,
  disabled 
}) => {
  const [message, setMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message);
      setMessage("");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please upload files smaller than 5MB",
          variant: "destructive",
        });
        return;
      }
      onFileUpload(file);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-4 p-4 bg-white shadow-lg rounded-lg">
      <Input
        type="file"
        onChange={handleFileChange}
        className="hidden"
        ref={fileInputRef}
        accept=".txt,.pdf"
      />
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-14 w-14 rounded-full border-2 border-fpYellow bg-fpWhite hover:bg-fpYellow/10"
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled}
      >
        <Paperclip className="h-6 w-6 text-fpDarkBlue" />
      </Button>
      <Input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type a message..."
        className="h-14 rounded-full border-2 border-fpBlue bg-fpWhite text-lg placeholder:text-gray-400 focus-visible:ring-fpBlue"
        disabled={disabled}
      />
      <Button
        type="submit"
        className="h-14 w-14 rounded-full bg-fpRed hover:bg-fpRed/90"
        disabled={disabled || !message.trim()}
      >
        <Send className="h-6 w-6" />
      </Button>
    </form>
  );
};