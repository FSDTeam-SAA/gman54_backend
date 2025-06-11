import AppError from "../errors/AppError.js";
import catchAsync from "../utils/catchAsync.js";
import { sendEmail, sendMessageTemplate } from "../utils/sendEmail.js";
import sendResponse from "../utils/sendResponse.js";

export const contactUs = catchAsync(async (req, res) => {
    const { email, subject, message } = req.body;
    // console.log( email, subject, message );
    if (!email || !subject || !message) {
        throw new AppError(400, "Please fill all the fields");
    }
    const to = "tahsin.bdcalling@gmail.com"
    const html = sendMessageTemplate({ email, subject, message })
    // console.log(to, html)

    const result = await sendEmail(
       to,
        subject,
       html
    );
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Email sent successfully",
        data: ""
    })
})