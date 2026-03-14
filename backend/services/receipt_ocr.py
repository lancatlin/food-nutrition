import io
from enum import Enum
from typing import List

from google import genai
from PIL import Image
from pydantic import BaseModel


client = genai.Client(api_key="AIzaSyAr2nDF5DRgKNOYYD79_rK6GTH3T_-TKt0")
MODEL = "models/gemini-2.5-flash-lite"


class Category(str, Enum):
    FOOD = "Food"
    NON_FOOD = "Non-Food"

class ProductSummary(BaseModel):
    product_type: str
    total_quantity: float
    unit: str
    category: Category

class AggregatedBill(BaseModel):
    items: List[ProductSummary]


def extract_receipt_items(image_bytes: bytes) -> AggregatedBill:
    """
    Takes raw image bytes, sends them to Gemini, and returns structured receipt data.
    
    Args:
        image_bytes: Raw bytes of a JPEG, PNG, or WEBP image.

    Returns:
        AggregatedBill with a list of ProductSummary items.

    Raises:
        ValueError: If the image cannot be processed.
        Exception: If the Gemini API call fails.
    """
    # 1. Compress and resize the image
    img = Image.open(io.BytesIO(image_bytes))

    if img.mode in ("RGBA", "P"):
        img = img.convert("RGB")

    img.thumbnail((1024, 1024))
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=85)
    compressed_bytes = buf.getvalue()

    # 2. Call Gemini
    response = client.models.generate_content(
        model=MODEL,
        contents=[
            """Analyze this shopping bill with high precision:
            1. Segregate items into 'Food' or 'Non-Food'.
            2. Extract the weight (kg/g/ml) if available. If no weight is found, use 'units'.
            3. For items like 'potatoes' or 'onions', look specifically for kg/g values. Do not confuse 1.076kg with 1076 units.
            4. Group by product type and sum the quantities for the same unit.
            5. Ignore the brand names, Be concerned only with the product type.
            6. Do not ignore the number of units taken (example: 3 @ $10.50 each and so on(usually it is below the listed item)) then multiply with quantity of 1 unit to get the total quantity purchased.
            7. remember these units(not exhaustive) and replace them as follows: pk/pc/p -> pieces, l/L -> litres, g/G/grm/gms -> grams, kg/kilo -> kilograms
            8. Do NOT print the quantity in the product type
            9. And always identify the short forms used for items and convert them into full forms. 
            10. Ignore the supermarket names(like coles and woolworths)
            11. Return ONLY the JSON.""",
            {"inline_data": {"data": compressed_bytes, "mime_type": "image/jpeg"}}
        ],
        config={
            "response_mime_type": "application/json",
            "response_schema": AggregatedBill,
        }
    )

    return response.parsed