from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
import models
import schemas

router = APIRouter()

@router.get("", response_model=schemas.DashboardData)
def get_dashboard_data(db: Session = Depends(get_db)):
    total_players = db.query(models.Player).count()
    sold_players = db.query(models.Player).filter(models.Player.status == "Sold").count()
    unsold_players = total_players - sold_players
    
    teams = db.query(models.Team).all()
    
    return schemas.DashboardData(
        total_players=total_players,
        sold_players=sold_players,
        unsold_players=unsold_players,
        teams=teams
    )
