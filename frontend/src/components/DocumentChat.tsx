import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/services/api";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";

export function DocumentChat() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<Array<{
    message: string;
    isSent: boolean;
    isFile?: boolean;
    fileName?: string;
    context?: string[];
    isAnswer?: boolean;
  }>>([]);

  const uploadMutation = useMutation({
    mutationFn: api.uploadFile,
    onSuccess: (data) => {
      console.log('Upload Response Data:', data);
      if (!data.session_id) {
        console.error('No session_id in response:', data);
        return;
      }
      setSessionId(data.session_id);
      console.log('Session ID set to:', data.session_id);
      setMessages(prev => [...prev, {
        message: `File uploaded successfully. You can now ask questions about your document.`,
        isSent: false
      }]);
    },
    onError: (error) => {
      console.error('Upload Error:', error);
      setMessages(prev => [...prev, {
        message: `Upload failed: ${error.message}`,
        isSent: false
      }]);
    }
  });

  const queryMutation = useMutation({
    mutationFn: (question: string) => {
      console.log('Sending query with sessionId:', sessionId);
      if (!sessionId) {
        throw new Error('No session ID available');
      }
      return api.queryDocument(sessionId, question);
    },
    onSuccess: (data) => {
      console.log('Query Response:', data);
      setMessages(prev => [
        ...prev,
        { message: question, isSent: true },
        { 
          message: data.answer, 
          isSent: false, 
          context: data.context,
          isAnswer: true 
        }
      ]);
    },
    onError: (error) => {
      console.error('Query Error:', error);
      setMessages(prev => [...prev, {
        message: `Query failed: ${error.message}`,
        isSent: false
      }]);
    }
  });

  const handleFileUpload = async (file: File) => {
    console.log('Uploading file:', file.name);
    setMessages(prev => [...prev, {
      message: `Uploading file: ${file.name}`,
      isSent: true,
      isFile: true,
      fileName: file.name
    }]);
    try {
      await uploadMutation.mutateAsync(file);
    } catch (error) {
      console.error('Upload handler error:', error);
    }
  };

  const handleSendMessage = async (message: string) => {
    if (!sessionId) {
      setMessages(prev => [...prev, {
        message: 'Please upload a document first',
        isSent: false
      }]);
      return;
    }

    if (message.trim()) {
      // Add user's message immediately
      setMessages(prev => [...prev, {
        message: message,
        isSent: true
      }]);

      try {
        await queryMutation.mutateAsync(message);
      } catch (error) {
        console.error('Question handler error:', error);
        setMessages(prev => [...prev, {
          message: `Error: ${error.message}`,
          isSent: false
        }]);
      }
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        {messages.map((msg, index) => (
          <ChatMessage
            key={index}
            message={msg.message}
            isSent={msg.isSent}
            isFile={msg.isFile}
            fileName={msg.fileName}
            context={msg.context}
            isAnswer={msg.isAnswer}
          />
        ))}
      </div>
      <ChatInput 
        onSendMessage={handleSendMessage}
        onFileUpload={handleFileUpload}
        disabled={uploadMutation.isPending || queryMutation.isPending}
      />
    </div>
  );
} 