import express from "express";
import pg from "pg";
import bcrypt from "bcryptjs";
import cors from "cors";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import nodemailer from "nodemailer";
import crypto from "crypto";

dotenv.config();

const app = express();
const { Pool } = pg;

/* ================= DATABASE ================= */

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: { rejectUnauthorized: false }
});

/* ================= MIDDLEWARE ================= */

// CORS compatible Vercel + localhost
app.use(cors({
  origin: true,
  methods: ["GET","POST","PUT","PATCH","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization"]
}));

app.options("*", cors());

app.use(express.json());

/* ================= RATE LIMIT ================= */

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { message: "Trop de tentatives. Réessayez dans 15 minutes." }
});

/* ================= MAIL ================= */

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
});

/* ================= AUTH ================= */

// LOGIN
app.post("/auth/login", loginLimiter, async (req,res)=>{
  const {email,password} = req.body;

  try{

    const result = await pool.query(
      "SELECT * FROM users WHERE email=$1",[email]
    );

    const user = result.rows[0];

    if(!user)
      return res.status(401).json({message:"Identifiants incorrects"});

    const valid = await bcrypt.compare(password,user.password);

    if(!valid)
      return res.status(401).json({message:"Identifiants incorrects"});

    const {password:_,...safeUser}=user;

    res.json(safeUser);

  }catch(err){
    console.error(err);
    res.status(500).json({message:"Erreur serveur"});
  }
});

// REGISTER
app.post("/auth/register", async (req,res)=>{

  const {email,password,username}=req.body;

  try{

    const existing = await pool.query(
      "SELECT * FROM users WHERE email=$1",[email]
    );

    if(existing.rows.length>0)
      return res.status(400).json({message:"Email déjà utilisé"});

    const hashed = await bcrypt.hash(password,10);

    const result = await pool.query(
      `INSERT INTO users (email,password,username,role,status)
       VALUES ($1,$2,$3,$4,$5)
       RETURNING *`,
      [email,hashed,username,"member","pending"]
    );

    const {password:_,...safeUser}=result.rows[0];

    res.status(201).json(safeUser);

  }catch(err){
    console.error(err);
    res.status(500).json({message:"Erreur serveur"});
  }
});

/* ================= ARTICLES ================= */

app.get("/articles", async(req,res)=>{
  try{

    const result = await pool.query(
      "SELECT * FROM articles ORDER BY date DESC"
    );

    res.json(result.rows);

  }catch(err){
    console.error(err);
    res.status(500).json({message:"Erreur serveur"});
  }
});

app.get("/articles/:id", async(req,res)=>{

  try{

    const result = await pool.query(
      "SELECT * FROM articles WHERE id=$1",
      [req.params.id]
    );

    if(result.rows.length===0)
      return res.status(404).json({message:"Article introuvable"});

    res.json(result.rows[0]);

  }catch(err){
    res.status(500).json({message:"Erreur serveur"});
  }
});

app.post("/articles", async(req,res)=>{

  const {title,category,date,author,summary,content,image,tags,photos,video_url} = req.body;

  try{

    const result = await pool.query(
      `INSERT INTO articles
      (title,category,date,author,summary,content,image,tags,photos,video_url)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING *`,
      [title,category,date,author,summary,content,image,tags,photos||[],video_url||null]
    );

    res.json(result.rows[0]);

  }catch(err){
    console.error(err);
    res.status(500).json({message:"Erreur serveur"});
  }
});

/* ================= COMMENTS ================= */

app.get("/comments", async(req,res)=>{

  const {articleId}=req.query;

  try{

    const result = await pool.query(
      "SELECT * FROM comments WHERE article_id=$1 ORDER BY date ASC",
      [articleId]
    );

    res.json(result.rows);

  }catch(err){
    res.status(500).json({message:"Erreur serveur"});
  }
});

app.post("/comments", async(req,res)=>{

  const {articleId,content,author}=req.body;

  try{

    const result = await pool.query(
      `INSERT INTO comments (article_id,content,author,date)
       VALUES ($1,$2,$3,$4)
       RETURNING *`,
      [articleId,content,author,new Date().toISOString()]
    );

    res.json(result.rows[0]);

  }catch(err){
    res.status(500).json({message:"Erreur serveur"});
  }
});

/* ================= SERVER ================= */

const PORT = process.env.PORT || 3000;

app.listen(PORT,()=>{
  console.log(`MetalBlog backend running on port ${PORT}`);
});
