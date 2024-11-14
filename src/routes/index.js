const authRouter = require("./auth.routes");
const userRouter = require("./user.routes");
const chatRouter = require("./chat.routes");
const streamlitRouter = require("./streamlit.routes");
const attendanceRouter = require("./attendance.routes");
const overviewRouter = require("./overview.routes");
const spacesRouter = require("./spaces.routes")
module.exports = {
  authRouter,
  userRouter,
  chatRouter,
  streamlitRouter,
  attendanceRouter,
  overviewRouter,
  spacesRouter
};
