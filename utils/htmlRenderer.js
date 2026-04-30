const fs = require("fs");
const path = require("path");

const INDEX_PATH = path.join(__dirname, "..", "dist", "index.html");

const escape = (s) =>
  String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const buildMetaTags = ({ title, description, url, image }) => {
  const t = escape(title);
  const d = escape(description);
  const u = escape(url);
  const i = escape(image);
  return [
    `<meta name="description" content="${d}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:title" content="${t}">`,
    `<meta property="og:description" content="${d}">`,
    `<meta property="og:url" content="${u}">`,
    `<meta property="og:image" content="${i}">`,
    `<meta property="og:site_name" content="שק&quot;ל - חתימות דיגיטליות">`,
    `<meta property="og:locale" content="he_IL">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${t}">`,
    `<meta name="twitter:description" content="${d}">`,
    `<meta name="twitter:image" content="${i}">`,
  ].join("\n    ");
};

exports.renderIndexHtml = (meta) => {
  let html = fs.readFileSync(INDEX_PATH, "utf-8");
  html = html.replace(
    /<title>[^<]*<\/title>/,
    `<title>${escape(meta.title)}</title>`
  );
  const tags = buildMetaTags(meta);
  html = html.replace("</head>", `    ${tags}\n  </head>`);
  return html;
};
