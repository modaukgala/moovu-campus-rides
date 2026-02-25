/* eslint-disable @typescript-eslint/no-require-imports */
const https = require("https");
const http = require("http");

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
const jobKey = process.env.JOB_KEY || "";

function post(path) {
  return new Promise((resolve, reject) => {
    const isHttps = baseUrl.startsWith("https://");
    const url = new URL(path, baseUrl);
    const lib = isHttps ? https : http;

    const req = lib.request(
      url,
      { method: "POST", headers: { "x-job-key": jobKey } },
      (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => resolve({ status: res.statusCode, body: data }));
      }
    );

    req.on("error", reject);
    req.end();
  });
}

(async () => {
  try {
    const r = await post("/api/jobs/auto-assign");
    console.log(r);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();