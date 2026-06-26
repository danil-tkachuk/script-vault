import sqlite3
import os
import psycopg2
import psycopg2.extras

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'scripts.db')

def is_postgres():
    return 'DATABASE_URL' in os.environ

def get_db_connection():
    if is_postgres():
        db_url = os.environ.get('DATABASE_URL')
        # Render connection string may use postgres://, which is fully compatible,
        # but replacing it with postgresql:// is a safe best-practice.
        if db_url.startswith('postgres://'):
            db_url = db_url.replace('postgres://', 'postgresql://', 1)
        conn = psycopg2.connect(db_url)
        return conn
    else:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    if is_postgres():
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS scripts (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                content TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
    else:
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS scripts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                content TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
    conn.commit()
    conn.close()

def get_all_scripts():
    conn = get_db_connection()
    if is_postgres():
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cursor.execute('SELECT * FROM scripts ORDER BY created_at DESC')
        rows = cursor.fetchall()
        scripts = [dict(row) for row in rows]
    else:
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM scripts ORDER BY created_at DESC')
        rows = cursor.fetchall()
        scripts = [dict(row) for row in rows]
    conn.close()
    return scripts

def add_script(name, content):
    conn = get_db_connection()
    cursor = conn.cursor()
    if is_postgres():
        cursor.execute('''
            INSERT INTO scripts (name, content)
            VALUES (%s, %s)
            RETURNING id
        ''', (name, content))
        script_id = cursor.fetchone()[0]
    else:
        cursor.execute('''
            INSERT INTO scripts (name, content)
            VALUES (?, ?)
        ''', (name, content))
        script_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return script_id

def update_script(script_id, name, content):
    conn = get_db_connection()
    cursor = conn.cursor()
    if is_postgres():
        cursor.execute('''
            UPDATE scripts
            SET name = ?, content = ?
            WHERE id = ?
        '''.replace('?', '%s'), (name, content, script_id))
    else:
        cursor.execute('''
            UPDATE scripts
            SET name = ?, content = ?
            WHERE id = ?
        ''', (name, content, script_id))
    conn.commit()
    conn.close()

def delete_script(script_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    if is_postgres():
        cursor.execute('DELETE FROM scripts WHERE id = %s', (script_id,))
    else:
        cursor.execute('DELETE FROM scripts WHERE id = ?', (script_id,))
    conn.commit()
    conn.close()
