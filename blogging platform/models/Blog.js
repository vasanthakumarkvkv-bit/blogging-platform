// models/Blog.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CommentSchema = new Schema({
  author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true, trim: true },
  createdAt: { type: Date, default: Date.now }
});

const BlogSchema = new Schema({
  title: { type: String, required: true, trim: true },
  content: { type: String, required: true },
  author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  comments: [CommentSchema] // nested comments
}, { timestamps: true });

module.exports = mongoose.model('Blog', BlogSchema);