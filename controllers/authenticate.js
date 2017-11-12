const jwt = require('jsonwebtoken');
const User = require('../models/User');
const nodemailer = require('nodemailer');
const request = require('request');

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

function checkCaptcha(captcha) {
  const secretKey = '6Lc1PTgUAAAAAJIXkdqzbZYCaGmWq96c3fxFvOOL';
  const url = 'https://www.google.com/recaptcha/api/siteverify';
  const requestCode = captcha;
  return new Promise( (resolve, reject) => {
    request.post({
      url: url,
      formData: {
        secret: secretKey,
        response: requestCode
      }
    }, (err, res, body) => {
      console.dir(body);
      resolve(body);
    });
  });
}

module.exports.addUser = (req, res) => {
  const fullName = req.body.fullName || req.headers.fullName;
  const email = req.body.email || req.headers.email;
  const pwd   = req.body.password || req.headers.password;
  const captcha = req.body.captcha || req.headers.captcha;

  if (captcha === undefined) {
    return res.json({ message: 'Вы робот' });
  } else {
    checkCaptcha(captcha).then((response) => {
      if (response.success === false) {
        return res.json({ message: 'Вы робот' });
      } else {
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
      }
    });
  }
};

module.exports.sendEmail = (req, res) => {
  const reCaptchaError = {
    status: 'error',
    message: 'Действия на сайте для роботов запрещены'
  };

  const emailInfo = {
    email: req.body.email,
    name: req.body.userName,
    message: req.body.message
  };

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'mshsk.financial@gmail.com',
      pass: 'asdf9qh23ouhfu9q20fjaw'
    }
  });
  if (req.body.captcha === null) {
    return res.json(reCaptchaError);
  } else {
    checkCaptcha(req.body.captcha).then((response) => {
      if (response.success === false) {
        return res.json(reCaptchaError);
      } else {
        const mailOptions = {
          from: emailInfo.email,
          to: 'maksim_bender08@mail.ru',
          subject: 'Обращение в службу поддержки приложения',
          text: emailInfo.message
        };

        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            console.log(error);
          } else {
            console.log('Email sent: ' + info.response);
          }
        });
        return res.json({
          status: 'ok',
          message: 'Сообщение было успешно отправлено'
        });
      }
    });
  }
  const request = req.body.email;

}
