// src/models/ScriptExecution.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const ScriptExecutionSchema = new Schema({
  scriptId: {
    type: Schema.Types.ObjectId,
    ref: 'Script',
    required: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  parameters: {
    type: Map,
    of: Schema.Types.Mixed,
    default: {}
  },
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: {
    type: Date
  },
  status: {
    type: String,
    enum: ['pending', 'running', 'completed', 'failed'],
    default: 'pending'
  },
  output: {
    type: String
  },
  error: {
    type: String
  },
  isScheduled: {
    type: Boolean,
    default: false
  },
  scheduledTime: {
    type: Date
  }
});

// Indexes for faster queries
ScriptExecutionSchema.index({ scriptId: 1 });
ScriptExecutionSchema.index({ userId: 1 });
ScriptExecutionSchema.index({ status: 1 });
ScriptExecutionSchema.index({ startTime: -1 });

const ScriptExecution = mongoose.model('ScriptExecution', ScriptExecutionSchema);
module.exports = ScriptExecution;