const path = require("path");
const express = require("express");
const morgan = require("morgan");
const cors = require("cors");

const authRouter = require("./routes/authRoutes");
const contractRouter = require("./routes/contractRoutes");
const signatureRouter = require("./routes/signatureRoutes");
const imageRouter = require("./routes/imageRoutes");

const app = express();

app.set("trust proxy", true);

app.use(cors());
app.options("*", cors());

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/contracts", contractRouter);
app.use("/api/v1/signatures", signatureRouter);
app.use("/api/v1/images", imageRouter);

app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, "dist")));

app.get("*", (req, res) => {
  const indexPath = path.join(__dirname, "dist", "index.html");
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(404).json({
        status: "fail",
        message: `Can't find ${req.originalUrl} on this server!`,
      });
    }
  });
});

app.use((err, req, res, next) => {
  console.error("Server Error:", err);

  const statusCode = err.statusCode || 500;
  const status = err.status || "error";

  res.status(statusCode).json({
    status: status,
    message: err.message,
  });
});

module.exports = app;
