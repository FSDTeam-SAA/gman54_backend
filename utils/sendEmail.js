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
