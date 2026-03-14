from datetime import date, datetime, timezone
from typing import Optional

from database import get_db
from deps import get_current_user
from fastapi import APIRouter, Depends, HTTPException
from models import Ingredient, PantryItem, User
from pydantic import BaseModel
from sqlalchemy.orm import Session

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
def get_pantry_items(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    items = (
        db.query(PantryItem)
        .filter(
            PantryItem.user_id == current_user.id,
            PantryItem.deleted_at.is_(None),
        )
        .order_by(PantryItem.expiry_date.asc(), PantryItem.added_at.asc())
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
def create_pantry_items(
    items: list[PantryItemCreate],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    created = []

    for item_data in items:
        # Get or create the ingredient
        ingredient = (
            db.query(Ingredient)
            .filter(Ingredient.name == item_data.ingredient_name)
            .first()
        )
        if not ingredient:
            ingredient = Ingredient(name=item_data.ingredient_name)
            db.add(ingredient)
            db.flush()  # get the ingredient.id without committing yet

        pantry_item = PantryItem(
            ingredient_id=ingredient.id,
            user_id=current_user.id,
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
def update_pantry_item(
    item_id: int,
    updates: PantryItemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = (
        db.query(PantryItem)
        .filter(
            PantryItem.id == item_id,
            PantryItem.user_id == current_user.id,
            PantryItem.deleted_at.is_(None),
        )
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
def delete_pantry_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = (
        db.query(PantryItem)
        .filter(PantryItem.id == item_id, PantryItem.deleted_at.is_(None))
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Pantry item not found")

    item.deleted_at = datetime.now(timezone.utc)
    db.commit()
