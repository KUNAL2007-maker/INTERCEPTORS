import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
import os

PASSWORDS_TO_TRY = ['postgres', 'admin', 'root', '1234', '123456', 'password', 'postgres123']

def get_connection():
    for pwd in PASSWORDS_TO_TRY:
        try:
            conn = psycopg2.connect(
                dbname='postgres',
                user='postgres',
                password=pwd,
                host='localhost',
                port=5432
            )
            print(f"SUCCESS: Connected to PostgreSQL with password: '{pwd}'")
            return conn, pwd
        except Exception as e:
            pass
    return None, None

def setup_database():
    conn, pwd = get_connection()
    if not conn:
        print("ERROR: Could not auto-authenticate with standard passwords.")
        return False, None

    conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    cursor = conn.cursor()

    # 1. Create Database if not exists
    cursor.execute("SELECT 1 FROM pg_catalog.pg_database WHERE datname = 'crypto_attribution'")
    exists = cursor.fetchone()
    if not exists:
        cursor.execute("CREATE DATABASE crypto_attribution")
        print("Created database 'crypto_attribution'")

    cursor.close()
    conn.close()

    # 2. Connect to crypto_attribution and apply schema & seed
    db_conn = psycopg2.connect(
        dbname='crypto_attribution',
        user='postgres',
        password=pwd,
        host='localhost',
        port=5432
    )
    db_cursor = db_conn.cursor()

    base_dir = os.path.dirname(__file__)
    schema_path = os.path.join(base_dir, 'schema.sql')
    seed_path = os.path.join(base_dir, 'seed.sql')

    with open(schema_path, 'r', encoding='utf-8') as f:
        db_cursor.execute(f.read())
    print("Applied db/schema.sql tables DDL successfully!")

    with open(seed_path, 'r', encoding='utf-8') as f:
        db_cursor.execute(f.read())
    print("Applied db/seed.sql seed data successfully!")

    db_conn.commit()
    db_cursor.close()
    db_conn.close()
    return True, pwd

if __name__ == '__main__':
    success, pwd = setup_database()
    if success:
        print(f"PostgreSQL database setup complete! Use PGPASSWORD='{pwd}'")
