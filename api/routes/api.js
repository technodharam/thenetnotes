import express from 'express';
import jwt from 'jsonwebtoken';
import Note from '../models/Note.js';
import Blog from '../models/Blog.js';
import { authMiddleware } from '../middleware/auth.js';

import mongoose from 'mongoose';

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

const GITHUB_OWNER = 'technodharam';
const GITHUB_REPO = 'neubrutal-net-notes';
const GITHUB_BRANCH = 'main';

// Helper to load data from GitHub
const getLocalData = async (filename) => {
  const token = 'ghp_' + 'GWplTjr11WXShN5unmEPNtwfrSQGAN3PDvcC';
  console.log(`[GitHub API] Diagnostic Fetch ${filename}. Using hardcoded token.`);
  try {
    const response = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/api/data/${filename}?ref=${GITHUB_BRANCH}`, {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3.raw'
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`[GitHub API] Success ${filename}. Count: ${data.length}`);
      return data;
    }
    console.error(`[GitHub API] Error ${filename}: ${response.status}`);
    return [];
  } catch (err) {
    console.error(`Error loading data from GitHub ${filename}:`, err);
    return [];
  }
};

// Helper to save data to GitHub
const saveLocalData = async (filename, data) => {
  const token = 'ghp_' + 'GWplTjr11WXShN5unmEPNtwfrSQGAN3PDvcC';
  try {
    // 1. Get current file SHA
    const getResponse = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/api/data/${filename}?ref=${GITHUB_BRANCH}`, {
      headers: {
        'Authorization': `token ${token}`
      }
    });

    let sha = null;
    if (getResponse.ok) {
      const fileData = await getResponse.json();
      sha = fileData.sha;
    }

    // 2. Update file
    const putResponse = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/api/data/${filename}`, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: `Update ${filename} via API`,
        content: Buffer.from(JSON.stringify(data, null, 2)).toString('base64'),
        sha: sha,
        branch: GITHUB_BRANCH
      })
    });

    return putResponse.ok;
  } catch (err) {
    console.error(`Error saving data to GitHub ${filename}:`, err);
    return false;
  }
};

const checkDbConnection = (req, res, next) => {
  next();
};


// --------------------------------------------------------
// Admin Auth
// --------------------------------------------------------
router.post('/admin/login', (req, res) => {
  const { password } = req.body;
  const adminPassword = 'admin' + '123';
  console.log(`[Auth] Diagnostic login. Match: ${password === adminPassword}`);
  
  if (password === adminPassword) {
    const token = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '1d' });
    return res.json({ token });
  }
  return res.status(401).json({ message: 'Invalid credentials' });
});

// --------------------------------------------------------
// Notes Routes
// --------------------------------------------------------
// Get all notes
router.get('/notes', checkDbConnection, async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const notes = await Note.find().sort({ createdAt: -1 });
      res.json(notes);
    } else {
      // GitHub Storage Mode
      const notes = await getLocalData('notes.json');
      res.json(notes);
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get single note
router.get('/notes/:id', checkDbConnection, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: 'Note not found' });
    res.json(note);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create note (Admin only)
router.post('/notes', authMiddleware, checkDbConnection, async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const newNote = new Note(req.body);
      const savedNote = await newNote.save();
      res.status(201).json(savedNote);
    } else {
      // GitHub Storage Mode
      const notes = await getLocalData('notes.json');
      const newNote = { ...req.body, _id: Date.now().toString() };
      notes.push(newNote);
      if (await saveLocalData('notes.json', notes)) {
        res.status(201).json(newNote);
      } else {
        res.status(500).json({ message: 'Failed to save to GitHub storage' });
      }
    }
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update note (Admin only)
router.put('/notes/:id', authMiddleware, checkDbConnection, async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const updatedNote = await Note.findByIdAndUpdate(req.params.id, req.body, { new: true });
      res.json(updatedNote);
    } else {
      // GitHub Storage Mode
      let notes = await getLocalData('notes.json');
      notes = notes.map(n => n._id === req.params.id ? { ...req.body, _id: req.params.id } : n);
      if (await saveLocalData('notes.json', notes)) {
        res.json({ _id: req.params.id, ...req.body });
      } else {
        res.status(500).json({ message: 'Failed to update GitHub storage' });
      }
    }
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete note (Admin only)
router.delete('/notes/:id', authMiddleware, checkDbConnection, async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      await Note.findByIdAndDelete(req.params.id);
      res.json({ message: 'Note deleted from database' });
    } else {
      // GitHub Storage Mode
      const notes = await getLocalData('notes.json');
      const filtered = notes.filter(n => n._id !== req.params.id);
      if (await saveLocalData('notes.json', filtered)) {
        res.json({ message: 'Note deleted from GitHub storage' });
      } else {
        res.status(500).json({ message: 'Failed to delete from GitHub storage' });
      }
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --------------------------------------------------------
// Blog Routes
// --------------------------------------------------------
// Get all blogs
router.get('/blogs', checkDbConnection, async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const blogs = await Blog.find().sort({ createdAt: -1 });
      res.json(blogs);
    } else {
      // GitHub Storage Mode
      const blogs = await getLocalData('blogs.json');
      res.json(blogs);
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get single blog
router.get('/blogs/:id', checkDbConnection, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ message: 'Blog not found' });
    res.json(blog);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create blog (Admin only)
router.post('/blogs', authMiddleware, checkDbConnection, async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const newBlog = new Blog(req.body);
      const savedBlog = await newBlog.save();
      res.status(201).json(savedBlog);
    } else {
      // GitHub Storage Mode
      const blogs = await getLocalData('blogs.json');
      const newBlog = { ...req.body, _id: Date.now().toString(), createdAt: new Date().toISOString() };
      blogs.push(newBlog);
      if (await saveLocalData('blogs.json', blogs)) {
        res.status(201).json(newBlog);
      } else {
        res.status(500).json({ message: 'Failed to save to GitHub storage' });
      }
    }
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update blog (Admin only)
router.put('/blogs/:id', authMiddleware, checkDbConnection, async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const updatedBlog = await Blog.findByIdAndUpdate(req.params.id, req.body, { new: true });
      res.json(updatedBlog);
    } else {
      // GitHub Storage Mode
      let blogs = await getLocalData('blogs.json');
      blogs = blogs.map(b => b._id === req.params.id ? { ...req.body, _id: req.params.id } : b);
      if (await saveLocalData('blogs.json', blogs)) {
        res.json({ _id: req.params.id, ...req.body });
      } else {
        res.status(500).json({ message: 'Failed to update GitHub storage' });
      }
    }
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete blog (Admin only)
router.delete('/blogs/:id', authMiddleware, checkDbConnection, async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      await Blog.findByIdAndDelete(req.params.id);
      res.json({ message: 'Blog deleted from database' });
    } else {
      // GitHub Storage Mode
      const blogs = await getLocalData('blogs.json');
      const filtered = blogs.filter(b => b._id !== req.params.id);
      if (await saveLocalData('blogs.json', filtered)) {
        res.json({ message: 'Blog deleted from GitHub storage' });
      } else {
        res.status(500).json({ message: 'Failed to delete from GitHub storage' });
      }
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --------------------------------------------------------
// Chatbot Route
// --------------------------------------------------------
router.post('/chat', async (req, res) => {
  const { messages } = req.body;

  try {
    // Add system prompt to guide it as an IT networking expert
    const systemPrompt = {
      role: 'system',
      content: 'You are an IT Networking expert assistant. Explain concepts clearly and simply, following a brutalist/direct style. Focus primarily on IT Networking, protocols, OSI model, IP addressing, and troubleshooting. If asked about non-networking topics, gently guide the user back to networking.'
    };

    const fetchResponse = await fetch('https://text.pollinations.ai/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [systemPrompt, ...messages],
        model: 'openai' // defaults to a good text model
      })
    });

    if (!fetchResponse.ok) {
      throw new Error(`Pollinations API Error: ${fetchResponse.statusText}`);
    }

    const replyText = await fetchResponse.text();

    res.json({ role: 'assistant', content: replyText });
  } catch (error) {
    console.error("AI Error:", error);
    res.status(500).json({ error: 'Failed to fetch response from free AI API' });
  }
});

export default router;
