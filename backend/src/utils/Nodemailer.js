import nodemailer from "nodemailer";

export const Sendmail = async function (email, subject, message) {
  // Create a transporter object using the default SMTP transport
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_PORT === '465', // Use `true` for port 465, `false` for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const receiver = {
    from: process.env.EMAIL_USER, // sender address
    to: email, // list of receivers
    subject: subject, // Subject line
    html: message, // HTML body
  };

  // Verify SMTP connection
  transporter.verify((error, success) => {
    if (error) {
      console.error("SMTP connection error:", error);
    } else {
      console.log("SMTP connection successful");
    }
  });

  console.log(`Sending email to: ${email} with subject: ${subject}`);

  try {
    const info = await transporter.sendMail(receiver);
    console.log('Email sent:', info.response);
    return { success: true, message: 'Verification email sent successfully' };
  } catch (error) {
    console.error('Error sending email:', error.message);  
    return { success: false, error: error.message };
  }
};
