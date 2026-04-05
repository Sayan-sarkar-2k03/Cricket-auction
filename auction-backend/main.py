from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
import models
import routers.teams
import routers.players
import routers.settings
import routers.bids
import routers.dashboard
import routers.logs

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Auction App API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(routers.teams.router, prefix="/api/teams", tags=["teams"])
app.include_router(routers.players.router, prefix="/api/players", tags=["players"])
app.include_router(routers.settings.router, prefix="/api/settings", tags=["settings"])
app.include_router(routers.bids.router, prefix="/api/bids", tags=["bids"])
app.include_router(routers.dashboard.router, prefix="/api/dashboard", tags=["dashboard"])
app.include_router(routers.logs.router, prefix="/api/logs", tags=["logs"])

@app.get("/")
def read_root():
    return {"message": "Welcome to the Auction App API"}
