const express = require("express");
const config = require("./config");
const port = config.port;
const cors = require("cors");
const { sequelize, testConnection, syncDatabase } = require("./database");
const morgan = require("morgan");
const {
  authRouter,
  userRouter,
  chatRouter,
  streamlitRouter,
  attendanceRouter,
  overviewRouter,
  spacesRouter
} = require("./routes");
const path = require("path");
const snowflake = require("./snowflake");
//initializing express app
const app = express();
// initialize middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));
// Access-Control-Allow-Origin
app.use(cors({ origin: "*" }));

// main api route
app.get("/", (req, res) => {
  res.sendStatus(200);
});
// host images
app.use("/uploads", express.static(path.join(__dirname, "./uploads")));
// routes
app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/chat", chatRouter);
app.use("/api/streamlit", streamlitRouter);
app.use("/api/attendance", attendanceRouter);
app.use("/api/overview", overviewRouter);
app.use("/api/spaces", spacesRouter);

testConnection().then(() => {
  syncDatabase();
});
app.listen(port, () =>
  console.log(`app is listenin on http://localhost:${port}/`)
);
