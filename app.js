const path = require("path");
const express = require("express");
const morgan = require("morgan");
const cors = require("cors");

const authRouter = require("./routes/authRoutes");
const contractRouter = require("./routes/contractRoutes");
const signatureRouter = require("./routes/signatureRoutes");
const imageRouter = require("./routes/imageRoutes");
const catalogRouter = require("./routes/catalogRoutes");

const Contract = require("./models/contractModel");
const { renderIndexHtml } = require("./utils/htmlRenderer");

const DEFAULT_META = {
  title: "שק\"ל - חתימות דיגיטליות",
  description:
    "מערכת חתימות דיגיטליות של עמותת שק\"ל - ניהול הצעות מחיר וחוזים מקוונים",
};

const buildBaseUrl = (req) => `${req.protocol}://${req.get("host")}`;
const buildLogoUrl = (req) => `${buildBaseUrl(req)}/shekel-logo.png`;

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
app.use("/api/v1/catalog", catalogRouter);

app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, "dist"), { index: false }));

app.get("/sign/:token", async (req, res, next) => {
  try {
    const contract = await Contract.findOne({
      shareToken: req.params.token,
      status: "published",
    }).select("title recipient");

    let title;
    let description;
    if (contract) {
      const recipientPart = contract.recipient
        ? ` עבור ${contract.recipient}`
        : "";
      title = `${contract.title || "חוזה"}${recipientPart}`;
      description = `הצעת מחיר${recipientPart} - לחץ כדי לסקור את החוזה ולחתום דיגיטלית`;
    } else {
      title = "קישור לחתימה דיגיטלית - שק\"ל";
      description =
        "קישור לחתימה דיגיטלית. אם הקישור פג תוקף, פנה לשולח החוזה.";
    }

    const html = renderIndexHtml({
      title,
      description,
      url: `${buildBaseUrl(req)}/sign/${req.params.token}`,
      image: buildLogoUrl(req),
    });
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(html);
  } catch (err) {
    next(err);
  }
});

app.get("*", (req, res) => {
  const html = renderIndexHtml({
    title: DEFAULT_META.title,
    description: DEFAULT_META.description,
    url: `${buildBaseUrl(req)}${req.originalUrl}`,
    image: buildLogoUrl(req),
  });
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(html);
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
