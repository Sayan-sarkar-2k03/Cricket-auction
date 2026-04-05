import sqlite3
import os

def seed_uat():
    db_path = 'd:/antigrsvity/auction-backend/auction.db'
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    print("Cleaning up existing data...")
    cursor.execute("DELETE FROM bids")
    cursor.execute("DELETE FROM players")
    cursor.execute("DELETE FROM teams")
    cursor.execute("DELETE FROM action_logs")
    cursor.execute("DELETE FROM global_settings")
    conn.commit()

    print("Seeding Global Settings...")
    cursor.execute("INSERT INTO global_settings (bid_increments, currency_symbol, min_players, min_base_price) VALUES (?, ?, ?, ?)", 
                   ('[100, 200, 500, 1000, 2000, 5000]', '₹', 11, 500))

    print("Seeding Teams...")
    teams = [
        ("Mumbai Indians", 100000.0, "Akash Ambani", "https://i.pinimg.com/originals/28/09/a8/2809a841bb08828603d2e50ad4dafbba.png"),
        ("Chennai Super Kings", 100000.0, "N. Srinivasan", "https://i.pinimg.com/736x/0f/65/5c/0f655c1ccf6eb7e73f47c352ed08d132.jpg"),
        ("Royal Challengers Bangalore", 100000.0, "Prathmesh Mishra", "https://i.pinimg.com/originals/81/29/77/8129774ba9a92a544c4fa5b3e20ec689.png")
    ]
    
    for name, purse, owner, logo in teams:
        cursor.execute("INSERT INTO teams (name, total_purse, remaining_purse, owner, logo_url, max_players) VALUES (?, ?, ?, ?, ?, ?)",
                       (name, purse, purse, owner, logo, 25))
        team_id = cursor.lastrowid
        # Add Owner as Player (Sold to team, 0 price)
        cursor.execute("INSERT INTO players (name, base_price, sold_price, status, current_team_id, profile, photo_url) VALUES (?, ?, ?, ?, ?, ?, ?)",
                       (owner, 0.0, 0.0, "Sold", team_id, "Owner", "https://via.placeholder.com/150?text=OWNER"))

    print("Seeding Players...")
    # 40 Real IPL Players (approx)
    players_data = [
        # MI
        ("Rohit Sharma", 2000, "Batsman", "https://styles.redditmedia.com/t5_2rq8f/styles/communityIcon_v078p57b3f9b1.png", "https://www.youtube.com/watch?v=dQw4w9WgXcQ"),
        ("Hardik Pandya", 2000, "All-rounder", "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR0Zc2z7Qy_L4z-_y2_y_y_y_y_y_y_y_y&s", ""),
        ("Jasprit Bumrah", 2000, "Bowler", "https://via.placeholder.com/150?text=Bumrah", ""),
        ("Suryakumar Yadav", 1500, "Batsman", "https://via.placeholder.com/150?text=SKY", ""),
        ("Ishan Kishan", 1500, "Wicketkeeper", "https://via.placeholder.com/150?text=Ishan", ""),
        ("Tilak Varma", 500, "Batsman", "https://via.placeholder.com/150?text=Tilak", ""),
        ("Tim David", 1000, "Batsman", "https://via.placeholder.com/150?text=Tim", ""),
        ("Gerald Coetzee", 1000, "Bowler", "https://via.placeholder.com/150?text=Coetzee", ""),
        ("Piyush Chawla", 500, "Bowler", "https://via.placeholder.com/150?text=Chawla", ""),
        ("Mohit Sharma", 500, "Bowler", "https://via.placeholder.com/150?text=Mohit", ""),
        
        # CSK
        ("MS Dhoni", 2000, "Wicketkeeper", "https://via.placeholder.com/150?text=Dhoni", ""),
        ("Ravindra Jadeja", 2000, "All-rounder", "https://via.placeholder.com/150?text=Jadeja", ""),
        ("Ruturaj Gaikwad", 1500, "Batsman", "https://via.placeholder.com/150?text=Ruturaj", ""),
        ("Shivam Dube", 1000, "All-rounder", "https://via.placeholder.com/150?text=Dube", ""),
        ("Matheesha Pathirana", 1000, "Bowler", "https://via.placeholder.com/150?text=Pathirana", ""),
        ("Deepak Chahar", 1000, "Bowler", "https://via.placeholder.com/150?text=Chahar", ""),
        ("Rachin Ravindra", 1000, "All-rounder", "https://via.placeholder.com/150?text=Rachin", ""),
        ("Daryl Mitchell", 1500, "All-rounder", "https://via.placeholder.com/150?text=Daryl", ""),
        ("Sameer Rizvi", 500, "Batsman", "https://via.placeholder.com/150?text=Rizvi", ""),
        ("Shardul Thakur", 1000, "Bowler", "https://via.placeholder.com/150?text=Shardul", ""),
        
        # RCB
        ("Virat Kohli", 2000, "Batsman", "https://via.placeholder.com/150?text=Kohli", "https://www.youtube.com/watch?v=dQw4w9WgXcQ"),
        ("Faf du Plessis", 1500, "Batsman", "https://via.placeholder.com/150?text=Faf", ""),
        ("Glenn Maxwell", 2000, "All-rounder", "https://via.placeholder.com/150?text=Maxwell", ""),
        ("Mohammed Siraj", 1500, "Bowler", "https://via.placeholder.com/150?text=Siraj", ""),
        ("Rajat Patidar", 1000, "Batsman", "https://via.placeholder.com/150?text=Patidar", ""),
        ("Will Jacks", 1000, "All-rounder", "https://via.placeholder.com/150?text=Jacks", ""),
        ("Cameron Green", 1500, "All-rounder", "https://via.placeholder.com/150?text=Green", ""),
        ("Dinesh Karthik", 500, "Wicketkeeper", "https://via.placeholder.com/150?text=DK", ""),
        ("Reece Topley", 1000, "Bowler", "https://via.placeholder.com/150?text=Topley", ""),
        ("Karn Sharma", 500, "Bowler", "https://via.placeholder.com/150?text=Karn", ""),
        
        # More Free Agents
        ("Kane Williamson", 2000, "Batsman", "https://via.placeholder.com/150?text=Kane", ""),
        ("David Warner", 2000, "Batsman", "https://via.placeholder.com/150?text=Warner", ""),
        ("Rashid Khan", 2000, "Bowler", "https://via.placeholder.com/150?text=Rashid", ""),
        ("Pat Cummins", 2010, "Bowler", "https://via.placeholder.com/150?text=Cummins", ""),
        ("Mitchell Starc", 2010, "Bowler", "https://via.placeholder.com/150?text=Starc", ""),
        ("Andre Russell", 1500, "All-rounder", "https://via.placeholder.com/150?text=Russell", ""),
        ("Sunil Narine", 1500, "All-rounder", "https://via.placeholder.com/150?text=Narine", ""),
        ("Quinton de Kock", 1500, "Wicketkeeper", "https://via.placeholder.com/150?text=QDK", ""),
        ("Nicholas Pooran", 1500, "Wicketkeeper", "https://via.placeholder.com/150?text=Pooran", ""),
        ("Trent Boult", 1500, "Bowler", "https://via.placeholder.com/150?text=Boult", ""),
        ("Jos Buttler", 2000, "Wicketkeeper", "https://via.placeholder.com/150?text=Buttler", ""),
    ]

    for name, base, profile, photo, video in players_data:
        cursor.execute("INSERT INTO players (name, base_price, status, profile, photo_url, video_url, current_bid) VALUES (?, ?, ?, ?, ?, ?, ?)",
                       (name, base, "Available", profile, photo, video, 0.0))

    conn.commit()
    conn.close()
    print(f"UAT Seed Complete. Seeded 3 teams and {len(players_data)} players.")

if __name__ == "__main__":
    seed_uat()
