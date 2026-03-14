from fastapi import APIRouter, UploadFile, File, HTTPException
# Import your logic from your own file
from services.receipt_ocr import extract_receipt_items, AggregatedBill

router = APIRouter(prefix="/receipts", tags=["receipts"])

@router.post("/upload", response_model=AggregatedBill)
async def upload_receipt(file: UploadFile = File(...)):
    
    if file.content_type not in ["image/jpeg", "image/png", "image/webp"]:
        raise HTTPException(status_code=400, detail="Please upload a valid image.")

    try:
        image_bytes = await file.read()
        # Calling your function from receipts_ocr.py
        return extract_receipt_items(image_bytes)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
