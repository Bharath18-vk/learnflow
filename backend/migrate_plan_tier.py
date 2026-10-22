import sqlite3

db_path = r"c:\Users\admin\Desktop\LearnWise\backend\learnwise.db"
conn = sqlite3.connect(db_path)
cur = conn.cursor()

columns = [c[1] for c in cur.execute("PRAGMA table_info('users');").fetchall()]
print(f"Current columns in users: {columns}")

if "plan_tier" not in columns:
    cur.execute("ALTER TABLE users ADD COLUMN plan_tier VARCHAR DEFAULT 'Free Plan';")
    print("Added column 'plan_tier' to users table.")
else:
    print("Column 'plan_tier' already exists in users table.")

# Set Bharath Kumaresan (User 1) to 'Pro Account'
cur.execute("UPDATE users SET plan_tier = 'Pro Account' WHERE id = 1;")
conn.commit()
print("Updated User 1 plan_tier to 'Pro Account'. Migration successful.")

conn.close()
