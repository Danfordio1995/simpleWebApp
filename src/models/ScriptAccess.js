// src/models/ScriptAccess.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const ScriptAccessSchema = new Schema({
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
  canExecute: {
    type: Boolean,
    default: true
  },
  canEdit: {
    type: Boolean,
    default: false
  },
  grantedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  grantedAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index for script + user uniqueness
ScriptAccessSchema.index({ scriptId: 1, userId: 1 }, { unique: true });

const ScriptAccess = mongoose.model('ScriptAccess', ScriptAccessSchema);
module.exports = ScriptAccess;