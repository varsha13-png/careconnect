const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const Home = require('../models/Home');
const { protect } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = './uploads/posts';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `post_${Date.now()}${path.extname(file.originalname)}`);
  }
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// @route GET /api/posts
// Get all posts for the feed — everyone can see
router.get('/', protect, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const posts = await Post.find()
      .populate('home_id', 'name city type verification_status')
      .sort({ created_at: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Add isLiked flag for current user
    const postsWithLike = posts.map(post => ({
      ...post._doc,
      isLiked: post.likes.includes(req.user._id)
    }));

    res.json({ success: true, data: postsWithLike });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// @route POST /api/posts
// Create a post — all logged in users
router.post('/', protect, upload.single('image'), async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ success: false, message: 'Content is required' });

    const home_id = req.user.home_id || req.body.home_id;
    if (!home_id) return res.status(400).json({ success: false, message: 'Home ID is required' });

    const image_url = req.file ? `/uploads/posts/${req.file.filename}` : null;

    const post = await Post.create({
      home_id,
      author_id: req.user._id,
      author_type: req.user.role === 'donor' ? 'donor' : 'user',
      content,
      image_url
    });

    const populated = await Post.findById(post._id)
      .populate('home_id', 'name city type verification_status');

    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// @route PUT /api/posts/:postId/like
// Like or unlike a post
router.put('/:postId/like', protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

    const userId = req.user._id;
    const alreadyLiked = post.likes.includes(userId);

    if (alreadyLiked) {
      post.likes = post.likes.filter(id => id.toString() !== userId.toString());
      post.likes_count = Math.max(0, post.likes_count - 1);
    } else {
      post.likes.push(userId);
      post.likes_count += 1;
    }

    await post.save();
    res.json({ success: true, data: { likes_count: post.likes_count, isLiked: !alreadyLiked } });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// @route DELETE /api/posts/:postId
// Delete a post — only the author
router.delete('/:postId', protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    if (post.author_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    await post.deleteOne();
    res.json({ success: true, message: 'Post deleted' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;
