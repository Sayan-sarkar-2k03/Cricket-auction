from sqlalchemy import Column, Integer, String, Float, ForeignKey, JSON
from sqlalchemy.orm import relationship
from database import Base

class GlobalSettings(Base):
    __tablename__ = "global_settings"

    id = Column(Integer, primary_key=True, index=True)
    bid_increments = Column(JSON, default=[5, 10, 15, 20, 50])
    currency_symbol = Column(String, default="$")
    min_players = Column(Integer, default=11)
    min_base_price = Column(Float, default=5.0)
    
class Team(Base):
    __tablename__ = "teams"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    total_purse = Column(Float, default=0.0)
    remaining_purse = Column(Float, default=0.0)
    max_players = Column(Integer, default=15)
    logo_url = Column(String, nullable=True)
    owner = Column(String, nullable=True)

    players = relationship("Player", back_populates="team", foreign_keys="[Player.current_team_id]")
    bids = relationship("Bid", back_populates="team")

class Player(Base):
    __tablename__ = "players"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    base_price = Column(Float, default=0.0)
    sold_price = Column(Float, nullable=True)
    gender = Column(String, nullable=True)
    profile = Column(String, nullable=True)  # batsman, bowler, etc.
    previous_score = Column(String, nullable=True)
    video_url = Column(String, nullable=True)
    photo_url = Column(String, nullable=True)
    status = Column(String, default="Available")  # Available, Sold, Unsold, Auctioning
    current_bid = Column(Float, default=0.0)
    leading_team_id = Column(Integer, ForeignKey("teams.id"), nullable=True)
    is_captain = Column(Integer, default=0) # 0 for False, 1 for True (SQLite)
    batting_order = Column(Integer, nullable=True)

    current_team_id = Column(Integer, ForeignKey("teams.id"), nullable=True)

    team = relationship("Team", back_populates="players", foreign_keys=[current_team_id])
    bids = relationship("Bid", back_populates="player")

class Bid(Base):
    __tablename__ = "bids"

    id = Column(Integer, primary_key=True, index=True)
    amount = Column(Float)
    timestamp = Column(String)  # We can use ISO format strings for simplicity

    player_id = Column(Integer, ForeignKey("players.id"))
    team_id = Column(Integer, ForeignKey("teams.id"))

    player = relationship("Player", back_populates="bids")
    team = relationship("Team", back_populates="bids")

class ActionLog(Base):
    __tablename__ = "action_logs"

    id = Column(Integer, primary_key=True, index=True)
    action_type = Column(String, index=True)
    description = Column(String)
    timestamp = Column(String)
