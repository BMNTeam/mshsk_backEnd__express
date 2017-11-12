const jwt = require('jsonwebtoken');
const User = require('../models/User');
const nodemailer = require('nodemailer')

module.exports.authenticate = function (req, res) {
  const email = req.body.email || req.header.email;
  const pwd   = req.body.password || req.header.password;
  if (!email && !pwd) {
    return res.json({
      status: 'error',
      message: 'Provide an email or password'
    });
  }
  User.findOne({ email }, (err, users) => {
    if (err) {
      res.json({
        status: 'error',
        message: 'User not found'
      });
    }
    if (users != null && users.comparePassword(pwd, users.password)) {
      // User encoding password to generate token
      const jsonUser = {
        email: users.email,
        password: users.password
      };
      // Create token
      const token = jwt.sign(jsonUser, process.env.SECRET_KEY, {
        expiresIn: 4000
      });
      // Info with user's data
      const userInfo = {
        email: users.email,
        fullName: users.profile.name,
        user: users
      };
      res.json({
        token,
        user: userInfo,
        status: 'OK',
        authorized: 'OK'
      });
    } else {
      res.json({
        status: 'error',
        message: 'Неверное имя пользователя или пароль'
      });
    }
  });

  // const token = jwt.sign(user, process.env.SECRET_KEY, {
  //   expiresIn: 4000
  // });

  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
};

module.exports.addUser = (req, res) => {
  const fullName = req.body.fullName || req.headers.fullName;
  const email = req.body.email || req.headers.email;
  const pwd   = req.body.password || req.headers.password;

  if (email === undefined || email === null) {
    res.json({ message: 'Please send email' });
    return;
  }
  // TODO check why email doesn't work (probably due to plugin)
  // if (!email.isEmail) {
  //   res.json({ status: 'error', message: 'Not valid email' });
  //   return;
  // }
  const user = new User({
    email,
    password: pwd,
    profile: {
      name: fullName
    }
  });
  user.save();
  res.json({
    status: 'ok',
    message: 'user successfully created'
  });
};

module.exports.sendEmail = (req, res) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'mshsk.financial@gmail.com',
      pass: 'asdf9qh23ouhfu9q20fjaw'
    }
  });

  const mailOptions = {
    from: 'maksimbender081991@gmail.com',
    to: 'maksim_bender08@mail.ru',
    subject: 'Sending Email using Node.js',
    text: 'That was easy!'
  };

  transporter.sendMail(mailOptions, function(error, info){
    if (error) {
      console.log(error);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });
}
