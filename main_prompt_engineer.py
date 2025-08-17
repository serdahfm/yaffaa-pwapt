from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os
from dotenv import load_dotenv
import openai
import json

# Load environment variables
load_dotenv()

app = FastAPI(title="Prompt Engineer", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Pydantic models
class PromptRequest(BaseModel):
    user_prompt: str
    mode: str = "default"  # default, yafa, ms
    context: Optional[str] = None

class PromptResponse(BaseModel):
    engineered_prompt: str
    score: int  # 0-100
    suggestions: List[str]
    mode_used: str
    guarantees: List[str]

class SABIRequest(BaseModel):
    original_prompt: str
    ai_response: str
    user_feedback: str
    iteration: int = 1

class SABIResponse(BaseModel):
    follow_up_prompt: str
    score: int
    suggestions: List[str]

# Initialize OpenAI client
client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Prompt engineering system prompts for each mode
SYSTEM_PROMPTS = {
    "default": """You are an expert prompt engineer. Your job is to transform vague user inputs into highly effective, engineered prompts that will deliver precise, comprehensive AI responses.

Key Principles:
- Use specific, actionable language
- Include context and constraints
- Specify output format and structure
- Add relevant examples when helpful
- Ensure the prompt is copy-paste ready for any AI platform

Score the prompt 0-100 based on:
- Specificity (25 points)
- Clarity (25 points)
- Completeness (20 points)
- Actionability (20 points)
- Format readiness (10 points)

Provide 2-3 specific suggestions to improve the score.""",

    "yafa": """You are a STRICT prompt engineer operating in YAFA mode. You must adhere to the highest standards of prompt engineering and STOP if you cannot deliver a guaranteed result.

YAFA Mode Rules:
- Technical precision above all
- Stop and refuse if uncertain
- Use industry-standard prompt engineering techniques
- Include explicit contracts and schemas
- Force specific output formats
- No assumptions or placeholders

Score the prompt 0-100 based on:
- Technical precision (30 points)
- Guarantee strength (25 points)
- Schema completeness (25 points)
- Risk assessment (20 points)

If score < 70, refuse to proceed and explain why.""",

    "ms": """You are a prompt engineer in MS (Multi-Space) mode, designed for thinking spaces and brainstorming. You help users explore ideas and get AI to suggest novel approaches.

MS Mode Features:
- Use 1-3 shot prompting strategically
- Engage AI in brainstorming mode
- Suggest alternative approaches
- Provide multiple perspectives
- Encourage creative exploration

Score the prompt 0-100 based on:
- Exploration potential (30 points)
- Creativity stimulation (25 points)
- Perspective diversity (20 points)
- Engagement quality (25 points)

Focus on unlocking AI's creative and analytical potential."""
}

@app.get("/", response_class=HTMLResponse)
async def root():
    with open("static/index.html", "r") as f:
        return HTMLResponse(content=f.read())

@app.post("/api/engineer", response_model=PromptResponse)
async def engineer_prompt(request: PromptRequest):
    """Transform user prompt into engineered prompt"""
    try:
        system_prompt = SYSTEM_PROMPTS.get(request.mode, SYSTEM_PROMPTS["default"])
        
        # Create the engineering prompt
        engineering_prompt = f"""
{system_prompt}

User Input: {request.user_prompt}
Context: {request.context or "None provided"}

Please:
1. Transform this into an engineered prompt
2. Score it 0-100 with breakdown
3. Provide 2-3 improvement suggestions
4. List any guarantees this prompt provides

Format your response as JSON:
{{
    "engineered_prompt": "...",
    "score": 85,
    "score_breakdown": {{"specificity": 20, "clarity": 25, "completeness": 18, "actionability": 18, "format": 9}},
    "suggestions": ["..."],
    "guarantees": ["..."]
}}
"""

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": engineering_prompt}
            ],
            temperature=0.3 if request.mode == "yafa" else 0.7
        )
        
        # Parse AI response
        try:
            ai_response = json.loads(response.choices[0].message.content)
            return PromptResponse(
                engineered_prompt=ai_response["engineered_prompt"],
                score=ai_response["score"],
                suggestions=ai_response["suggestions"],
                mode_used=request.mode,
                guarantees=ai_response.get("guarantees", [])
            )
        except json.JSONDecodeError:
            # Fallback if AI doesn't return proper JSON
            return PromptResponse(
                engineered_prompt=response.choices[0].message.content,
                score=75,
                suggestions=["AI response format unclear"],
                mode_used=request.mode,
                guarantees=["Basic prompt engineering applied"]
            )
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prompt engineering failed: {str(e)}")

@app.post("/api/sabi", response_model=SABIResponse)
async def sabi_feedback(request: SABIRequest):
    """Generate follow-up prompt based on SABI feedback loop"""
    try:
        sabi_prompt = f"""
You are a prompt engineer helping with the SABI (Systematic AI Brainstorming Iteration) feedback loop.

Original Prompt: {request.original_prompt}
AI Response: {request.ai_response}
User Feedback: {request.user_feedback}
Iteration: {request.iteration}

Based on this feedback loop, create a new engineered prompt that:
1. Addresses the user's feedback
2. Builds on the AI's previous response
3. Improves the original prompt
4. Is ready for copy-paste

Score the new prompt 0-100 and provide improvement suggestions.

Format as JSON:
{{
    "follow_up_prompt": "...",
    "score": 85,
    "suggestions": ["..."]
}}
"""

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a prompt engineer specializing in feedback loop optimization."},
                {"role": "user", "content": sabi_prompt}
            ],
            temperature=0.7
        )
        
        try:
            ai_response = json.loads(response.choices[0].message.content)
            return SABIResponse(
                follow_up_prompt=ai_response["follow_up_prompt"],
                score=ai_response["score"],
                suggestions=ai_response["suggestions"]
            )
        except json.JSONDecodeError:
            return SABIResponse(
                follow_up_prompt=response.choices[0].message.content,
                score=75,
                suggestions=["AI response format unclear"]
            )
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"SABI processing failed: {str(e)}")

@app.get("/api/health")
async def health():
    return {"status": "healthy", "service": "Prompt Engineer"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
