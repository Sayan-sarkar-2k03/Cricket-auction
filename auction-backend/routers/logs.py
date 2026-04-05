from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from database import get_db
import models
import schemas
from datetime import datetime

router = APIRouter()

@router.post("", response_model=schemas.ActionLog)
def create_log(log: schemas.ActionLogCreate, db: Session = Depends(get_db)):
    db_log = models.ActionLog(
        action_type=log.action_type,
        description=log.description,
        timestamp=datetime.utcnow().isoformat()
    )
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    return db_log

@router.get("", response_model=List[schemas.ActionLog])
def read_logs(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    logs = db.query(models.ActionLog).order_by(models.ActionLog.id.desc()).offset(skip).limit(limit).all()
    return logs
