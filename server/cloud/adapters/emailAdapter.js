const _ = require('lodash');
const nodemailer = require('nodemailer');
const { resetPasswordEmail } = require('../emails');

const sendMail = (transporter, emailData) => new Promise((resolve, reject) => {
  transporter.sendMail(emailData, (err, info) => {
    if (err) {
      console.error(err);
      reject(err);
    } else {
      const response = _.get(info, 'response');
      console.log('Send email result is: ', response);
      resolve(response);
    }
  });
});

class EmailAdapter {

  constructor({
    user, sender, pass, host, port,
  }) {
    if (!port || !host || !user || !pass || !sender) {
      throw new Error('nodemailer requires sender, port, host, user, pass');
    }
    this.transporter = nodemailer.createTransport({
      debug: process.env.NODE_ENV !== 'production',
      host,
      port,
      auth: { pass, user },
    });
    this.fromAddress = sender;
  }

  sendMail({
    text, to, subject, html,
  }) {
    return sendMail(this.transporter, {
      from: this.fromAddress, to, text, html, subject,
    });
  }

  sendPasswordResetEmail({ link, user }) {
    const to = user.get('email');
    const subject = `${process.env.APP_NAME}, set you new password`;
    const { html, text } = resetPasswordEmail({ link, name: user.get('name'), language: user.get('language') });

    return this.sendMail({
      html, to, subject, text,
    });
  }

}

module.exports = EmailAdapter;
