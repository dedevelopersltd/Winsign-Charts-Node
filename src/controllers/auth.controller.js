const {
  UserService,
  TokenService,
  CryptoService,
  OTPService,
  EmailService,
} = require("../services");
const { createToken, verifyJwtToken } = TokenService;
const { createHashPassword, comparePassword } = CryptoService;
const { addUserToDB, deleteUserById, getUserByEmail, updateUserById } =
  UserService;
const { createOTP, verifyOTP } = OTPService;
const { sendOTP } = EmailService;

const { userValidator } = require("../config/types");
const ApiError = require("../config/error");
const register = async (req, res) => {
  try {
    const { firstName, lastName, customerId, email, password, phone } =
      req.body;
    const { error } = userValidator(req.body);
    if (error) {
      console.log(error);
      return res.status(400).send({ message: error.details[0].message });
    }
    const user = await getUserByEmail(email);
    if (user) {
      return res.status(401).send({ message: error.details[0].message });
    }
    const hashedPassword = createHashPassword(password);
    const newUser = await addUserToDB({
      firstName,
      lastName,
      customerId,
      email,
      phone,
      password: hashedPassword,
    });
    res.status(201).send({ user: newUser });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      throw new ApiError(400, "Email and password are required");
    }
    const user = await getUserByEmail(email);
    if (!user) {
      throw new ApiError(401, "Invalid email or password");
    }
    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      throw new ApiError(401, "Invalid email or password");
    }
    const token = createToken(user);
    res.status(200).send({
      user: {
        id: user.id,
        name: user.name,
        email,
        firstname:user.firstName,
        lastname:user.lastName,
        customerId:user.customerId,
        phone_no:user.phone,
        avatar: user.avatar,
        isAdmin: user.isAdmin,
        isActive: user.isActive,
      },
      token,
    });
  } catch (error) {
    res.status(error.status).send({ message: error.message });
  }
};
const forgot = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await getUserByEmail(email);
    if (!user) {
      throw new ApiError(401, "Invalid email");
    }
    const otp = await createOTP(email);
    const updateUser = await updateUserById(user.id, { otpToken: otp });
    await sendOTP(email, otp);
    res.status(200).send({ message: "OTP sent" });
  } catch (error) {
    res
      .status(error.status ? error.status : 500)
      .send({ message: error.message });
  }
};
const reset = async (req, res) => {
  try {
    const { email, otp, password } = req.body;
    const user = await getUserByEmail(email);
    if (!user) {
      throw new ApiError(401, "Invalid email");
    }
    const isMatch = await verifyOTP(email, otp);
    console.log(isMatch, "Match");
    if (!isMatch) {
      throw new ApiError(401, "Invalid OTP");
    }
    const hashedPassword = createHashPassword(password);
    const updateUser = await updateUserById(user.id, {
      password: hashedPassword,
      otpToken: null,
    });
    res.status(200).send({ message: "Password reset successfully" });
  } catch (error) {
    res
      .status(error.status ? error.status : 500)
      .send({ message: error.message });
  }
};
module.exports = {
  register,
  login,
  forgot,
  reset,
};
