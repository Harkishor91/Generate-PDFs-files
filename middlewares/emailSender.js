const nodemailer = require("nodemailer");
require("dotenv").config();

// Create a reusable transporter object using SMTP transport.
const mailTransporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.USER_EMAIL,
    pass: process.env.USER_PASSWORD,
  },
  debug: true,
});

// Define the sendEmail function
const emailSender = async (to, otp) => {
  try {
    // Define the HTML content
    const optHtmlContent = `
       <html>
          <body>
            <div style="text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center">
              <h1 style="color: #4CAF50;">You are now register on Store Management!</h1>
              <p style="font-size: 18px; color: 'green';">Thank you for choosing us. Please verify your otp <span style="color:#4CAF50;font-size: 20px; font-weight: 600; ">${otp}</span> </p>
              <img src="cid:uniqueId" alt="Store Image" style="width: 100%; max-width: 500px; height: auto; border-radius:20px;"/>
            </div>
          </body>
        </html>
       `;

    // Define email details
    const mailDetails = {
      from: process.env.SENDER_EMAIL,
      to,
      html: optHtmlContent,
      attachments: [
        {
          filename: "store.jpeg",
          path: "./uploads/store.jpeg",
          cid: "uniqueId", // same cid value as in the html img src
        },
      ],
    };

    // Send email
    const info = await mailTransporter.sendMail(mailDetails);
    return info; // Return the info instead of sending the response
  } catch (err) {
    throw new Error(`Failed to send email: ${err.message}`);
  }
};

module.exports = emailSender;
