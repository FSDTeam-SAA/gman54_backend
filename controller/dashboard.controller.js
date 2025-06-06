import { Farm } from "../model/farm.model.js";
import { Order } from "../model/order.model.js";
import { paymentInfo } from "../model/payment.model.js";
import { User } from "../model/user.model.js";
import catchAsync from "../utils/catchAsync.js";
import sendResponse from "../utils/sendResponse.js";


export const getAdminDashboard = catchAsync(async (req, res) => {
  // 1. Total Revenue (admin share from paid orders = 4.99%)
  const paidOrders = await Order.find({ paymentStatus: "paid" });
  const totalRevenue = paidOrders.reduce(
    (sum, order) => sum + order.totalPrice * 0.0499,
    0
  );

  // 2. Approved Seller (Farm) Count
  const totalSeller = await Farm.countDocuments({ status: "approved" });

  // 3. Total Users with role 'user'
  const totalUser = await User.countDocuments({ role: "user" });

  // 4. Total Donations (sum of donation amounts)
  const donationAgg = await paymentInfo.aggregate([
    { $match: { type: "donation" } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);
  const totalDonation = donationAgg[0]?.total || 0;

  // 5. Revenue Report (last 2 months day-wise)
  const revenueReport = await Order.aggregate([
    {
      $match: {
        paymentStatus: "paid",
        date: {
          $gte: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1),
        },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: "$date" },
          month: { $month: "$date" },
          day: { $dayOfMonth: "$date" },
        },
        total: {
          $sum: { $multiply: ["$totalPrice", 0.0499] }, // Admin's revenue
        },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
  ]);

  // 6. Yearly Donation Report by Month (this year & last year)
  const now = new Date();
  const currentYear = now.getFullYear();
  const lastYear = currentYear - 1;

  const donations = await paymentInfo.aggregate([
    {
      $match: {
        type: "donation",
        createdAt: {
          $gte: new Date(lastYear, 0, 1),
          $lte: new Date(currentYear, 11, 31, 23, 59, 59),
        },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
        },
        total: { $sum: "$amount" },
      },
    },
  ]);

  const donationReport = Array.from({ length: 12 }, (_, i) => {
    const thisYearData = donations.find(d => d._id.year === currentYear && d._id.month === i + 1);
    const lastYearData = donations.find(d => d._id.year === lastYear && d._id.month === i + 1);
    return {
      month: i + 1,
      thisYear: thisYearData?.total || 0,
      lastYear: lastYearData?.total || 0,
    };
  });

  // 7. Final Response
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Dashboard stats fetched successfully",
    data: {
      totalDonation,
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      totalSeller,
      totalUser,
      donationReport,
      revenueReport,
    },
  });
});
