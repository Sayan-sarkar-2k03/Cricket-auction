import sqlite3

def migrate():
    conn = sqlite3.connect('d:/antigrsvity/auction-backend/auction.db')
    cursor = conn.cursor()
    
    try:
        cursor.execute("ALTER TABLE players ADD COLUMN photo_url VARCHAR")
    except sqlite3.OperationalError:
        pass  # Already exists

    try:
        cursor.execute("ALTER TABLE players ADD COLUMN current_bid FLOAT DEFAULT 0.0")
        cursor.execute("ALTER TABLE players ADD COLUMN leading_team_id INTEGER")
    except sqlite3.OperationalError as e:
        print(f"Migration error for players: {e}")

    try:
        cursor.execute("ALTER TABLE global_settings ADD COLUMN min_players INTEGER DEFAULT 11")
        cursor.execute("ALTER TABLE global_settings ADD COLUMN min_base_price FLOAT DEFAULT 5.0")
    except sqlite3.OperationalError:
        pass

    try:
        cursor.execute("ALTER TABLE players ADD COLUMN is_captain INTEGER DEFAULT 0")
        cursor.execute("ALTER TABLE players ADD COLUMN batting_order INTEGER")
    except sqlite3.OperationalError as e:
        print(f"Migration error for players (captain/batting): {e}")
    
    conn.commit()
    conn.close()
    print("Migration complete.")

if __name__ == "__main__":
    migrate()
