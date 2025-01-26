from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import asyncio
import tempfile
import shutil
import os
import uuid
import logging

from aimakerspace.text_utils import CharacterTextSplitter, TextFileLoader, PDFLoader
from aimakerspace.openai_utils.prompts import UserRolePrompt, SystemRolePrompt
from aimakerspace.vectordatabase import VectorDatabase
from aimakerspace.openai_utils.chatmodel import ChatOpenAI

# Set up logging with more visible format
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI()

# Add a test log when the server starts
logger.info("Server starting up...")

# Update CORS middleware to include port 8080
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8080",  # Add this for your frontend
        "http://localhost:5173",  # Keep this for development
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Store user sessions (in production, use Redis or a proper database)
user_sessions = {}

# Initialize prompt templates
system_template = """\
Use the following context to answer a users question. If you cannot find the answer in the context, say you don't know the answer."""
system_role_prompt = SystemRolePrompt(system_template)

user_prompt_template = """\
Context:
{context}

Question:
{question}
"""
user_role_prompt = UserRolePrompt(user_prompt_template)

# Add this after the prompt templates and before the Query class
class RetrievalAugmentedQAPipeline:
    def __init__(self, llm: ChatOpenAI(), vector_db_retriever: VectorDatabase) -> None:
        self.llm = llm
        self.vector_db_retriever = vector_db_retriever

    async def arun_pipeline(self, user_query: str):
        context_list = self.vector_db_retriever.search_by_text(user_query, k=4)

        context_prompt = ""
        for context in context_list:
            context_prompt += context[0] + "\n"

        formatted_system_prompt = system_role_prompt.create_message()

        formatted_user_prompt = user_role_prompt.create_message(question=user_query, context=context_prompt)

        async def generate_response():
            async for chunk in self.llm.astream([formatted_system_prompt, formatted_user_prompt]):
                yield chunk

        return {"response": generate_response(), "context": context_list}

class Query(BaseModel):
    session_id: str
    question: str

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    logger.info("Upload endpoint called")  # Test log
    session_id = str(uuid.uuid4())
    logger.info(f"Created new session ID: {session_id}")
    
    with tempfile.NamedTemporaryFile(delete=False, suffix=f".{file.filename.split('.')[-1]}") as temp_file:
        # Copy uploaded file to temp file
        shutil.copyfileobj(file.file, temp_file)
        
        # Create appropriate loader
        if file.filename.lower().endswith('.pdf'):
            loader = PDFLoader(temp_file.name)
        else:
            loader = TextFileLoader(temp_file.name)
            
        try:
            # Process the file
            text_splitter = CharacterTextSplitter()
            documents = loader.load_documents()
            texts = text_splitter.split_texts(documents)
            
            # Create vector database
            vector_db = VectorDatabase()
            vector_db = await vector_db.abuild_from_list(texts)
            
            # Create RAG pipeline
            chat_openai = ChatOpenAI()
            rag_pipeline = RetrievalAugmentedQAPipeline(
                vector_db_retriever=vector_db,
                llm=chat_openai
            )
            
            # Store in session
            user_sessions[session_id] = rag_pipeline
            
            logger.info(f"File uploaded successfully for session: {session_id}")
            return {"session_id": session_id, "message": "File processed successfully"}
        finally:
            # Cleanup
            os.unlink(temp_file.name)

@app.post("/query")
async def query(query: Query):
    logger.info("Query endpoint called")  # Test log
    logger.info(f"Received query for session: {query.session_id}")
    
    if query.session_id not in user_sessions:
        logger.error(f"Session not found: {query.session_id}")
        return {"error": "Session not found. Please upload a file first."}
    
    chain = user_sessions[query.session_id]
    result = await chain.arun_pipeline(query.question)
    
    # Collect streaming response
    response_text = ""
    async for chunk in result["response"]:
        response_text += chunk
    
    logger.info(f"Query processed successfully for session: {query.session_id}")
    return {
        "answer": response_text,
        "context": [ctx[0] for ctx in result["context"]]
    }

@app.on_event("shutdown")
async def shutdown_event():
    # Clear sessions on shutdown
    user_sessions.clear()