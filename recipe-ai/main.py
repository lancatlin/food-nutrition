from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from model import load_model, generate_recipes, DEVICE


# ── Lifespan: warm up the model once at startup ────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Runs load_model() exactly once when the microservice process starts.
    The model stays in memory for the lifetime of the process.
    FastAPI will not serve any requests until this completes.
    """
    load_model()
    yield
    # Add any cleanup logic here (e.g. freeing GPU memory) on shutdown


app = FastAPI(title="Recipe Generator AI Service", lifespan=lifespan)


# ── Schemas ────────────────────────────────────────────────────────────────────

class RecipeRequest(BaseModel):
    ingredients: list[str] = Field(..., min_length=1, examples=[["mushrooms", "cabbage", "soy sauce"]])
    num_recipes: int = Field(default=3, ge=1, le=10)
    max_new_tokens: int = Field(default=1024, ge=64, le=2048)


class RecipeResponse(BaseModel):
    recipes: list[dict]
    device: str  # tells the caller whether inference ran on CPU or CUDA


# ── Endpoints ──────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    """
    Health check — returns 200 once the model is loaded and ready.
    Also reports which device the model is running on.
    """
    return {"status": "ok", "device": DEVICE}


@app.post("/generate", response_model=RecipeResponse)
def generate(request: RecipeRequest):
    """
    Generate recipes from a list of ingredients.
    Called by recipe_client.py in the backend — not by the end user directly.
    """
    if not request.ingredients:
        raise HTTPException(status_code=400, detail="Ingredients list cannot be empty.")

    try:
        recipes = generate_recipes(
            ingredients=request.ingredients,
            num_recipes=request.num_recipes,
            max_new_tokens=request.max_new_tokens,
        )
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))

    return RecipeResponse(recipes=recipes, device=DEVICE)