from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models
import schemas

router = APIRouter()

@router.get("", response_model=schemas.Settings)
def get_settings(db: Session = Depends(get_db)):
    settings = db.query(models.GlobalSettings).first()
    if not settings:
        # Create default
        settings = models.GlobalSettings()
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings

@router.put("", response_model=schemas.Settings)
def update_settings(settings_update: schemas.SettingsCreate, db: Session = Depends(get_db)):
    settings = db.query(models.GlobalSettings).first()
    if not settings:
        settings = models.GlobalSettings(**settings_update.model_dump())
        db.add(settings)
    else:
        for key, value in settings_update.model_dump().items():
            setattr(settings, key, value)
    
    db.commit()
    db.refresh(settings)
    return settings
