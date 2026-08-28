import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema({
  name: {type: String, required: true, trim: true},
  email: {type: String, required: true, unique: true, trim: true, lowercase: true},
  password: {type: String, required: true},
  credits: {type: Number, default: 20},
})

// Hash password before saving.
// Mongoose 9 does not pass `next` to async middleware - returning resolves it.
userSchema.pre('save', async function () {
  if(!this.isModified('password')){
    return
  }
  const salt = await bcrypt.genSalt(10)
  this.password = await bcrypt.hash(this.password, salt)
})

const User = mongoose.model('User', userSchema);

export default User;
