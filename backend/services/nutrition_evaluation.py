from google import genai
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent / ".env.dev")

GEMINI_API_KEY = "AIzaSyBPAm3XkZxF_wn3oZVIh4WIQzpKNy1gxpU"

client = genai.Client(api_key=GEMINI_API_KEY)
MODEL = "models/gemini-2.5-flash"

def get_nutrition_explanation(recipe_data: dict) -> str:
    """
    Takes a recipe JSON object and returns a human-friendly health summary.
    """
    # Extract data for the prompt
    title = recipe_data.get("title", "this recipe")
    stats = recipe_data.get("recipe_per_100g", {})
    
    prompt = f"""
    As a friendly nutritionist, explain in 4-5 concise sentences why this recipe is healthy 
    based on these stats (per 100g):
    - Recipe: {title}
    - Calories: {stats.get('calories_kcal')} kcal
    - Protein: {stats.get('protein_g')}g
    - Fiber: {stats.get('fiber_g')}g
    - Sugar: {stats.get('sugar_g')}g
    
    Focus on the balance of nutrients. Keep it encouraging and brief.
    """

    try:
        response = client.models.generate_content(
            model=MODEL,
            contents=prompt
        )
        return response.text.strip()
    except Exception as e:
        print(f"Gemini API error: {e}")
        return "Nutritional explanation unavailable."


if __name__ == "__main__":
    sample_json = {
        "title": "ostrich casserole with brown rice and mushrooms",
        "recipe_per_100g": {
            "calories_kcal": 94.16,
            "protein_g": 3.36,
            "fiber_g": 5.46,
            "sugar_g": 7.5
        }
    }
    print(get_nutrition_explanation(sample_json))