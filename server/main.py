from fastapi import FastAPI, WebSocket
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
from typing import List, AsyncGenerator, NoReturn
import json
from openai import AsyncOpenAI
import uvicorn
import asyncio
import os
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

origins = [
    "http://localhost",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

AsyncOpenAI.api_key = os.getenv("OPENAI_API_KEY")
client = AsyncOpenAI()


class Message(BaseModel):
    role: str
    content: str


class ChatHistory(BaseModel):
    messages: List[Message] = []


chat_history = ChatHistory()


async def get_ai_response(
    message: str, chat_history: ChatHistory
) -> AsyncGenerator[str, None]:
    """
    OpenAI Response
    """
    chat_history.messages.append(Message(role="user", content=message))

    response = await client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[msg.model_dump() for msg in chat_history.messages],
        stream=True,
    )

    all_content = ""
    async for chunk in response:
        content = chunk.choices[0].delta.content
        if content:
            all_content += content
            yield all_content

    chat_history.messages.append(Message(role="assistant", content=all_content))


system_message = "As an experienced educator and expert in your field, you excel at deconstructing complex tasks into understandable segments. Before providing an answer, ask the user clarifying questions to ensure you fully understand their request. Engage the user by asking follow-up questions to gather more context and details. Once you have a clear understanding of the user's needs, provide a clear, concise, and step-by-step explanation that covers the process, theory, and practical application of the subject matter."


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket) -> NoReturn:
    """
    Websocket for AI responses
    """
    await websocket.accept()
    while True:
        data = await websocket.receive_text()
        data = json.loads(data)
        message = data["message"]

        # Create a separate chat history for each WebSocket connection
        if not hasattr(websocket, "chat_history"):
            websocket.chat_history = ChatHistory()

        websocket.chat_history.messages.append(
            Message(role="system", content=system_message)
        )

        async for text in get_ai_response(message, websocket.chat_history):
            await websocket.send_text(text)


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        # log_level="debug",
        reload=True,
    )
