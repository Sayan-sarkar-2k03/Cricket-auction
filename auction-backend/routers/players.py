from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
import pandas as pd
import io
from database import get_db
import models
import schemas

router = APIRouter()

@router.get("", response_model=List[schemas.Player])
def read_players(skip: int = 0, limit: int = 1000, db: Session = Depends(get_db)):
    players = db.query(models.Player).offset(skip).limit(limit).all()
    return players

@router.post("", response_model=schemas.Player)
def create_player(player: schemas.PlayerCreate, db: Session = Depends(get_db)):
    db_player = models.Player(**player.model_dump())
    db.add(db_player)
    db.commit()
    db.refresh(db_player)
    return db_player

@router.put("/{player_id}", response_model=schemas.Player)
def update_player(player_id: int, player_update: schemas.PlayerUpdate, db: Session = Depends(get_db)):
    db_player = db.query(models.Player).filter(models.Player.id == player_id).first()
    if db_player is None:
        raise HTTPException(status_code=404, detail="Player not found")
    
    update_data = player_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_player, key, value)
    
    db.commit()
    db.refresh(db_player)
    return db_player

@router.delete("/{player_id}")
def delete_player(player_id: int, db: Session = Depends(get_db)):
    db_player = db.query(models.Player).filter(models.Player.id == player_id).first()
    if db_player is None:
        raise HTTPException(status_code=404, detail="Player not found")
    db.delete(db_player)
    db.commit()
    return {"message": "Player deleted successfully"}

@router.post("/upload-csv")
async def upload_players_csv(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload a CSV.")
    
    try:
        contents = await file.read()
        df = pd.read_csv(io.StringIO(contents.decode('utf-8')))
        
        # Clean up column names
        df.columns = df.columns.str.strip().str.lower()
        
        # Define a mapping for flexible column names
        column_mapping = {
            'name': ['name', 'player name', 'player', 'full name'],
            'base_price': ['base_price', 'base price', 'base', 'price', 'starting price'],
            'gender': ['gender', 'sex'],
            'profile': ['profile', 'role', 'position', 'type'],
            'previous_score': ['previous_score', 'previous score', 'stats', 'last score'],
            'video_url': ['video_url', 'video url', 'video', 'intro video'],
            'photo_url': ['photo_url', 'photo url', 'photo', 'image', 'image url']
        }
        
        # Helper to find column index from flexible names
        def find_col(possible_names):
            for name in possible_names:
                if name in df.columns:
                    return name
            return None

        name_col = find_col(column_mapping['name'])
        price_col = find_col(column_mapping['base_price'])
        
        if not name_col or not price_col:
            raise HTTPException(status_code=400, detail=f"CSV must contain Name and Base Price columns. Found: {list(df.columns)}")
        
        gender_col = find_col(column_mapping['gender'])
        profile_col = find_col(column_mapping['profile'])
        score_col = find_col(column_mapping['previous_score'])
        video_col = find_col(column_mapping['video_url'])
        photo_col = find_col(column_mapping['photo_url'])

        added_count = 0
        for _, row in df.iterrows():
            if pd.isna(row.get(name_col)) or pd.isna(row.get(price_col)):
                continue 
            
            try:
                # Get values safely
                p_name = str(row[name_col]).strip()
                try:
                    p_price = float(row[price_col])
                except (ValueError, TypeError):
                    continue # Skip if price is not a number

                new_player = models.Player(
                    name=p_name,
                    base_price=p_price,
                    gender=str(row[gender_col]).strip() if gender_col and not pd.isna(row[gender_col]) else "Male",
                    profile=str(row[profile_col]).strip() if profile_col and not pd.isna(row[profile_col]) else "Batsman",
                    previous_score=str(row[score_col]).strip() if score_col and not pd.isna(row[score_col]) else None,
                    video_url=str(row[video_col]).strip() if video_col and not pd.isna(row[video_col]) else None,
                    photo_url=str(row[photo_col]).strip() if photo_col and not pd.isna(row[photo_col]) else None,
                    status="Available"
                )
                db.add(new_player)
                added_count += 1
            except Exception as e:
                print(f"Error skipping row: {e}")
                continue
            
        db.commit()
        return {"message": f"Successfully added {added_count} players from CSV."}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{player_id}/set-captain")
def set_captain(player_id: int, db: Session = Depends(get_db)):
    player = db.query(models.Player).filter(models.Player.id == player_id).first()
    if not player or not player.current_team_id:
        raise HTTPException(status_code=404, detail="Player not found in any team")
    
    # Unset other captains in the same team
    db.query(models.Player).filter(
        models.Player.current_team_id == player.current_team_id,
        models.Player.is_captain == 1
    ).update({models.Player.is_captain: 0})
    
    player.is_captain = 1
    db.commit()
    return {"message": f"{player.name} is now the captain."}

@router.post("/reorder-batting")
def reorder_batting(orders: List[dict], db: Session = Depends(get_db)):
    # orders is a list of {"player_id": int, "index": int}
    for item in orders:
        player = db.query(models.Player).filter(models.Player.id == item["player_id"]).first()
        if player:
            player.batting_order = item["index"]
    db.commit()
    return {"message": "Batting order updated."}
