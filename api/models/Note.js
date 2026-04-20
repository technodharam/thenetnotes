import mongoose from 'mongoose';

const noteSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
    enum: ['Basics', 'IP Addressing', 'Protocols', 'Routing & Switching', 'Network Security', 'Cloud Networking', 'Troubleshooting']
  },
  content: {
    type: String,
    required: true,
  },
  level: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    default: 'Beginner'
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

export default mongoose.model('Note', noteSchema);
