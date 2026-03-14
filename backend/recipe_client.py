import os
import httpx
from fastapi import HTTPException

# Driven from .env so it works both locally and inside Docker without code changes:
#   Local testing : AI_SERVICE_URL=http://localhost:8001
#   Docker        : AI_SERVICE_URL=http://recipe-ai:8001
AI_SERVICE_URL = os.getenv("AI_SERVICE_URL", "http://localhost:8001")


async def get_recipes(
    ingredients: list[str],
    num_recipes: int = 3,
    max_new_tokens: int = 1024,
) -> list[dict]:
    """
    Call the AI microservice's /generate endpoint and return the recipe list.
    Called by route handlers in backend/main.py.
    """
    payload = {
        "ingredients": ingredients,
        "num_recipes": num_recipes,
        "max_new_tokens": max_new_tokens,
    }

    try:
        async with httpx.AsyncClient(timeout=600.0) as client:
            response = await client.post(f"{AI_SERVICE_URL}/generate", json=payload)
            response.raise_for_status()
            return response.json()["recipes"]

    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="AI service timed out.")
    except httpx.HTTPStatusError as e:
        raise HTTPException(
            status_code=502,
            detail=f"AI service returned an error: {e.response.text}"
        )
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=503,
            detail=f"Could not reach AI service: {str(e)}"
        )