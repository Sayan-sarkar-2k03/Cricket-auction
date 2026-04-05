import sqlite3
import unittest

class TestUATLogic(unittest.TestCase):
    def setUp(self):
        self.db_path = 'd:/antigrsvity/auction-backend/auction.db'
        self.conn = sqlite3.connect(self.db_path)
        self.cursor = self.conn.cursor()

    def tearDown(self):
        self.conn.close()

    def test_owner_inclusion(self):
        # Verify that each team has an owner player
        self.cursor.execute("SELECT id, name, owner FROM teams")
        teams = self.cursor.fetchall()
        for t_id, t_name, t_owner in teams:
            self.cursor.execute("SELECT id FROM players WHERE current_team_id = ? AND name = ?", (t_id, t_owner))
            owner_player = self.cursor.fetchone()
            self.assertIsNotNone(owner_player, f"Team {t_name} is missing its owner {t_owner} in the squad.")

    def test_purse_reserve_logic(self):
        # Verify global settings
        self.cursor.execute("SELECT min_players, min_base_price FROM global_settings LIMIT 1")
        settings = self.cursor.fetchone()
        self.assertEqual(settings[0], 11, "Min players should be 11")
        self.assertEqual(settings[1], 500.0, "Min base price should be 500")

        # Verify a team's capacity
        self.cursor.execute("SELECT id, remaining_purse FROM teams WHERE name = 'Mumbai Indians'")
        team = self.cursor.fetchone()
        team_id, purse = team
        
        # Count players
        self.cursor.execute("SELECT COUNT(*) FROM players WHERE current_team_id = ?", (team_id,))
        count = self.cursor.fetchone()[0]
        
        # Calculation: needed_later = max(0, 11 - count - 1)
        needed_later = max(0, 11 - count - 1)
        reserve_needed = needed_later * 500.0
        
        print(f"Team MI: Purse={purse}, Players={count}, Reserve Needed (for next bid)={reserve_needed}")
        self.assertGreaterEqual(purse, reserve_needed, "Team should have enough for the reserve.")

if __name__ == '__main__':
    unittest.main()
