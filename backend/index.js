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
  ssl: process.env.DB_HOST.includes('neon.tech') ? { rejectUnauthorized: false } : false
});

/* ================= MIDDLEWARE ================= */

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
  message: { message: "Trop de tentatives de connexion. Réessayez dans 15 minutes." }
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
  const {email,password}=req.body;
  try{
    const result = await pool.query("SELECT * FROM users WHERE email=$1",[email]);
    const user=result.rows[0];
    if(!user) return res.status(401).json({message:"Identifiants incorrects"});
    if(user.status==="pending") return res.status(403).json({message:"Compte en attente de validation"});
    if(user.status==="rejected") return res.status(403).json({message:"Compte refusé"});
    const valid=await bcrypt.compare(password,user.password);
    if(!valid) return res.status(401).json({message:"Identifiants incorrects"});
    const {password:_,...safeUser}=user;
    res.json(safeUser);
  }catch(err){
    console.error(err);
    res.status(500).json({message:"Erreur serveur"});
  }
});

// REGISTER
app.post('/auth/register', async (req, res) => {
  const { email, password, username, country } = req.body;
  try {
    const existing = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) return res.status(400).json({ message: 'Cet email est déjà utilisé' });
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (email, password, username, role, status, country) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [email, hashedPassword, username, 'member', 'pending', country || null]
    );
    const { password: _, ...userWithoutPassword } = result.rows[0];
    res.status(201).json(userWithoutPassword);
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// FORGOT PASSWORD
app.post("/auth/forgot-password", async (req,res)=>{
  const {email}=req.body;
  try{
    const result=await pool.query("SELECT * FROM users WHERE email=$1",[email]);
    const user=result.rows[0];
    if(!user) return res.status(404).json({message:"Aucun compte trouvé"});
    const tempPassword=crypto.randomBytes(4).toString("hex");
    const hashed=await bcrypt.hash(tempPassword,10);
    await pool.query("UPDATE users SET password=$1 WHERE email=$2",[hashed,email]);
    await transporter.sendMail({
      from:`MetalBlog <${process.env.MAIL_USER}>`,
      to:email,
      subject:"Mot de passe temporaire",
      html:`Ton mot de passe temporaire : <b>${tempPassword}</b>`
    });
    res.json({message:"Mot de passe temporaire envoyé"});
  }catch(err){
    console.error(err);
    res.status(500).json({message:"Erreur serveur"});
  }
});

/* ================= USERS ================= */

// GET ALL USERS
app.get("/users", async(req,res)=>{
  try{
    const result=await pool.query("SELECT id,email,username,role,status,country FROM users");
    res.json(result.rows);
  }catch(err){
    res.status(500).json({message:"Erreur serveur"});
  }
});

// GET ONE USER
app.get('/users/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT id, email, username, role, status, country FROM users WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Utilisateur non trouvé' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// UPDATE USER (admin: role + status)
app.patch("/users/:id", async(req,res)=>{
  const {id}=req.params;
  const {role,status}=req.body;
  try{
    // D'abord récupérer le role actuel
    const current = await pool.query('SELECT role FROM users WHERE id=$1', [id]);
    const currentRole = current.rows[0]?.role || 'member';
    const newRole = role || currentRole;

    const result=await pool.query(
      `UPDATE users SET role=$1, status=$2 WHERE id=$3
       RETURNING id,email,username,role,status`,
      [newRole, status, id]
    );
    res.json(result.rows[0]);
  }catch(err){
    console.error('PATCH error:', err);
    res.status(500).json({message:"Erreur serveur"});
  }
});

// UPDATE USER PROFILE (username, country, password)
app.put('/users/:id', async (req, res) => {
  const { id } = req.params;
  const { username, country, password } = req.body;
  try {
    let query, params;
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      query = 'UPDATE users SET username = $1, country = $2, password = $3 WHERE id = $4 RETURNING id, email, username, role, status, country';
      params = [username, country, hashedPassword, id];
    } else {
      query = 'UPDATE users SET username = $1, country = $2 WHERE id = $3 RETURNING id, email, username, role, status, country';
      params = [username, country, id];
    }
    const result = await pool.query(query, params);
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// DELETE USER
app.delete("/users/:id", async(req,res)=>{
  try{
    await pool.query("DELETE FROM users WHERE id=$1",[req.params.id]);
    res.json({message:"Utilisateur supprimé"});
  }catch(err){
    res.status(500).json({message:"Erreur serveur"});
  }
});

/* ================= ARTICLES ================= */

// GET ALL ARTICLES
app.get("/articles", async(req,res)=>{
  try{
    const result=await pool.query("SELECT * FROM articles ORDER BY date DESC");
    res.json(result.rows);
  }catch(err){
    res.status(500).json({message:"Erreur serveur"});
  }
});

// GET ONE ARTICLE
app.get("/articles/:id", async(req,res)=>{
  try{
    const result=await pool.query("SELECT * FROM articles WHERE id=$1",[req.params.id]);
    if(result.rows.length===0) return res.status(404).json({message:"Article introuvable"});
    res.json(result.rows[0]);
  }catch(err){
    res.status(500).json({message:"Erreur serveur"});
  }
});

// CREATE ARTICLE
app.post("/articles", async(req,res)=>{
  const {title,category,date,author,summary,content,image,tags,photos,video_url}=req.body;
  try{
    const result=await pool.query(
      `INSERT INTO articles (title,category,date,author,summary,content,image,tags,photos,video_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [title,category,date,author,summary,content,image,tags,photos||[],video_url||null]
    );
    res.json(result.rows[0]);
  }catch(err){
    console.error(err);
    res.status(500).json({message:"Erreur serveur"});
  }
});

// UPDATE ARTICLE
app.put("/articles/:id", async(req,res)=>{
  const {id}=req.params;
  const {title,category,date,author,summary,content,image,tags,photos,video_url}=req.body;
  try{
    const result=await pool.query(
      `UPDATE articles
       SET title=$1,category=$2,date=$3,author=$4,
           summary=$5,content=$6,image=$7,
           tags=$8,photos=$9,video_url=$10
       WHERE id=$11 RETURNING *`,
      [title,category,date,author,summary,content,image,tags,photos||[],video_url||null,id]
    );
    res.json(result.rows[0]);
  }catch(err){
    console.error(err);
    res.status(500).json({message:"Erreur serveur"});
  }
});

// DELETE ARTICLE
app.delete("/articles/:id", async(req,res)=>{
  try{
    await pool.query("DELETE FROM articles WHERE id=$1",[req.params.id]);
    res.json({message:"Article supprimé"});
  }catch(err){
    res.status(500).json({message:"Erreur serveur"});
  }
});

/* ================= COMMENTS ================= */

// GET COMMENTS
app.get("/comments", async(req,res)=>{
  const {articleId}=req.query;
  try{
    const result=await pool.query(
      "SELECT * FROM comments WHERE article_id=$1 ORDER BY date ASC",[articleId]
    );
    res.json(result.rows);
  }catch(err){
    res.status(500).json({message:"Erreur serveur"});
  }
});

// ADD COMMENT
app.post("/comments", async(req,res)=>{
  const {articleId,content,author}=req.body;
  try{
    const result=await pool.query(
      `INSERT INTO comments (article_id,content,author,date) VALUES ($1,$2,$3,$4) RETURNING *`,
      [articleId,content,author,new Date().toISOString()]
    );
    res.json(result.rows[0]);
  }catch(err){
    res.status(500).json({message:"Erreur serveur"});
  }
});

// DELETE COMMENT
app.delete("/comments/:id", async(req,res)=>{
  try{
    await pool.query("DELETE FROM comments WHERE id=$1",[req.params.id]);
    res.json({message:"Commentaire supprimé"});
  }catch(err){
    res.status(500).json({message:"Erreur serveur"});
  }
});

/* ================= SERVER ================= */

const PORT=process.env.PORT||3000;
// CONTACT
app.post("/contact", async (req, res) => {
  const { name, email, message } = req.body;
  try {
    await transporter.sendMail({
      from: `MetalBlog Contact <${process.env.MAIL_USER}>`,
      to: process.env.MAIL_USER,
      replyTo: email,
      subject: `[MetalBlog] Message de ${name}`,
      html: `
        <h3>Nouveau message de contact</h3>
        <p><b>Nom :</b> ${name}</p>
        <p><b>Email :</b> ${email}</p>
        <p><b>Message :</b></p>
        <p>${message}</p>
      `
    });
    res.json({ message: 'Message envoyé' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur lors de l\'envoi' });
  }
});

app.listen(PORT,()=>{
  console.log(`MetalBlog backend running on port ${PORT}`);
});
