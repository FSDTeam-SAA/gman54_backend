import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
    review: [{
        text: String,
        rating: Number,
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        }
    }
    ],
}, {
    timestamps: true,
});

export const Review = mongoose.model("Review", reviewSchema);
