const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  home_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Home', required: true },
  author_id: { type: mongoose.Schema.Types.ObjectId, required: true },
  author_type: { type: String, enum: ['user', 'donor'], required: true },
  content: { type: String, required: true, maxlength: 500 },
  image_url: { type: String },
  likes: [{ type: mongoose.Schema.Types.ObjectId }],
  likes_count: { type: Number, default: 0 },
  created_at: { type: Date, default: Date.now }
});

postSchema.index({ created_at: -1 });
postSchema.index({ home_id: 1, created_at: -1 });

module.exports = mongoose.model('Post', postSchema);
