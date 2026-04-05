from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime
from database import get_db
import models
import schemas

router = APIRouter()

@router.post("", response_model=schemas.Bid)
def place_bid(bid: schemas.BidCreate, db: Session = Depends(get_db)):
    # 1. Fetch Global Settings
    settings = db.query(models.GlobalSettings).first()
    if not settings:
        settings = models.GlobalSettings()
        db.add(settings)
        db.commit()
        db.refresh(settings)

    # 2. Verify player exists
    player = db.query(models.Player).filter(models.Player.id == bid.player_id).first()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    
    if player.status == "Sold":
        raise HTTPException(status_code=400, detail="Player already sold")

    # 3. IPL Rule: Bid must be higher than current bid (or >= base price)
    min_required_bid = player.current_bid if player.current_bid > 0 else player.base_price
    if player.current_bid > 0 and bid.amount <= player.current_bid:
        raise HTTPException(status_code=400, detail=f"Bid must be higher than current bid of {player.current_bid}")
    if player.current_bid == 0 and bid.amount < player.base_price:
        raise HTTPException(status_code=400, detail=f"Bid must be at least base price of {player.base_price}")

    # 4. Verify team exists
    team = db.query(models.Team).filter(models.Team.id == bid.team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    # 5. IPL Rule: Cannot bid against yourself
    if player.leading_team_id == team.id:
        raise HTTPException(status_code=400, detail="You are already the leading bidder")

    # 6. Mandatory Purse Reserve Check
    # Formula: Remaining Purse - Bid Amount >= (Min Players - Current Squad Size - 1) * Min Base Price
    current_squad_size = db.query(models.Player).filter(models.Player.current_team_id == team.id).count()
    needed_players = max(0, settings.min_players - (current_squad_size + 1))
    required_reserve = needed_players * settings.min_base_price
    
    if team.remaining_purse - bid.amount < required_reserve:
        raise HTTPException(
            status_code=400, 
            detail=f"Insufficient purse. Must reserve {required_reserve} for remaining {needed_players} players to reach {settings.min_players} squad members."
        )

    # 7. Update Player Bid State
    player.current_bid = bid.amount
    player.leading_team_id = team.id
    player.status = "Auctioning"

    # 8. Record the bid in history
    db_bid = models.Bid(
        amount=bid.amount,
        player_id=bid.player_id,
        team_id=bid.team_id,
        timestamp=datetime.utcnow().isoformat()
    )
    db.add(db_bid)
    db.commit()
    db.refresh(db_bid)

    return db_bid

@router.post("/sell")
def sell_player(player_id: int, team_id: Optional[int] = None, finalize_amount: Optional[float] = None, db: Session = Depends(get_db)):
    # If team_id/amount not provided, use the player's leading bid
    player = db.query(models.Player).filter(models.Player.id == player_id).first()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")

    target_team_id = team_id or player.leading_team_id
    final_price = finalize_amount if finalize_amount is not None else player.current_bid

    if not target_team_id:
        # Mark as Unsold if no bids
        player.status = "Unsold"
        db.commit()
        return {"message": "Player marked as Unsold"}

    team = db.query(models.Team).filter(models.Team.id == target_team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
        
    if player.status == "Sold":
        raise HTTPException(status_code=400, detail="Player already sold")
        
    if team.remaining_purse < final_price:
        raise HTTPException(status_code=400, detail="Insufficient purse to complete purchase")
        
    # Finalize sale
    player.status = "Sold"
    player.sold_price = final_price
    player.current_team_id = team.id
    player.current_bid = final_price # Sync final price
    
    # Deduct purse
    team.remaining_purse -= final_price
    
    db.commit()
    return {"message": f"Player sold to {team.name} for {final_price}"}
