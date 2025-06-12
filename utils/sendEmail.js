import nodemailer from 'nodemailer';
export const sendEmail = async (to,subject, html) => {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: 'tahsin.bdcalling@gmail.com',
      pass: 'lcnt cxiw pcui vikv',
    },
  });
  await transporter.sendMail({
    from: 'tahsin.bdcalling@gmail.com', // sender address
    to,
    subject: subject? subject:  'Password change Link : change it by 10 minutes',
    html,
  });
};

export const sendMessageTemplate = ({ email, name,phone, message }) => {
  return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 650px; margin: auto; border: 1px solid #e5e7eb; padding: 30px; border-radius: 12px; background-color: #ffffff; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);">
      <header style="text-align: center; padding-bottom: 20px; border-bottom: 1px solid #e5e7eb;">
        <h1 style="color: #0f172a; margin: 0;">Hello Admin</h1>
        <p style="font-size: 14px; color: #6b7280; margin-top: 4px;">New Contact Message Notification</p>
      </header>

      <section style="padding: 25px 0;">
        <p style="font-size: 16px; color: #111827; margin: 0 0 10px;"><strong>Sender Email:</strong> ${email}</p>
        <p style="font-size: 16px; color: #111827; margin: 0 0 10px;"><strong>Name:</strong> ${name}</p>
        <p style="font-size: 16px; color: #111827; margin: 0 0 10px;"><strong>Phone:</strong> ${phone}</p>

        <div style="margin-top: 20px; padding: 20px; background-color: #f9fafb; border-left: 4px solid #1d4ed8; border-radius: 8px;">
          <p style="font-size: 15px; color: #374151; margin: 0; white-space: pre-wrap;">
            ${message}
          </p>
        </div>
      </section>

      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;"/>

      <footer style="text-align: center; font-size: 13px; color: #9ca3af;">
        This message was sent via the Quantivo contact form.<br />
        &copy; 2025 Quantivo. All rights reserved.
      </footer>
    </div>
  `;
};
