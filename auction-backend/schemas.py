from pydantic import BaseModel
from typing import List, Optional

# Settings Schemas
class SettingsBase(BaseModel):
    bid_increments: List[int]
    currency_symbol: str
    min_players: int
    min_base_price: float

class SettingsCreate(SettingsBase):
    pass

class Settings(SettingsBase):
    id: int
    class Config:
        from_attributes = True

# Team Schemas
class TeamBase(BaseModel):
    name: str
    total_purse: float
    max_players: int
    logo_url: Optional[str] = None
    owner: Optional[str] = None

class TeamCreate(TeamBase):
    pass

class TeamUpdate(BaseModel):
    name: Optional[str] = None
    total_purse: Optional[float] = None
    remaining_purse: Optional[float] = None
    max_players: Optional[int] = None
    logo_url: Optional[str] = None
    owner: Optional[str] = None

class Team(TeamBase):
    id: int
    remaining_purse: float
    player_count: Optional[int] = 0
    class Config:
        from_attributes = True

# Player Schemas
class PlayerBase(BaseModel):
    name: str
    base_price: float
    gender: Optional[str] = None
    profile: Optional[str] = None
    previous_score: Optional[str] = None
    video_url: Optional[str] = None
    photo_url: Optional[str] = None

class PlayerCreate(PlayerBase):
    pass

class PlayerUpdate(BaseModel):
    name: Optional[str] = None
    base_price: Optional[float] = None
    sold_price: Optional[float] = None
    gender: Optional[str] = None
    profile: Optional[str] = None
    previous_score: Optional[str] = None
    video_url: Optional[str] = None
    photo_url: Optional[str] = None
    status: Optional[str] = None
    current_team_id: Optional[int] = None
    is_captain: Optional[int] = None # 0 or 1
    batting_order: Optional[int] = None

class Player(PlayerBase):
    id: int
    sold_price: Optional[float] = None
    status: str
    current_bid: float
    leading_team_id: Optional[int] = None
    current_team_id: Optional[int] = None
    is_captain: int = 0
    batting_order: Optional[int] = None
    class Config:
        from_attributes = True

# Bid Schemas
class BidBase(BaseModel):
    amount: float
    player_id: int
    team_id: int

class BidCreate(BidBase):
    pass

class Bid(BidBase):
    id: int
    timestamp: str
    class Config:
        from_attributes = True

class DashboardData(BaseModel):
    total_players: int
    sold_players: int
    unsold_players: int
    teams: List[Team]

# Action Log Schemas
class ActionLogBase(BaseModel):
    action_type: str
    description: str

class ActionLogCreate(ActionLogBase):
    pass

class ActionLog(ActionLogBase):
    id: int
    timestamp: str
    class Config:
        from_attributes = True
