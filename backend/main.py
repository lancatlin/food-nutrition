import asyncio
from contextlib import asynccontextmanager

from database import Base, engine
from fastapi import FastAPI
from routers import pantry_items, receipt, recipes
from pantry_items import router as pantry_router
app.include_router(pantry_router)

@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(title="Food Nutrition App", lifespan=lifespan)


app.include_router(recipes.router)
app.include_router(receipt.router)
app.include_router(pantry_items.router)
