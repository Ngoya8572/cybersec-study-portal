const express = require('express');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? null : 'development-only-change-this-secret');
if (!JWT_SECRET) throw new Error('Set JWT_SECRET in production environment variables.');
const PASS_MARK = 70;

app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

function sign(user) {
  return jwt.sign({ uid: user.id }, JWT_SECRET, { expiresIn: '7d' });
}
function setAuthCookie(res, token) {
  res.cookie('token', token, {
    httpOnly: true, sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
}
function authRequired(req, res, next) {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: 'Not signed in' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = db.prepare('SELECT id,name,email,role FROM users WHERE id=?').get(payload.uid);
    if (!user) return res.status(401).json({ error: 'Session invalid' });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: 'Session invalid' });
  }
}
function adminRequired(req, res, next) {
  if (!req.user || req.user.role !== 'admin') return res.status(403).json({ error: 'Instructor access only' });
  next();
}
function bestScoresForUser(userId) {
  const rows = db.prepare(`SELECT unit_id, MAX(percentage) AS best, COUNT(*) AS attempts
    FROM attempts WHERE user_id=? GROUP BY unit_id`).all(userId);
  const map = {};
  for (const row of rows) map[row.unit_id] = { best: row.best, attempts: row.attempts };
  return map;
}
function unitWithProgress(unit, scores) {
  const s = scores[unit.id] || { best: 0, attempts: 0 };
  return {
    ...unit, best: s.best, attempts: s.attempts,
    status: s.best >= PASS_MARK ? 'pass' : s.attempts ? 'fail' : 'new',
    questionCount: db.prepare('SELECT COUNT(*) n FROM questions WHERE unit_id=?').get(unit.id).n,
    lessonCount: db.prepare('SELECT COUNT(*) n FROM lessons WHERE unit_id=?').get(unit.id).n
  };
}
function csvEscape(value) { return '"' + String(value ?? '').replace(/"/g, '""') + '"'; }

// Authentication
app.post('/api/register', (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password) return res.status(400).json({ error: 'All fields are required' });
  if (String(name).trim().length < 2) return res.status(400).json({ error: 'Enter your full name' });
  const cleanEmail = String(email).trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) return res.status(400).json({ error: 'Invalid email address' });
  if (String(password).length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
  if (db.prepare('SELECT id FROM users WHERE email=?').get(cleanEmail)) return res.status(409).json({ error: 'Email already registered' });
  const role = db.prepare('SELECT COUNT(*) n FROM users').get().n === 0 ? 'admin' : 'student';
  const info = db.prepare('INSERT INTO users(name,email,password_hash,role,created_at) VALUES(?,?,?,?,?)')
    .run(String(name).trim(), cleanEmail, bcrypt.hashSync(password, 10), role, Date.now());
  const user = db.prepare('SELECT id,name,email,role FROM users WHERE id=?').get(info.lastInsertRowid);
  setAuthCookie(res, sign(user));
  res.json({ user });
});
app.post('/api/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  const row = db.prepare('SELECT * FROM users WHERE email=?').get(String(email).trim().toLowerCase());
  if (!row || !bcrypt.compareSync(password, row.password_hash)) return res.status(401).json({ error: 'Invalid email or password' });
  const user = { id: row.id, name: row.name, email: row.email, role: row.role };
  setAuthCookie(res, sign(user));
  res.json({ user });
});
app.post('/api/logout', (req, res) => { res.clearCookie('token'); res.json({ ok: true }); });
app.get('/api/me', authRequired, (req, res) => res.json({ user: req.user }));
app.post('/api/change-password', authRequired, (req, res) => {
  const { current, next } = req.body || {};
  if (!current || !next) return res.status(400).json({ error: 'Both passwords are required' });
  if (String(next).length < 6) return res.status(400).json({ error: 'New password must be at least 6 characters' });
  const row = db.prepare('SELECT password_hash FROM users WHERE id=?').get(req.user.id);
  if (!bcrypt.compareSync(current, row.password_hash)) return res.status(400).json({ error: 'Current password is incorrect' });
  db.prepare('UPDATE users SET password_hash=? WHERE id=?').run(bcrypt.hashSync(next, 10), req.user.id);
  res.json({ ok: true });
});

// Course content and assessments
app.get('/api/units', authRequired, (req, res) => {
  const units = db.prepare('SELECT * FROM units ORDER BY position').all();
  const scores = bestScoresForUser(req.user.id);
  res.json({ units: units.map(u => unitWithProgress(u, scores)), passMark: PASS_MARK });
});
app.get('/api/units/:slug', authRequired, (req, res) => {
  const unit = db.prepare('SELECT * FROM units WHERE slug=?').get(req.params.slug);
  if (!unit) return res.status(404).json({ error: 'Unit not found' });
  const lessons = db.prepare('SELECT title,content FROM lessons WHERE unit_id=? ORDER BY position').all(unit.id);
  const questions = db.prepare('SELECT id,question,options FROM questions WHERE unit_id=? ORDER BY position').all(unit.id);
  res.json({
    unit: unitWithProgress(unit, bestScoresForUser(req.user.id)),
    lessons,
    questions: questions.map(q => ({ id:q.id, question:q.question, options:JSON.parse(q.options) }))
  });
});
app.post('/api/units/:slug/submit', authRequired, (req, res) => {
  const unit = db.prepare('SELECT * FROM units WHERE slug=?').get(req.params.slug);
  if (!unit) return res.status(404).json({ error: 'Unit not found' });
  const { answers } = req.body || {};
  if (!Array.isArray(answers)) return res.status(400).json({ error: 'Answers must be an array' });
  const questions = db.prepare('SELECT id,correct_index,explanation,options FROM questions WHERE unit_id=? ORDER BY position').all(unit.id);
  if (!questions.length) return res.status(400).json({ error: 'This unit has no quiz questions yet' });
  let score = 0;
  const details = questions.map((q, i) => {
    const chosen = Number.isInteger(answers[i]) ? answers[i] : null;
    const isCorrect = chosen === q.correct_index;
    if (isCorrect) score++;
    return { questionId:q.id, chosen, correct:q.correct_index, isCorrect, explanation:q.explanation, options:JSON.parse(q.options) };
  });
  const total = questions.length;
  const percentage = Math.round(score / total * 100);
  const passed = percentage >= PASS_MARK;
  db.prepare(`INSERT INTO attempts(user_id,unit_id,score,total,percentage,passed,created_at)
    VALUES(?,?,?,?,?,?,?)`).run(req.user.id, unit.id, score, total, percentage, passed ? 1 : 0, Date.now());
  res.json({ score,total,percentage,passed,passMark:PASS_MARK,details });
});

// Student results
app.get('/api/results', authRequired, (req, res) => {
  const units = db.prepare('SELECT * FROM units ORDER BY position').all();
  const results = units.map(u => {
    const row = db.prepare(`SELECT MAX(percentage) best, COUNT(*) attempts
      FROM attempts WHERE user_id=? AND unit_id=?`).get(req.user.id, u.id);
    const last = db.prepare(`SELECT percentage FROM attempts WHERE user_id=? AND unit_id=? ORDER BY created_at DESC LIMIT 1`).get(req.user.id, u.id);
    return { unitId:u.id,slug:u.slug,title:u.title,icon:u.icon,best:row.best, last:last ? last.percentage : null, attempts:row.attempts, passed:row.best !== null && row.best >= PASS_MARK };
  });
  const passed = results.filter(r => r.passed).length;
  const average = results.length ? Math.round(results.reduce((s,r) => s + (r.best || 0),0) / results.length) : 0;
  res.json({ results, summary:{ passed,total:units.length,average,attempts:results.reduce((s,r)=>s+r.attempts,0) }, passMark:PASS_MARK });
});
app.get('/api/leaderboard', authRequired, (req, res) => {
  const units = db.prepare('SELECT id FROM units ORDER BY position').all();
  const students = db.prepare("SELECT id,name,role FROM users ORDER BY name").all();
  const leaderboard = students.map(s => {
    const scores = bestScoresForUser(s.id);
    let passed=0, sum=0, attempts=0;
    units.forEach(u => { const v=scores[u.id]; if(v){ if(v.best>=PASS_MARK) passed++; sum+=v.best; attempts+=v.attempts; } });
    return { id:s.id,name:s.name,isAdmin:s.role==='admin',passed,total:units.length,average:units.length?Math.round(sum/units.length):0,attempts };
  }).sort((a,b)=>b.average-a.average || b.passed-a.passed || a.name.localeCompare(b.name));
  res.json({ leaderboard,passMark:PASS_MARK });
});

// Instructor-only reports
app.get('/api/admin/students', authRequired, adminRequired, (req, res) => {
  const units = db.prepare('SELECT id,title FROM units ORDER BY position').all();
  const students = db.prepare("SELECT id,name,email,role,created_at FROM users ORDER BY name").all();
  const data = students.map(s => {
    const scores = bestScoresForUser(s.id);
    const perUnit = {};
    let passed=0,sum=0,attempts=0;
    units.forEach(u => {
      const v=scores[u.id];
      perUnit[u.id]=v ? {best:v.best,attempts:v.attempts} : {best:null,attempts:0};
      if(v){ if(v.best>=PASS_MARK) passed++; sum+=v.best; attempts+=v.attempts; }
    });
    return {...s,perUnit,passed,total:units.length,average:units.length?Math.round(sum/units.length):0,attempts};
  });
  res.json({ units,students:data,passMark:PASS_MARK });
});
app.get('/api/admin/export.csv', authRequired, adminRequired, (req, res) => {
  const units = db.prepare('SELECT id,title FROM units ORDER BY position').all();
  const students = db.prepare("SELECT id,name,email,role FROM users ORDER BY name").all();
  const header = ['Name','Email','Role',...units.map((u,i)=>`U${i+1} ${u.title}`),'Average','Attempts','Units Passed'];
  const lines = [header.map(csvEscape).join(',')];
  students.forEach(s => {
    const scores=bestScoresForUser(s.id); let passed=0,sum=0,attempts=0;
    const cells=units.map(u=>{const v=scores[u.id]; if(v){if(v.best>=PASS_MARK)passed++;sum+=v.best;attempts+=v.attempts;return `${v.best}%`;}return '';});
    lines.push([s.name,s.email,s.role,...cells,`${units.length?Math.round(sum/units.length):0}%`,attempts,`${passed}/${units.length}`].map(csvEscape).join(','));
  });
  res.setHeader('Content-Type','text/csv; charset=utf-8');
  res.setHeader('Content-Disposition',`attachment; filename="cybersec-results-${new Date().toISOString().slice(0,10)}.csv"`);
  res.send(lines.join('\n'));
});

app.get('*', (req,res) => res.sendFile(path.join(__dirname,'public','index.html')));
app.use((err,req,res,next) => { console.error(err); res.status(500).json({error:'Server error'}); });
app.listen(PORT, '0.0.0.0', () => console.log(`\nCyberSec Portal listening on port ${PORT}\n`));
