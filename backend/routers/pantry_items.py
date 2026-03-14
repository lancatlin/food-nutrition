from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime, date, timezone
from typing import Optional
from database import get_db
from models import PantryItem, Ingredient
import re

router = APIRouter(prefix="/pantry", tags=["pantry"])


# Schemas

class PantryItemCreate(BaseModel):
    ingredient_name: str
    expiry_date: Optional[date] = None


class PantryItemUpdate(BaseModel):
    expiry_date: Optional[date] = None


class PantryItemResponse(BaseModel):
    id: int
    ingredient_name: str
    expiry_date: Optional[date]
    added_at: datetime

    class Config:
        from_attributes = True


# GET /pantry-items 

@router.get("/pantry-items", response_model=list[PantryItemResponse])
def get_pantry_items(db: Session = Depends(get_db)):
    items = (
        db.query(PantryItem)
        .filter(PantryItem.deleted_at.is_(None))
        .all()
    )
    return [
        PantryItemResponse(
            id=item.id,
            ingredient_name=item.ingredient.name,
            expiry_date=item.expiry_date,
            added_at=item.added_at,
        )
        for item in items
    ]


# POST /pantry-items

@router.post("/pantry-items", response_model=list[PantryItemResponse], status_code=201)
def create_pantry_items(items: list[PantryItemCreate], db: Session = Depends(get_db)):
    created = []

    for item_data in items:
        clean_name = re.sub(r"\s+", " ", item_data.ingredient_name.strip().lower())

        ingredient = (
            db.query(Ingredient)
            .filter(Ingredient.name == clean_name)
            .first()
        )
        if not ingredient:
            ingredient = Ingredient(name=clean_name)
            db.add(ingredient)
            db.flush()

        pantry_item = PantryItem(
            ingredient_id=ingredient.id,
            expiry_date=item_data.expiry_date,
            added_at=datetime.now(timezone.utc),
        )
        db.add(pantry_item)
        db.flush()

        created.append(
            PantryItemResponse(
                id=pantry_item.id,
                ingredient_name=ingredient.name,
                expiry_date=pantry_item.expiry_date,
                added_at=pantry_item.added_at,
            )
        )

    db.commit()
    return created


# PUT /pantry-items/{id}

@router.put("/pantry-items/{item_id}", response_model=PantryItemResponse)
def update_pantry_item(item_id: int, updates: PantryItemUpdate, db: Session = Depends(get_db)):
    item = (
        db.query(PantryItem)
        .filter(PantryItem.id == item_id, PantryItem.deleted_at.is_(None))
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Pantry item not found")

    if updates.expiry_date is not None:
        item.expiry_date = updates.expiry_date

    item.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(item)

    return PantryItemResponse(
        id=item.id,
        ingredient_name=item.ingredient.name,
        expiry_date=item.expiry_date,
        added_at=item.added_at,
    )


# DELETE /pantry-items/{id}

@router.delete("/pantry-items/{item_id}", status_code=204)
def delete_pantry_item(item_id: int, db: Session = Depends(get_db)):
    item = (
        db.query(PantryItem)
        .filter(PantryItem.id == item_id, PantryItem.deleted_at.is_(None))
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Pantry item not found")

    item.deleted_at = datetime.now(timezone.utc)
    db.commit()