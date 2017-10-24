const bcrypt = require('bcrypt-nodejs');
const crypto = require('crypto');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  email: { type: String, unique: true },
  password: String,
  userData: Object,

  profile: {
    name: String,
    gender: String,
    location: String,
    website: String,
    picture: String
  }
}, { timestamps: true });


process.env.SECRET_KEY = 'somethingLikeThis';

/**
 * Password hash middleware.
 */
userSchema.pre('save', function save(next) {
  const user = this;
  if (!user.isModified('password')) { return next(); }
  const hash = bcrypt.hashSync(user.password, bcrypt.genSaltSync(9));
  user.password = hash;
  next();
});

/**
 * Helper method for validating user's password.
 */
userSchema.methods.comparePassword = function comparePassword(candidatePassword, userPassword) {
  return bcrypt.compareSync(candidatePassword, userPassword);
};


const User = mongoose.model('User', userSchema);

module.exports = User;
