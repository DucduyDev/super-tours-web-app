const nodemailer = require("nodemailer");
const pug = require("pug");
const htmlToText = require("html-to-text");

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(" ")[0];
    this.url = url;
    this.from = `Nguyen Hoang Duc Duy <${process.env.EMAIL_FROM}>`;
  }

  // 1. Create a transporter => basically a service that will actually the email (Gmail)
  createTransport() {
    if (process.env.NODE_ENV === "production") {
      // Sendgrid
      return 1;
    }

    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  async send(template, subject) {
    // 1. Render HTML based on a pug template
    const html = pug.renderFile(
      `${__dirname}/../views/emails/${template}.pug`,
      {
        firstName: this.firstName,
        url: this.url,
        subject,
      }
    );

    // 2. Define email options
    const emailOptions = {
      from: this.from,
      to: this.to,
      subject: subject,
      html,
      text: htmlToText.convert(html, false),
    };

    // 3. Create a transport and send email
    await this.createTransport().sendMail(emailOptions);
  }

  async sendWelcome() {
    await this.send("welcome", `Welcome to the Super Tours`);
  }

  async sendPasswordReset() {
    await this.send(
      "password-reset",
      "Your password reset token (valid for only 15 minutes)"
    );
  }
};
