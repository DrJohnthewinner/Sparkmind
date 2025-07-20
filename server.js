const express = require('express');
const multer = require('multer');
const session = require('express-session');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static file serving
app.use(express.static(path.join(__dirname)));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Session middleware
app.use(session({
  secret: 'superSecret123', // 🔐 Change this in production!
  resave: false,
  saveUninitialized: false
}));

// In-memory or file-backed notes list
const notesPath = path.join(__dirname, 'notes.json');
let notes = [];
if (fs.existsSync(notesPath)) {
  notes = JSON.parse(fs.readFileSync(notesPath));
} else {
  fs.writeFileSync(notesPath, JSON.stringify([], null, 2));
}

// Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${name}${ext}`);
  }
});
const upload = multer({ storage });

// ====== AUTH ROUTES ======

// Login route
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'admin' && password === 'spark123') {
    req.session.loggedIn = true;
    return res.json({ success: true });
  }
  res.status(401).json({ error: 'Invalid credentials' });
});

// Logout
app.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

// Protect admin.html route
app.get('/admin.html', (req, res, next) => {
  if (req.session.loggedIn) {
    next(); // let express.static serve it
  } else {
    res.redirect('/login.html');
  }
});

// ====== FILE UPLOAD ======

app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({ url: fileUrl });
});

// ====== NOTES API ======

// Get notes by grade and subject
app.get('/api/notes', (req, res) => {
  const { grade, subject } = req.query;
  const filtered = notes.filter(n => n.grade === grade && n.subject === subject);
  res.json(filtered);
});

// Add or update a note
app.post('/api/notes', (req, res) => {
  const note = req.body;
  if (!note.createdAt) {
    return res.status(400).json({ error: 'Missing createdAt timestamp' });
  }

  const index = notes.findIndex(n => n.createdAt === note.createdAt);
  if (index !== -1) {
    notes[index] = note;
  } else {
    notes.push(note);
  }

  fs.writeFileSync(notesPath, JSON.stringify(notes, null, 2));
  res.json({ success: true });
});

// Delete note
app.delete('/api/notes/:id', (req, res) => {
  const noteId = req.params.id;
  const initialLength = notes.length;
  notes = notes.filter(n => n.createdAt !== noteId);
  if (notes.length === initialLength) {
    return res.status(404).json({ error: 'Note not found' });
  }

  fs.writeFileSync(notesPath, JSON.stringify(notes, null, 2));
  res.json({ success: true });
});

// ====== SERVER START ======
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
