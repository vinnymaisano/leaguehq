import nodemailer from 'nodemailer';

export async function send_verification_email(user_email, token) {
    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  
    const verificationUrl = `http://localhost:5000/auth/verify-email?token=${token}`;
  
    const mailOptions = {
      from: "LeagueHQ",
      to: user_email,
      subject: 'Verify your email address',
      html: `<p>Please click this link to verify your account:</p><a href="${verificationUrl}">${verificationUrl}</a>`,
    };
  
    try {
      const info = await transporter.sendMail(mailOptions);
      console.log("Email sent: ", info.response)
      return true
    } catch (err) {
      console.error("Failed to send email: ", err)
      return false
    }
}

export async function send_reset_password_email(email, reset_token) {
    // link goes to frotend
    const reset_link = `http://localhost:5173/reset-password/${reset_token}`

    const transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD,
        },
    })

    const mailOptions = {
        from: "LeagueHQ",
        to: email,
        subject: "Reset your password",
        html: `
            <p>Click the link below to set a new password:</p>
            <a href="${reset_link}">${reset_link}</a>
            <p>This link will expire in 1 hour.</p>
        `,
    }

    await transporter.sendMail(mailOptions)
}