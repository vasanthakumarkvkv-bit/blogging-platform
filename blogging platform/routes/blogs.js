// routes/blogs.js
const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const Blog = require('../models/Blog');
const User = require('../models/User');

// Get all blogs (paginated simple example)
router.get('/', async (req, res) => {
  try {
    const blogs = await Blog.find()
      .populate('author', 'name email')
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(blogs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single blog
router.get('/:id', async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id)
      .populate('author', 'name email')
      .populate('comments.author', 'name email');
    if (!blog) return res.status(404).json({ message: 'Blog not found' });
    res.json(blog);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create blog (protected)
router.post(
  '/',
  auth,
  [
    body('title').notEmpty(),
    body('content').notEmpty()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const user = await User.findById(req.user.id).select('-password');
      if (!user) return res.status(401).json({ message: 'User not found' });

      const { title, content } = req.body;
      const blog = new Blog({ title, content, author: user._id });
      await blog.save();
      res.status(201).json(blog);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Update blog (protected, only author)
router.put('/:id', auth, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ message: 'Blog not found' });

    if (blog.author.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized: not the author' });
    }

    const { title, content } = req.body;
    if (title !== undefined) blog.title = title;
    if (content !== undefined) blog.content = content;
    await blog.save();
    res.json(blog);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete blog (protected, only author)
router.delete('/:id', auth, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ message: 'Blog not found' });

    if (blog.author.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized: not the author' });
    }

    await blog.remove();
    res.json({ message: 'Blog removed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});


// Add comment to blog (protected)
router.post(
  '/:id/comments',
  auth,
  [ body('content').notEmpty() ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const blog = await Blog.findById(req.params.id);
      if (!blog) return res.status(404).json({ message: 'Blog not found' });

      const comment = {
        author: req.user.id,
        content: req.body.content
      };

      blog.comments.unshift(comment);
      await blog.save();

      // populate the newly added comment's author
      const populated = await Blog.findById(blog._id).populate('comments.author', 'name email');
      res.status(201).json(populated.comments[0]); // newest comment
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Delete a comment (protected) - only comment author or blog author
router.delete('/:id/comments/:commentId', auth, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ message: 'Blog not found' });

    const comment = blog.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    const isCommentAuthor = comment.author.toString() === req.user.id;
    const isBlogAuthor = blog.author.toString() === req.user.id;

    if (!isCommentAuthor && !isBlogAuthor) {
      return res.status(403).json({ message: 'Unauthorized to delete comment' });
    }

    comment.remove();
    await blog.save();
    res.json({ message: 'Comment deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;