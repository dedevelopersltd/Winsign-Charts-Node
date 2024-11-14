const ApiError = require("../config/error");
const { User } = require("../database/models");

const createOTP = async (email) => {
  const user = await User.findOne({ where: { email } });
  if (!user) {
    throw new ApiError(403, "User not found");
  }
  const otp = Math.floor(1000 + Math.random() * 9000);
  user.otp = otp;
  await user.save();
  return otp;
};

const verifyOTP = async (email, otp) => {
  const recievedOTP = parseInt(otp);
  const user = await User.findOne({ where: { email } });
  const dbToken = parseInt(user.otpToken);
  if (!user) {
    throw new ApiError(403, "User not found");
  }
  if (dbToken !== recievedOTP) {
    throw new ApiError(403, "Invalid OTP");
  }

  return dbToken === recievedOTP;
};

module.exports = {
  createOTP,
  verifyOTP,
};
