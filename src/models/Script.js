// src/models/Script.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const parameterSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['string', 'number', 'boolean', 'array'],
    default: 'string'
  },
  required: {
    type: Boolean,
    default: false
  },
  defaultValue: {
    type: Schema.Types.Mixed,
    default: null
  },
  validation: {
    type: String,
    default: null
  }
}, { _id: false });

const ScriptSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  scriptType: {
    type: String,
    enum: ['python', 'bash', 'shell'],
    required: true
  },
  filePath: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: Schema.Types.ObjectId,
    ref: 'ScriptCategory',
    required: true
  },
  parameters: [parameterSchema],
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster queries
ScriptSchema.index({ name: 1 });
ScriptSchema.index({ category: 1 });
ScriptSchema.index({ isActive: 1 });

const Script = mongoose.model('Script', ScriptSchema);
module.exports = Script;