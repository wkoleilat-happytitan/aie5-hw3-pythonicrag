interface QueryRequest {
  session_id: string;
  question: string;
}

interface QueryResponse {
  answer: string;
  context: string[];
}

const API_BASE_URL = 'http://localhost:8000'; // Make sure this matches your backend URL

export const api = {
  async uploadFile(file: File) {
    console.log('=== API UPLOAD STARTED ===');
    console.log('Uploading file:', file.name);
    
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Upload failed:', errorText);
        throw new Error(`Upload failed: ${errorText}`);
      }

      const data = await response.json();
      console.log('=== API UPLOAD RESPONSE ===', data);
      return data;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  },

  async queryDocument(sessionId: string, question: string) {
    console.log('=== API QUERY STARTED ===');
    console.log('Session ID:', sessionId);
    console.log('Question:', question);

    try {
      const response = await fetch(`${API_BASE_URL}/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: sessionId,
          question,
        } as QueryRequest),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Query failed:', errorText);
        throw new Error(`Query failed: ${errorText}`);
      }

      const data = await response.json();
      console.log('=== API QUERY RESPONSE ===', data);
      return data;
    } catch (error) {
      console.error('Query error:', error);
      throw error;
    }
  },
}; 