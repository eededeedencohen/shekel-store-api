const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });
process.env.PORT = "5099";

const http = require("http");
const mongoose = require("mongoose");
const app = require("../app");

const DB = process.env.DATABASE.replace(
  "<PASSWORD>",
  process.env.DATABASE_PASSWORD
);

const request = (method, path, body, headers = {}) =>
  new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : "";
    const req = http.request(
      {
        hostname: "127.0.0.1",
        port: 5099,
        path,
        method,
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(data),
          ...headers,
        },
      },
      (res) => {
        let buf = "";
        res.on("data", (c) => (buf += c));
        res.on("end", () => resolve({ status: res.statusCode, body: buf }));
      }
    );
    req.on("error", reject);
    if (data) req.write(data);
    req.end();
  });

(async () => {
  await mongoose.connect(DB);
  const server = app.listen(5099);
  await new Promise((r) => setTimeout(r, 400));

  try {
    console.log("-- LOGIN --");
    const login = await request("POST", "/api/v1/auth/login", {
      username: "eyal",
      password: "shekel2026",
    });
    console.log(login.status, login.body.slice(0, 120));
    const token = JSON.parse(login.body).token;
    if (!token) throw new Error("no token");

    console.log("-- CREATE CONTRACT --");
    const create = await request(
      "POST",
      "/api/v1/contracts",
      {
        title: "בדיקה אוטומטית",
        recipient: "לקוח בדיקה",
        bulletPoints: ["נקודה ראשונה", "נקודה שנייה"],
        products: [
          {
            description: "מוצר ניסיון",
            notes: "הערות בדיקה",
            pricing: {
              unitPrice: 100,
              discountPercent: 10,
              unitPriceAfterDiscount: 90,
              minimumUnits: 10,
              totalForMinimum: 900,
              freeText: "",
            },
            imageFilename: "",
          },
        ],
        closingNotes: "סיום",
      },
      { Authorization: "Bearer " + token }
    );
    console.log(create.status);
    const contract = JSON.parse(create.body).data.contract;
    const id = contract._id;

    console.log("-- PUBLISH --");
    const pub = await request("PATCH", "/api/v1/contracts/" + id + "/publish", {}, {
      Authorization: "Bearer " + token,
    });
    console.log(pub.status);
    const published = JSON.parse(pub.body).data.contract;
    const shareToken = published.shareToken;
    console.log("share token:", shareToken);

    console.log("-- GET BY TOKEN --");
    const sharedRes = await request("GET", "/api/v1/contracts/share/" + shareToken);
    console.log(sharedRes.status);

    console.log("-- LIST CONTRACTS --");
    const list = await request("GET", "/api/v1/contracts", null, {
      Authorization: "Bearer " + token,
    });
    console.log(list.status, "results=", JSON.parse(list.body).results);

    console.log("-- CHECK SIGNATURE (none) --");
    const check = await request(
      "GET",
      "/api/v1/signatures/share/" + shareToken + "/check?idNumber=999999"
    );
    console.log(check.status, check.body.slice(0, 120));

    console.log("-- DELETE CONTRACT --");
    const del = await request("DELETE", "/api/v1/contracts/" + id, null, {
      Authorization: "Bearer " + token,
    });
    console.log(del.status);

    console.log("ALL OK");
  } catch (e) {
    console.error("ERROR:", e.message);
    process.exitCode = 1;
  } finally {
    server.close();
    await mongoose.disconnect();
  }
})();
