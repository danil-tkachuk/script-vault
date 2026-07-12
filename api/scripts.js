const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Local storage fallback configuration
const localFilePath = path.join(process.cwd(), 'scripts.json');

function loadLocalData() {
  if (!fs.existsSync(localFilePath)) {
    return [];
  }
  try {
    const raw = fs.readFileSync(localFilePath, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

function saveLocalData(data) {
  fs.writeFileSync(localFilePath, JSON.stringify(data, null, 2), 'utf8');
}

// PostgreSQL pool initialization (Vercel Postgres or custom database URL)
const dbUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;
let pool = null;

if (dbUrl) {
  pool = new Pool({
    connectionString: dbUrl,
    ssl: {
      rejectUnauthorized: false
    }
  });
}

let tableInitialized = false;
async function ensureTable() {
  if (!pool || tableInitialized) return;
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS scripts (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    tableInitialized = true;
  } catch (e) {
    console.error('Failed to initialize database table:', e);
  } finally {
    client.release();
  }
}

module.exports = async (req, res) => {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Ensure database table is created if running in DB mode
  if (pool) {
    await ensureTable();
  }

  const { method } = req;
  const { id } = req.query;

  try {
    switch (method) {
      case 'GET':
        if (pool) {
          const result = await pool.query('SELECT * FROM scripts ORDER BY created_at DESC');
          res.status(200).json(result.rows);
        } else {
          const data = loadLocalData();
          // Sort by creation time (descending)
          data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
          res.status(200).json(data);
        }
        break;

      case 'POST':
        const { name, content } = req.body;
        if (!name || !name.trim()) {
          return res.status(400).json({ error: 'Имя скрипта обязательно' });
        }
        if (!content || !content.trim()) {
          return res.status(400).json({ error: 'Содержимое скрипта обязательно' });
        }

        if (pool) {
          const result = await pool.query(
            'INSERT INTO scripts (name, content) VALUES ($1, $2) RETURNING id, name, content, created_at',
            [name.trim(), content]
          );
          res.status(201).json(result.rows[0]);
        } else {
          const localData = loadLocalData();
          const newScript = {
            id: Date.now(), // Generate numeric ID locally
            name: name.trim(),
            content: content,
            created_at: new Date().toISOString()
          };
          localData.unshift(newScript);
          saveLocalData(localData);
          res.status(201).json(newScript);
        }
        break;

      case 'PUT':
        if (!id) {
          return res.status(400).json({ error: 'ID скрипта обязателен для редактирования' });
        }
        const updateName = req.body.name;
        const updateContent = req.body.content;

        if (!updateName || !updateName.trim()) {
          return res.status(400).json({ error: 'Имя скрипта обязательно' });
        }
        if (!updateContent || !updateContent.trim()) {
          return res.status(400).json({ error: 'Содержимое скрипта обязательно' });
        }

        if (pool) {
          const result = await pool.query(
            'UPDATE scripts SET name = $1, content = $2 WHERE id = $3 RETURNING id, name, content, created_at',
            [updateName.trim(), updateContent, parseInt(id)]
          );
          if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Скрипт не найден' });
          }
          res.status(200).json(result.rows[0]);
        } else {
          const localData = loadLocalData();
          const index = localData.findIndex(s => s.id === parseInt(id));
          if (index === -1) {
            return res.status(404).json({ error: 'Скрипт не найден' });
          }
          localData[index] = {
            ...localData[index],
            name: updateName.trim(),
            content: updateContent,
            updated_at: new Date().toISOString()
          };
          saveLocalData(localData);
          res.status(200).json(localData[index]);
        }
        break;

      case 'DELETE':
        if (!id) {
          return res.status(400).json({ error: 'ID скрипта обязателен для удаления' });
        }

        if (pool) {
          const result = await pool.query('DELETE FROM scripts WHERE id = $1', [parseInt(id)]);
          if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Скрипт не найден' });
          }
          res.status(200).json({ message: 'Скрипт успешно удален' });
        } else {
          const localData = loadLocalData();
          const index = localData.findIndex(s => s.id === parseInt(id));
          if (index === -1) {
            return res.status(404).json({ error: 'Скрипт не найден' });
          }
          localData.splice(index, 1);
          saveLocalData(localData);
          res.status(200).json({ message: 'Скрипт успешно удален' });
        }
        break;

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (error) {
    console.error('Error handling API request:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
