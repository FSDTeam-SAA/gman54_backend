import AppError from "../errors/AppError.js";
import { Cart } from "../model/cart.model.js";
import { Product } from "../model/product.model.js";
import catchAsync from "../utils/catchAsync.js";
import sendResponse from "../utils/sendResponse.js";
import httpStatus from "http-status";


// GET /api/cart - Get user's cart
export const getCart = catchAsync(async (req, res) => {

    const cart = await Cart.findOne({ customer: req.user._id }).populate("items.product items.farm");

    if (!cart){
        throw new AppError( 404,"Cart not found");
    }

    sendResponse(res,{
        statusCode: httpStatus.OK,
        message: "Cart retrieved successfully",
        success: true,
        data: cart
    })

})

// POST /api/cart/add - Add or update product in cart
export const addToCart = catchAsync(async (req, res) => {
    const { productId, quantity } = req.body;

    if (!productId || quantity < 1) {
      throw new AppError(404, " Product ID or quantity is required");
    }

    const product = await Product.findById(productId);
    if (!product) {
        throw new AppError(404, " Product not found");
    }

    let cart = await Cart.findOne({ customer: req.user._id });

    const price = product.price; // store at time of adding

    if (!cart) {
      cart = new Cart({
        customer: req.user._id,
        items: [{ product: product._id, quantity, price,farm: product.farm }],
        total: price * quantity,
      });
    } else {
      const existingItem = cart.items.find(item => item.product.toString() === productId);

      if (existingItem) {
        existingItem.quantity += quantity;
        existingItem.price = price; // update to latest price
      } else {
        cart.items.push({ product: product._id, quantity, price, farm: product.farm });
      }

      cart.total = cart.items.reduce((sum, item) => sum + item.quantity * item.price, 0);
    }

    await cart.save();
    const populatedCart = await Cart.findById(cart._id)
        sendResponse(res,{
        statusCode: httpStatus.OK,
        message: " Product added to cart successfully",
        success: true,
        data: populatedCart
    })
})

// PUT /api/cart/update - Update quantity of an item
export const updateCartItem = catchAsync(async (req, res) => {

    const { productId, quantity } = req.body;

    const cart = await Cart.findOne({ customer: req.user._id });
    if (!cart){
        throw new AppError(404, "Cart not found");
    }

    const item = cart.items.find(item => item.product.toString() === productId);
    if (!item){
        throw new AppError(404, "Item not found");
    }

    if (quantity <= 0) {
      cart.items = cart.items.filter(item => item.product.toString() !== productId);
    } else {
      item.quantity = quantity;
    }

    cart.total = cart.items.reduce((sum, item) => sum + item.quantity * item.price, 0);

    await cart.save();
    const updatedCart = await Cart.findById(cart._id)
        sendResponse(res,{
        statusCode: httpStatus.OK,
        message: " Cart item updated successfully",
        success: true,
        data: updatedCart
    })
})

// DELETE /api/cart/remove/:productId - Remove product from cart
export const removeCartItem = catchAsync(async (req, res) => {
    const { productId } = req.params;

    const cart = await Cart.findOne({ customer: req.user._id });
    if (!cart){
        throw new AppError(404, "Cart not found");
    }

    cart.items = cart.items.filter(item => item.product.toString() !== productId);
    cart.total = cart.items.reduce((sum, item) => sum + item.quantity * item.price, 0);

    await cart.save();
    const updatedCart = await Cart.findById(cart._id).populate("items.product");
        sendResponse(res,{
        statusCode: httpStatus.OK,
        message: " Product removed from cart successfully",
        success: true,
        data: updatedCart
    })
})

// DELETE /api/cart/clear - Clear entire cart
export const clearCart = catchAsync(async (req, res) => {

    const cart = await Cart.findOne({ customer: req.user._id });
    if (!cart){
        throw new AppError(404, "Cart not found");
    }

    cart.items = [];
    cart.total = 0;

    await cart.save();
        sendResponse(res,{
        statusCode: httpStatus.OK,
        message: " Cart cleared successfully",
        success: true,
        data: " "
    })

})
