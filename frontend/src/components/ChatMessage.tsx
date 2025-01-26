import React from "react";
import { cn } from "@/lib/utils";

interface ChatMessageProps {
  message: string;
  isFile?: boolean;
  fileName?: string;
  fileUrl?: string;
  isSent?: boolean;
  context?: string[];  // New prop for document context
  isAnswer?: boolean;  // New prop to identify if it's an answer
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  isFile,
  fileName,
  fileUrl,
  isSent = false,
  context,
  isAnswer = false,
}) => {
  return (
    <div
      className={cn(
        "mb-4 animate-message-in opacity-0",
        isSent ? "ml-auto" : "mr-auto"
      )}
    >
      <div
        className={cn(
          "max-w-[80%] rounded-3xl px-6 py-4 shadow-lg",
          isSent
            ? "bg-fpBlue text-white"
            : "bg-fpWhite text-fpDarkBlue"
        )}
      >
        {isFile ? (
          <div className="flex flex-col gap-2">
            <p className="text-sm">{message}</p>
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-xl bg-white/20 p-2 text-sm hover:bg-white/30"
            >
              📎 {fileName}
            </a>
          </div>
        ) : isAnswer ? (
          <div className="flex flex-col gap-4">
            <div>
              <h3 className="font-bold mb-2">Answer:</h3>
              <p className="text-lg">{message}</p>
            </div>
            {context && context.length > 0 && (
              <div>
                <h3 className="font-bold mb-2">Context:</h3>
                <ul className="list-disc pl-4 text-sm">
                  {context.map((ctx, index) => (
                    <li key={index} className="mb-1">{ctx}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <p className="text-lg">{message}</p>
        )}
      </div>
    </div>
  );
};