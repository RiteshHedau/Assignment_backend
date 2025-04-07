const ApiError = require("../utils/ApiError.js");
const User = require("../models/user.model.js");
const { sequelize } = require("./../dbConfig/dbConnection.js");
const  uploadOnCloudinary  = require("../utils/cloudinary.js");
const ApiResponse = require("./../utils/ApiResponse.js");
const jwt = require("jsonwebtoken");
const { sendEmail } = require("./../utils/sendEmail.js");

const generateAccessAndRefereshTokens = async (userId) => {
  try {
    // ✅ Sequelize equivalent of findById
    const user = await User.findByPk(userId);

    if (!user) {
      throw new Error("User not found");
    }

    // ✅ Use instance methods we defined earlier
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    // ✅ Update refresh token
    user.refreshToken = refreshToken;

    // ✅ Save changes (Sequelize doesn't need validateBeforeSave: false)
    await user.save();

    return { accessToken, refreshToken };
  } catch (error) {
    console.error(error);
    throw new ApiError(
      500,
      "Something went wrong while generating refresh and access token"
    );
  }
};

const registerUser = async (req, res) => {
  try {
    const { name, email, password,role } = req.body;

    // 🧪 Basic validation
    if ([name, email, password].some((field) => !field?.trim())) {
      throw new ApiError(400, "All fields are required");
    }

    // 🔍 Check if user already exists by email only
    const existedUser = await User.findOne({
      where: { email },
    });

    if (existedUser) {
      throw new ApiError(409, "User with this email already exists");
    }

    // ✅ Create user
    const user = await User.create({
      name,
      email,
      password,
      role
    });

    // 🧼 Clean response
    const userResponse = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    return res
      .status(201)
      .json(new ApiResponse(201, userResponse, "User registered successfully"));
  } catch (error) {
    throw new ApiError(
      500,
      error?.message || "Something went wrong while registering the user"
    );
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("Login request body:", req.body);
    if (!email || !password) {
      throw new ApiError(400, "Email and password are required");
    }

    // 🔍 Find user by email
    const user = await User.findOne({
      where: sequelize.where(
        sequelize.fn("lower", sequelize.col("email")),
        email.toLowerCase()
      ),
    });

    if (!user) {
      throw new ApiError(404, "User does not exist");
    }

    // 🔒 Compare password
    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
      throw new ApiError(401, "Invalid email or password");
    }

    // 🔑 Generate tokens
    const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(
      user.id
    );

    // 📝 Store refreshToken in DB
    user.refreshToken = refreshToken;
    await user.save({ validate: false });

    // 🧹 Clean user data
    const userResponse = {
      id: user.id,
      name: user.name,
      email: user.email,
      profilePic: user.profilePic,
      role: user.role,
      createdAt: user.created_at,
    };

    // 🍪 Set cookies
    const options = {
      httpOnly: true,
      secure: true, // set to true in production
      //sameSite: "Strict",
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          200,
          {
            user: userResponse,
            accessToken,
            refreshToken,
          },
          "User logged in successfully"
        )
      );
  } catch (error) {
    console.error(error);
    throw new ApiError(
      500,
      error?.message || "Something went wrong while logging in"
    );
  }
};

const logoutUser = async (req, res) => {
  try {
    // Get user ID from the authenticated request
    const userId = req.user.id;

    // Find the user
    const user = await User.findByPk(userId);

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    // Unset the refreshToken field (set to null)
    user.refreshToken = null;
    await user.save({ validate: false });

    // Clear cookies
    const options = {
      httpOnly: true,
      secure: true, // enable in production
    };

    return res
      .status(200)
      .clearCookie("accessToken", options)
      .clearCookie("refreshToken", options)
      .json(new ApiResponse(200, {}, "User logged out"));
  } catch (error) {
    console.error("Logout error:", error);
    throw new ApiError(500, "Something went wrong during logout");
  }
};

const refreshAccessToken = async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized request");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findByPk(decodedToken?.id); // ✅ Sequelize version

    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }

    if (incomingRefreshToken !== user.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or already used");
    }

    const options = {
      httpOnly: true,
      secure: true, // Set to true in production
    };

    // 🔄 Generate new tokens
    const accessToken = user.generateAccessToken();
    const newRefreshToken = user.generateRefreshToken();

    // 💾 Save new refreshToken in DB
    user.refreshToken = newRefreshToken;
    await user.save({ validate: false });

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access token refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
};

const updateUser = async (req, res) => {
  try {
    const { name, email, role } = req.body;
    const userId = req.user.id; // Get user ID from the authenticated request

    console.log("file you will get", req.file);

    const profilePicLocalPath = req.file?.path;

    let profilePicUrl;
    if (profilePicLocalPath) {
      const uploadResponse = await uploadOnCloudinary(profilePicLocalPath);
      profilePicUrl = uploadResponse.url;
    }

    // 🔍 Find user by ID
    const user = await User.findByPk(userId);

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    // Update user details
    user.name = name;
    user.email = email;
    user.profilePic = profilePicUrl || user.profilePic; // Update if new URL is available
    user.role = role;

    await user.save({ validate: false });

    // 🧼 Clean response
    const userResponse = {
      id: user.id,
      name: user.name,
      email: user.email,
      profilePic: user.profilePic,
      role: user.role,
      createdAt: user.created_at,
    };

    return res
      .status(200)
      .json(new ApiResponse(200, userResponse, "User updated successfully"));
  } catch (error) {
    throw new ApiError(
      500,
      error?.message || "Something went wrong while updating the user"
    );
  }
};

const forgetPassword = async (req, res) => {
  const { email } = req.body;
  console.log("forget email", email);
  try {
    if (!email) {
      throw new ApiError(400, "Email is required");
    }

    const user = await User.findOne({ where: { email } });

    if (!user) {
      throw new ApiError(404, "User not found with this email");
    }

    // Create a reset token (JWT or random string)
    const resetToken = jwt.sign(
      { id: user.id },
      process.env.FORGOT_PASSWORD_SECRET,
      { expiresIn: "15m" }
    );

    // Optional: Save token & expiry in DB
    user.passwordResetToken = resetToken;

    await user.save();

    // Create reset link
    const resetURL = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    // Send email (assuming you have sendEmail util)
    await sendEmail({
      to: user.email,
      subject: "Password Reset Request",
      html: `<p>Hello ${user.name},</p>
                 <p>Click <a href="${resetURL}">here</a> to reset your password. This link will expire in 15 minutes.</p>`,
    });

    res.user = user;

    return res
      .status(200)
      .json(new ApiResponse(200, user, "Password reset link sent to email"));
  } catch (error) {
    console.error("Forget Password Error:", error);
    throw new ApiError(500, error?.message || "Something went wrong");
  }
};

const getAllUsers=async(req,res)=>{
    try {
        const users = await User.findAll({
        attributes: ['id', 'name', 'email', 'profilePic', 'role', 'created_at'],
        });
    
        return res.status(200).json(new ApiResponse(200, users, "Users fetched successfully"));
    } catch (error) {
        throw new ApiError(500, error?.message || "Something went wrong while fetching users");
    }
}

const getUser=async(req,res)=>{
  try {
      // Assuming you're passing the user ID in the URL
      
      const user = await User.findByPk(req.user.id, {
          attributes: ['id', 'name', 'email', 'profilePic', 'role', 'created_at'],
      });
  
      if (!user) {
          return res.status(404).json(new ApiResponse(404, {}, "User not found"));
      }
  
      return res.status(200).json(new ApiResponse(200, user, "User fetched successfully"));
  } catch (error) {
      throw new ApiError(500, error?.message || "Something went wrong while fetching the user");
  }
}

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  updateUser,
  forgetPassword,
  getAllUsers,
  getUser
};
