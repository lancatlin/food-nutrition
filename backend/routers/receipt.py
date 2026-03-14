from fastapi import APIRouter

router = APIRouter(prefix="/receipts", tags=["receipts"])

#Schemas

class ReceiveReceipt(BaseModel):
    pass