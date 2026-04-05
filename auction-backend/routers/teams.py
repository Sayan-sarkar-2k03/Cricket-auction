from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Response
from sqlalchemy.orm import Session
from typing import List
import pandas as pd
import io
from database import get_db
import models
import schemas

router = APIRouter()

@router.get("", response_model=List[schemas.Team])
def read_teams(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    teams = db.query(models.Team).offset(skip).limit(limit).all()
    for team in teams:
        team.player_count = db.query(models.Player).filter(models.Player.current_team_id == team.id).count()
    return teams

@router.post("", response_model=schemas.Team)
def create_team(team: schemas.TeamCreate, db: Session = Depends(get_db)):
    db_team = models.Team(
        **team.model_dump(),
        remaining_purse=team.total_purse
    )
    db.add(db_team)
    try:
        db.commit()
        db.refresh(db_team)
        
        # Add owner as a Player in the squad
        owner_name = team.owner or f"{team.name} Owner"
        db_owner = models.Player(
            name=owner_name,
            base_price=0.0,
            sold_price=0.0,
            status="Sold",
            current_team_id=db_team.id,
            profile="Owner/Captain"
        )
        db.add(db_owner)
        db.commit()
        
        return db_team
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Team creation failed: {str(e)}")

@router.put("/{team_id}", response_model=schemas.Team)
def update_team(team_id: int, team_update: schemas.TeamUpdate, db: Session = Depends(get_db)):
    db_team = db.query(models.Team).filter(models.Team.id == team_id).first()
    if db_team is None:
        raise HTTPException(status_code=404, detail="Team not found")
    
    update_data = team_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_team, key, value)
    
    db.commit()
    db.refresh(db_team)
    return db_team

@router.delete("/{team_id}")
def delete_team(team_id: int, db: Session = Depends(get_db)):
    db_team = db.query(models.Team).filter(models.Team.id == team_id).first()
    if db_team is None:
        raise HTTPException(status_code=404, detail="Team not found")
    
    # Optional: ensure team has no active bids or sold players before deletion
    players = db.query(models.Player).filter(models.Player.current_team_id == team_id).all()
    if players:
        raise HTTPException(status_code=400, detail="Cannot delete team. Players are still assigned to it.")

    db.delete(db_team)
    db.commit()
    return {"message": "Team deleted successfully"}

@router.post("/upload-csv")
async def upload_teams_csv(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload a CSV.")
    
    try:
        contents = await file.read()
        df = pd.read_csv(io.StringIO(contents.decode('utf-8')))
        
        # Clean up column names
        df.columns = df.columns.str.strip().str.lower()
        
        # Define a mapping for flexible column names
        column_mapping = {
            'name': ['name', 'team name', 'franchise', 'team'],
            'total_purse': ['total_purse', 'total purse', 'purse', 'budget'],
            'logo_url': ['logo_url', 'logo url', 'logo', 'image'],
            'max_players': ['max_players', 'max players', 'squad size', 'limit'],
            'owner': ['owner', 'team owner', 'boss', 'proprietor']
        }
        
        # Helper to find column index from flexible names
        def find_col(possible_names):
            for name in possible_names:
                if name in df.columns:
                    return name
            return None

        name_col = find_col(column_mapping['name'])
        purse_col = find_col(column_mapping['total_purse'])
        
        if not name_col or not purse_col:
            raise HTTPException(status_code=400, detail=f"CSV must contain Team Name and Total Purse columns. Found: {list(df.columns)}")
        
        logo_col = find_col(column_mapping['logo_url'])
        max_players_col = find_col(column_mapping['max_players'])
        owner_col = find_col(column_mapping['owner'])

        added_count = 0
        for _, row in df.iterrows():
            if pd.isna(row.get(name_col)) or pd.isna(row.get(purse_col)):
                continue 
            
            team_name = str(row[name_col]).strip()
            # Check if team already exists
            existing = db.query(models.Team).filter(models.Team.name == team_name).first()
            if existing:
                continue
                
            try:
                purse_val = float(row[purse_col])
                new_team = models.Team(
                    name=team_name,
                    total_purse=purse_val,
                    remaining_purse=purse_val,
                    logo_url=str(row[logo_col]).strip() if logo_col and not pd.isna(row[logo_col]) else None,
                    max_players=int(row[max_players_col]) if max_players_col and not pd.isna(row[max_players_col]) else 15,
                    owner=str(row[owner_col]).strip() if owner_col and not pd.isna(row[owner_col]) else None
                )
                db.add(new_team)
                added_count += 1
            except Exception as e:
                print(f"Error skipping team row: {e}")
                continue
            
        db.commit()
        
        # Also ensure owners are added as players for newly uploaded teams
        all_teams = db.query(models.Team).all()
        for t in all_teams:
            existing_owner_player = db.query(models.Player).filter(
                models.Player.current_team_id == t.id,
                models.Player.name == (t.owner or f"{t.name} Owner")
            ).first()
            if not existing_owner_player:
                db_owner = models.Player(
                    name=t.owner or f"{t.name} Owner",
                    base_price=0.0,
                    sold_price=0.0,
                    status="Sold",
                    current_team_id=t.id,
                    profile="Owner"
                )
                db.add(db_owner)
        db.commit()
        return {"message": f"Successfully added {added_count} teams from CSV."}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{team_id}/export-csv")
def export_team_csv(team_id: int, db: Session = Depends(get_db)):
    team = db.query(models.Team).filter(models.Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
        
    players = db.query(models.Player).filter(models.Player.current_team_id == team_id).all()
    
    # Create CSV content
    if players:
        # Create a list of dictionaries for each player
        player_data = [
            {
                "name": p.name,
                "sold_price": p.sold_price,
                "profile": p.profile,
                "status": p.status
            } for p in players
        ]
        df = pd.DataFrame(player_data)
        csv_data = df.to_csv(index=False)
    else:
        # Empty CSV with headers
        csv_data = "name,sold_price,profile,status\n"
        
    return Response(content=csv_data, media_type="text/csv", headers={"Content-Disposition": f"attachment; filename=team_{team.name}_squad.csv"})

@router.get("/{team_id}/export-excel")
def export_team_excel(team_id: int, db: Session = Depends(get_db)):
    team = db.query(models.Team).filter(models.Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
        
    players = db.query(models.Player).filter(models.Player.current_team_id == team_id).order_by(models.Player.batting_order).all()
    
    player_data = [
        {
            "Batting Order": p.batting_order if p.batting_order else "N/A",
            "Name": f"{p.name} (C)" if p.is_captain else p.name,
            "Role": p.profile,
            "Price": p.sold_price,
            "Status": p.status
        } for p in players
    ]
    
    df = pd.DataFrame(player_data)
    
    # Write to a buffer
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name='Squad')
    
    output.seek(0)
    
    return Response(
        content=output.getvalue(),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename=team_{team.name}_squad.xlsx"}
    )
