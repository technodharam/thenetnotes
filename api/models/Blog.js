import mongoose from 'mongoose';

const blogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  tags: {
    type: [String],
    default: []
  },
  featuredImage: {
    type: String,
    default: ''
  },
  author: {
    type: String,
    default: 'Admin'
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

export default mongoose.model('Blog', blogSchema);
