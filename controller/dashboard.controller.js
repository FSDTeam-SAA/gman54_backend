import { Farm } from "../model/farm.model.js";
import { Order } from "../model/order.model.js";
import { paymentInfo } from "../model/payment.model.js";
import { User } from "../model/user.model.js";
import catchAsync from "../utils/catchAsync.js";
import sendResponse from "../utils/sendResponse.js";


export const getAdminDashboard = catchAsync(async (req, res) => {
  const { range = "month" } = req.query;


  // 1. Total Revenue
  const paidOrders = await Order.find({ paymentStatus: "paid" });
  const totalRevenue = paidOrders.reduce(
    (sum, order) => sum + order.totalPrice * 0.0499,
    0
  );

  // 2. Approved Sellers
  const totalSeller = await Farm.countDocuments({ status: "approved" });

  // 3. Users with role 'user'
  const totalUser = await User.countDocuments({ role: "user" });

  // 4. Total Donations
  const donationAgg = await paymentInfo.aggregate([
    { $match: { type: "donation" } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);
  const totalDonation = donationAgg[0]?.total || 0;

 const donationReport = [];
const revenueReport = [];

const now = new Date();
let startDate;

switch (range) {
  case "week":
    startDate = new Date(now);
    startDate.setDate(now.getDate() - 6);
    break;
  case "year":
    startDate = new Date(now.getFullYear(), 0, 1);
    break;
  case "month":
  default:
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    break;
}

// =========================
// 1. DONATION REPORT
// =========================

if (range === "month") {
  const year = now.getFullYear();

  const donations = await paymentInfo.aggregate([
    {
      $match: {
        type: "donation",
        paymentStatus: "complete",
        createdAt: {
          $gte: new Date(year, 0, 1),
          $lte: new Date(year, 11, 31, 23, 59, 59),
        },
      },
    },
    {
      $group: {
        _id: { month: { $month: "$createdAt" } },
        total: { $sum: "$price" },
      },
    },
  ]);
  // console.log( 1, new Date(year, 11, 31, 23, 59, 59));

  const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  for (let i = 1; i <= 12; i++) {
    const match = donations.find(d => d._id.month === i);
    donationReport.push({
      label: monthLabels[i - 1],
      total: match?.total || 0,
    });
  }
} else if (range === "week") {
  const donations = await paymentInfo.aggregate([
    {
      $match: {
        type: "donation",
        paymentStatus: "complete",
        createdAt: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
          day: { $dayOfMonth: "$createdAt" },
        },
        total: { $sum: "$price" },
      },
    },
  ]);

  for (let i = 0; i < 7; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const label = date.toISOString().split("T")[0]; // YYYY-MM-DD
    const match = donations.find(
      d =>
        d._id.year === date.getFullYear() &&
        d._id.month === date.getMonth() + 1 &&
        d._id.day === date.getDate()
    );

    donationReport.push({ label, total: match?.total || 0 });
  }
} else if (range === "year") {
  const startYear = now.getFullYear() - 4;

  const donations = await paymentInfo.aggregate([
    {
      $match: {
        type: "donation",
        paymentStatus: "complete",
        createdAt: { $gte: new Date(startYear, 0, 1) },
      },
    },
    {
      $group: {
        _id: { year: { $year: "$createdAt" } },
        total: { $sum: "$price" },
      },
    },
  ]);

  for (let y = startYear; y <= now.getFullYear(); y++) {
    const match = donations.find(d => d._id.year === y);
    donationReport.push({ label: y.toString(), total: match?.total || 0 });
  }
}

// =========================
// 2. REVENUE REPORT (ADMIN 4.99%)
// =========================

if (range === "month") {
  const year = now.getFullYear();

  const revenue = await Order.aggregate([
    {
      $match: {
        paymentStatus: "paid",
        date: {
          $gte: new Date(year, 0, 1),
          $lte: new Date(year, 11, 31, 23, 59, 59),
        },
      },
    },
    {
      $group: {
        _id: { month: { $month: "$date" } },
        total: { $sum: { $multiply: ["$totalPrice", 0.0499] } },
      },
    },
  ]);

  const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  for (let i = 1; i <= 12; i++) {
    const match = revenue.find(r => r._id.month === i);
    revenueReport.push({
      label: monthLabels[i - 1],
      total: match?.total || 0,
    });
  }
}
 else if (range === "week") {
  const revenue = await Order.aggregate([
    {
      $match: {
        paymentStatus: "paid",
        date: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: "$date" },
          month: { $month: "$date" },
          day: { $dayOfMonth: "$date" },
        },
        total: { $sum: { $multiply: ["$totalPrice", 0.0499] } },
      },
    },
  ]);

  for (let i = 0; i < 7; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const label = date.toISOString().split("T")[0];

    const match = revenue.find(
      r =>
        r._id.year === date.getFullYear() &&
        r._id.month === date.getMonth() + 1 &&
        r._id.day === date.getDate()
    );

    revenueReport.push({ label, total: match?.total || 0 });
  }
} else if (range === "year") {
  const startYear = now.getFullYear() - 4;

  const revenue = await Order.aggregate([
    {
      $match: {
        paymentStatus: "paid",
        date: { $gte: new Date(startYear, 0, 1) },
      },
    },
    {
      $group: {
        _id: { year: { $year: "$date" } },
        total: { $sum: { $multiply: ["$totalPrice", 0.0499] } },
      },
    },
  ]);

  for (let y = startYear; y <= now.getFullYear(); y++) {
    const match = revenue.find(r => r._id.year === y);
    revenueReport.push({ label: y.toString(), total: match?.total || 0 });
  }
}


  // 7. Send Response
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


export const AllDonation = catchAsync( async (req, res) =>{
  const allDonation = await paymentInfo.find({paymentStatus: "complete", type: "donation"}).populate("userId","name email avater");

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "All donation fetched successfully",
    data: allDonation
    });
})