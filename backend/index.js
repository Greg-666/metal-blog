import express from 'express';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

dotenv.config();

const app = express();
const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: {
    rejectUnauthorized: false
  }
});

// Configuration Nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
});

// Limite de tentatives de connexion
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { message: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false
});

app.use(cors({
  origin: [
    "http://localhost:4200",
    "https://metal-blog-p3ha4l2ln-greg-666s-projects.vercel.app"
  ],
  methods: ["GET","POST","PUT","PATCH","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization"]
}));

app.options("*", cors());

//app.use(express.json());

//app.options('*', cors());

app.use(express.json());
//app.use(cors());
app.use(express.json());

app.use('/media', express.static('media'));

// =================== AUTH ===================

// Login
app.post('/auth/login', loginLimiter, async (req, res) => {
  const { email, password } = req.body;
  console.log('Login attempt:', email);
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) return res.status(401).json({ message: 'Identifiants incorrects' });
    if (user.status === 'pending') return res.status(403).json({ message: 'Votre compte est en attente de validation' });
    if (user.status === 'rejected') return res.status(403).json({ message: 'Votre compte a été refusé' });

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(401).json({ message: 'Identifiants incorrects' });

    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Register
app.post('/auth/register', async (req, res) => {
  const { email, password, username } = req.body;
  try {
    const existing = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) return res.status(400).json({ message: 'Cet email est déjà utilisé' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (email, password, username, role, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [email, hashedPassword, username, 'member', 'pending']
    );
    const { password: _, ...userWithoutPassword } = result.rows[0];
    res.status(201).json(userWithoutPassword);
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Mot de passe oublié
app.post('/auth/forgot-password', async (req, res) => {
  const { email } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) {
      return res.status(404).json({ message: 'Aucun compte trouvé avec cet email' });
    }

    const tempPassword = crypto.randomBytes(4).toString('hex');
    const hashedTempPassword = await bcrypt.hash(tempPassword, 10);

    await pool.query('UPDATE users SET password = $1 WHERE email = $2', [hashedTempPassword, email]);

    await transporter.sendMail({
      from: `"MetalBlog 🤘" <${process.env.MAIL_USER}>`,
      to: email,
      subject: '🤘 MetalBlog - Mot de passe temporaire',
      html: `
        <div style="background-color:#0a0a0a;color:#ccc;padding:2rem;font-family:Arial,sans-serif;max-width:500px;margin:0 auto;border:1px solid #8b0000;border-radius:8px;">
          <h1 style="color:#cc0000;text-align:center;text-transform:uppercase;letter-spacing:3px;">🤘 MetalBlog</h1>
          <p>Bonjour <strong style="color:#fff">${user.username}</strong>,</p>
          <p>Tu as demandé un mot de passe temporaire. Le voici :</p>
          <div style="background-color:#1a1a1a;border:1px solid #8b0000;border-radius:6px;padding:1rem;text-align:center;margin:1.5rem 0;">
            <span style="color:#cc0000;font-size:1.5rem;font-weight:bold;letter-spacing:3px;">${tempPassword}</span>
          </div>
          <p style="color:#999;">⚠️ Ce mot de passe est valable <strong style="color:#fff">24 heures</strong>.</p>
          <p style="color:#999;">Connecte-toi et change ton mot de passe dès que possible !</p>
          <p style="color:#666;font-size:0.85rem;margin-top:2rem;">Si tu n'as pas fait cette demande, ignore cet email.</p>
        </div>
      `
    });

    res.json({ message: 'Un mot de passe temporaire a été envoyé à ton email !' });
  } catch (err) {
    console.error('Forgot password error:', err.message);
    res.status(500).json({ message: 'Erreur lors de l\'envoi de l\'email' });
  }
});

// =================== USERS ===================

// Get all users
app.get('/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, email, username, role, status FROM users');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Update user
app.patch('/users/:id', async (req, res) => {
  const { id } = req.params;
  const { role, status } = req.body;
  try {
    let query = '';
    let values = [];

    if (role && status) {
      query = 'UPDATE users SET role = $1, status = $2 WHERE id = $3 RETURNING *';
      values = [role, status, id];
    } else if (role) {
      query = 'UPDATE users SET role = $1 WHERE id = $2 RETURNING *';
      values = [role, id];
    } else if (status) {
      query = 'UPDATE users SET status = $1 WHERE id = $2 RETURNING *';
      values = [status, id];
    }

    const result = await pool.query(query, values);
    const { password: _, ...userWithoutPassword } = result.rows[0];
    res.json(userWithoutPassword);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Delete user
app.delete('/users/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM users WHERE id = $1', [id]);
    res.json({ message: 'Utilisateur supprimé' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// =================== ARTICLES ===================

// Get all articles
app.get('/articles', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM articles ORDER BY date DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Erreur articles:', err.message);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Get article by id
app.get('/articles/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM articles WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Article introuvable' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Create article
app.post('/articles', async (req, res) => {
  const { title, category, date, author, summary, content, image, tags, photos, video_url } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO articles (title, category, date, author, summary, content, image, tags, photos, video_url) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *',
      [title, category, date, author, summary, content, image, tags, photos || [], video_url || null]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Erreur create article:', err.message);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Update article
app.put('/articles/:id', async (req, res) => {
  const { id } = req.params;
  const { title, category, date, author, summary, content, image, tags, photos, video_url } = req.body;
  try {
    const result = await pool.query(
      'UPDATE articles SET title=$1, category=$2, date=$3, author=$4, summary=$5, content=$6, image=$7, tags=$8, photos=$9, video_url=$10 WHERE id=$11 RETURNING *',
      [title, category, date, author, summary, content, image, tags, photos || [], video_url || null, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Erreur update article:', err.message);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Delete article
app.delete('/articles/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM articles WHERE id = $1', [id]);
    res.json({ message: 'Article supprimé' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// =================== COMMENTS ===================

// Get comments by article
app.get('/comments', async (req, res) => {
  const { articleId } = req.query;
  try {
    const result = await pool.query(
      'SELECT * FROM comments WHERE article_id = $1 ORDER BY date ASC',
      [articleId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Add comment
app.post('/comments', async (req, res) => {
  const { articleId, content, author } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO comments (article_id, content, author, date) VALUES ($1, $2, $3, $4) RETURNING *',
      [articleId, content, author, new Date().toISOString()]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Delete comment
app.delete('/comments/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM comments WHERE id = $1', [id]);
    res.json({ message: 'Commentaire supprimé' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend MetalBlog sur http://localhost:${PORT}`);
});
