const { UserService } = require("../services");
const { createHashPassword } = require("../services/crypto.service");
const {updateUserById} = UserService

const changeProfile = async (req, res) => {
  try {
    console.log(req.body)
    const image = req.file;
    console.log(image)
    const userId = req.user.id;
    await updateUserById(userId, { avatar: image.filename });
    res.status(200).json({filename: image.filename});
  } catch (error) {
    res.status(500).json({ message: "Unable to change Profile" });
  }
};

const updateProfile = async (req, res) => {
  try {
    const data = req.body;
    const userId = req.user.id;
    await updateUserById(userId, data);
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: "Unable to update Profile" });
  }
};
const updateUserPassword = async (req, res) => {
  try {
    const {password} = req.body;
    const userId = req.user.id;
    const hashedPassword = createHashPassword(password);
    console.log(userId,hashedPassword)
    await updateUserById(userId, { password: hashedPassword });
    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Unable to update Profile" });
  }
};

module.exports = {
  changeProfile,
  updateProfile,
  updateUserPassword
};
