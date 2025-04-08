const nodemailer = require("nodemailer");

const sendEmail = async ({ to, subject, html }) => {
  
  const transporter = nodemailer.createTransport({
    service:'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

 
  try {
    const info = await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to,
        subject,
        html,
      });
      console.log("Email sent: %s", info.messageId);
  } catch (error) {
    console.error("Failed to send email",error)
  }
  

  
};

module.exports = { sendEmail };
