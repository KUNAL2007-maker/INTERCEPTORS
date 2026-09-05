import sys
import subprocess

# Check if psycopg2 or pg8000 or asyncpg is installed in python
for pkg in ['psycopg2', 'pg8000', 'psycopg']:
    try:
        __import__(pkg)
        print(f"FOUND_DRIVER:{pkg}")
        break
    except ImportError:
        pass
