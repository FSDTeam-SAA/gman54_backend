import catchAsync from "../utils/catchAsync.js";
import sendResponse from "../utils/sendResponse.js";
import AppError from "../errors/AppError.js";
import httpStatus from "http-status";
import { User } from "./../model/user.model.js";
import { Farm } from "../model/farm.model.js";
import { Category } from "./../model/category.model.js";
import { Product } from "./../model/product.model.js";
import { Blog } from "./../model/blog.model.js";
import { uploadOnCloudinary } from "./../utils/commonMethod.js";
import { Ads } from "../model/ads.model.js";

// Overview
export const getAdminOverview = catchAsync(async (req, res) => {
  const totalSellers = await User.countDocuments({ role: "seller" });
  const totalUsers = await User.countDocuments();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    data: { totalSellers, totalUsers },
  });
});

// Categories List
export const getCategoriesList = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5;
  const skip = (page - 1) * limit;

  const categories = await Category.find()
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });
  const total = await Category.countDocuments();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    data: {
      categories,
      pagination: { total, page, limit, totalPage: Math.ceil(total / limit) },
    },
  });
});

// Add Category
export const addCategory = catchAsync(async (req, res) => {
  const { name, description } = req.body;

  if (!name || !description) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Please provide name and description"
    );
  }

  const category = await Category.create({ name, description });

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Category added successfully",
    data: category,
  });
});

// Update Category
export const updateCategory = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;

  if (!name || !description) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Please provide name and description"
    );
  }

  const category = await Category.findByIdAndUpdate(
    id,
    { name, description },
    { new: true, runValidators: true }
  );

  if (!category) {
    throw new AppError(httpStatus.NOT_FOUND, "Category not found");
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Category updated successfully",
    data: category,
  });
});

// Delete Category
export const deleteCategory = catchAsync(async (req, res) => {
  const { id } = req.params;
  const category = await Category.findByIdAndDelete(id);
  if (!category) {
    throw new AppError(httpStatus.NOT_FOUND, "Category not found");
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Category deleted successfully",
  });
});

// Request Product
export const getRequestProducts = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5;
  const skip = (page - 1) * limit;

  const products = await Product.find({ status: "pending" })
    .populate("category", "name")
    .populate("farm")
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });
  const total = await Product.countDocuments();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    data: {
      products,
      pagination: { total, page, limit, totalPage: Math.ceil(total / limit) },
    },
  });
});

// Approve Product Request
export const approveProductRequest = catchAsync(async (req, res) => {
  const { productId } = req.params;
  const product = await Product.findByIdAndUpdate(
    productId,
    { status: "active" },
    { new: true, runValidators: true }
  );
  if (!product) {
    throw new AppError(httpStatus.NOT_FOUND, "Product not found");
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Product request approved successfully",
    data: product,
  });
});

// Delete Product Request
export const deleteProductRequest = catchAsync(async (req, res) => {
  const { productId } = req.params;
  const product = await Product.findByIdAndDelete(productId);
  if (!product) {
    throw new AppError(httpStatus.NOT_FOUND, "Product not found");
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Product request deleted successfully",
  });
});

// Upload Banner Ads
export const uploadBannerAds = catchAsync(async (req, res) => {
  if (!req.files || req.files.length === 0) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Please upload at least one banner"
    );
  }

  const banners = await Promise.all(
    req.files.map(async (file) => {
      const result = await uploadOnCloudinary(file.buffer, {
        resource_type: "image",
        folder: "banners",
      });
      let ban = await Ads.create({ thumbnail: { public_id: result.public_id, url: result.secure_url } })
      return ban
    })
  );



  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Banners uploaded successfully",
    data: banners,
  });
});

export const updateAds = catchAsync(async (req, res) => {
  const { id } = req.params;

  const banners = await Promise.all(
    req.files.map(async (file) => {
      const result = await uploadOnCloudinary(file.buffer, {
        resource_type: "image",
        folder: "banners",
      });
      let ban = await Ads.findByIdAndUpdate(id,{ thumbnail: { public_id: result.public_id, url: result.secure_url } },{new: true})
      return ban
    })
  );



  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Banners uploaded successfully",
    data: banners,
  });
})

export const getBannerAds = catchAsync(async (req, res) => {
  const banner = await Ads.find()
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Banners retrieved successfully",
    data: banner,
  });
})

export const deleteBannerAds = catchAsync(async (req, res) => {
  const banner = await Ads.findById(req.params.id)
  if (!banner) {
    throw new AppError(httpStatus.NOT_FOUND, "Banner not found")
  }
  await Ads.findByIdAndDelete( req.params.id)
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Banner deleted successfully",
    data: ""
  });
})



// Blog Management List
export const getBlogList = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5;
  const skip = (page - 1) * limit;

  const blogs = await Blog.find()
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });
  const total = await Blog.countDocuments();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    data: {
      blogs,
      pagination: { total, page, limit, totalPage: Math.ceil(total / limit) },
    },
  });
});

// Add Blog
export const addBlog = catchAsync(async (req, res) => {
  const { blogName, description } = req.body;

  if (!blogName || !description) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Please provide blog name and description"
    );
  }

  let thumbnail = null;
  if (req.file) {
    const result = await uploadOnCloudinary(req.file.buffer, {
      resource_type: "image",
      folder: "blogs",
    });
    thumbnail = { public_id: result.public_id, url: result.secure_url };
  }

  const blog = await Blog.create({ blogName, description, thumbnail });

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Blog added successfully",
    data: blog,
  });
});

// Update Blog
export const updateBlog = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { blogName, description } = req.body;

  if (!blogName || !description) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Please provide blog name and description"
    );
  }

  const updateData = { blogName, description };

  if (req.file) {
    const result = await uploadOnCloudinary(req.file.buffer, {
      resource_type: "image",
      folder: "blogs",
    });
    updateData.thumbnail = {
      public_id: result.public_id,
      url: result.secure_url,
    };
  }

  const blog = await Blog.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });

  if (!blog) {
    throw new AppError(httpStatus.NOT_FOUND, "Blog not found");
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Blog updated successfully",
    data: blog,
  });
});

export const getSingleBlog = catchAsync(async (req, res) => {
  const { id } = req.params;
  const blog = await Blog.findById(id)
  if (!blog) {
    throw new AppError(httpStatus.NOT_FOUND, "Blog not found");
  }
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Blog found successfully",
    data: blog,
  });
})

// Delete Blog
export const deleteBlog = catchAsync(async (req, res) => {
  const { id } = req.params;
  const blog = await Blog.findByIdAndDelete(id);
  if (!blog) {
    throw new AppError(httpStatus.NOT_FOUND, "Blog not found");
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Blog deleted successfully",
  });
});

// Seller Profile List
export const getSellerProfiles = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5;
  const skip = (page - 1) * limit;

  const sellers = await User.find({ role: "seller" })
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });
  const total = await User.countDocuments({ role: "seller" });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    data: { sellers, total, page, limit },
  });
});

// Get specific Seller Profile
export const getSellerProfile = catchAsync(async (req, res) => {
  const { sellerId } = req.params;
  const seller = await User.findById(sellerId);

  if (!seller || seller.role !== "seller") {
    throw new AppError(httpStatus.NOT_FOUND, "Seller not found");
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    data: seller,
  });
});


export const deleteSeller = catchAsync(async (req, res) => {
  const { sellerId } = req.params;

  // Find the seller
  const seller = await User.findById(sellerId);
  if (!seller || seller.role !== "seller") {
    throw new AppError(httpStatus.NOT_FOUND, "Seller not found");
  }

  // Find and delete the farm(s) associated with the seller
  const farms = await Farm.find({ seller: seller._id });
  const farmIds = farms.map(farm => farm._id);

  await Farm.deleteMany({ seller: seller._id });

  // Delete all products associated with the farm(s)
  await Product.deleteMany({ farm: { $in: farmIds } });

  // Delete the seller account
  await User.findByIdAndDelete(sellerId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Seller, their farm(s), and associated products deleted successfully",
  });
});


export const deleteUser = catchAsync(async (req, res) => {
  const { userId } = req.params;

  // Find the seller
  const seller = await User.findById(userId);


  // Delete the seller account
  await User.findByIdAndDelete(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "user deleted successfully",
  });
});

// Seller Profile Request
export const getSellerProfileRequests = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5;
  const skip = (page - 1) * limit;

  // Fetch all farm requests with status "pending", regardless of user role
  const sellerRequests = await Farm.find({ status: "pending" })
    .skip(skip)
    .limit(limit)
    .populate("seller")
    .sort({ createdAt: -1 });

  const total = await Farm.countDocuments({ status: "pending" });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    data: {
      sellerRequests,
      pagination: { total, page, limit, totalPage: Math.ceil(total / limit) },
    },
  });
});

// Get specific Seller Profile Request
export const getSpecificSellerProfileRequest = catchAsync(async (req, res) => {
  const { requestId } = req.params;
  const farm = await Farm.findById(requestId).populate("seller");
  if (!farm || farm.status !== "pending") {
    throw new AppError(httpStatus.NOT_FOUND, "Seller request not found");
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    data: farm,
  });
});

// Approve Seller Request
export const approveSellerRequest = catchAsync(async (req, res) => {
  const { requestId } = req.params;
  const farm = await Farm.findById(requestId).populate("seller");
  if (!farm) {
    throw new AppError(httpStatus.NOT_FOUND, "Seller request not found");
  }

  if (farm.status !== "pending") {
    throw new AppError(httpStatus.BAD_REQUEST, "Seller request is not pending");
  }

  farm.status = "approved";

  if (farm.seller.role !== "seller") {
    farm.seller.role = "seller";
    await farm.seller.save();
  }
  await farm.save();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Seller request approved successfully",
    data: { farm },
  });
});

// Delete Seller Request
export const deleteSellerRequest = catchAsync(async (req, res) => {
  const { requestId } = req.params;
  const farm = await Farm.findByIdAndDelete(requestId);
  if (!farm) {
    throw new AppError(httpStatus.NOT_FOUND, "Seller request not found");
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Seller request deleted successfully",
    data: "",
  });
});