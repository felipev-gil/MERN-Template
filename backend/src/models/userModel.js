const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  sessionVersion: { type: Number, default: 0 },
  name: { type: String, required: true, trim: true, maxlength: 80 },
  email: { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true, select: false },
}, { timestamps: true });
const User = mongoose.model('User', schema);
const findByEmail = email => User.findOne({ email }).select('+passwordHash');
const findById = id => mongoose.isValidObjectId(id) ? User.findById(id) : null;
const create = data => User.create(data);
const publicUser = user => ({ id: String(user._id), name: user.name, email: user.email, createdAt: user.createdAt });
const revokeSessions = id => mongoose.isValidObjectId(id) ? User.updateOne({ _id: id }, { $inc: { sessionVersion: 1 } }) : null;
module.exports = { revokeSessions, User, findByEmail, findById, create, publicUser };

