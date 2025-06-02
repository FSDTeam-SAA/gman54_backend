import AppError from "../errors/AppError";
import { Chat } from "../model/chat.modal";
import { Farm } from "../model/farm.model";
import catchAsync from "../utils/catchAsync";
import httpStatus from "http-status";
import sendResponse from "../utils/sendResponse";
import { io } from "../server";

export const createChat = catchAsync(async (req, res) => {
    const { farmId } = req.body;
    const farm = await Farm.findById(farmId);
    if (!farm) {
        throw new AppError(404, "Farm not found");
    }
    let chat = await Chat.findOne({ farm: farmId, user: req.user.id });
    if (!chat) {
        chat = await Chat.create({ name: farm.name, farm: farmId, user: req.user._id });
    }
    sendResponse(res, {
        statusCode: httpStatus.OK,
        message: "Chat created successfully",
        success: true,
        data: chat
    })

})

export const sendMessage = catchAsync(async (req, res) => {
    const { chatId, message } = req.body;
    const chat = await Chat.findById(chatId);
    if (!chat) {
        throw new AppError(404, "Chat not found");
    }
    const messages = {
        text: message,
        user: req.user._id,
    }
    chat.messages.push(messages);
    await chat.save();

    io.to(`chat_${chatId}`).emit( "newMassage",messages );

    sendResponse(res, {
        statusCode: httpStatus.OK,
        message: "Message sent successfully",
        success: true,
        data: chat
    })

})


export const getChatForUser = catchAsync(async (req, res) => {
    const user = req.user._id
    const chat = await Chat.find({ user: user });
    sendResponse(res, {
        statusCode: httpStatus.OK,
        message: "Chat retrieved successfully",
        success: true,
        data: chat
    })
})

