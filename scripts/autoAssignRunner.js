// scripts/autoAssignRunner.js
const http = require("http");

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
const jobKey = process.env.JOB_KEY || "1213";

function post(path) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);

    const req = http.request(
      {
        hostname: url.hostname,
        port: url.port || 80,
        path: url.pathname,
        method: "POST",
        headers: {
          "x-job-key": jobKey,
        },
      },
      (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => {
          resolve({ status: res.statusCode, body: data });
        });
      }
    );

    req.on("error", reject);
    req.end();
  });
}

(async () => {
  try {
    const result = await post("/api/jobs/auto-assign");
    console.log(new Date().toISOString(), result.status, result.body);
  } catch (e) {
    console.error(new Date().toISOString(), "FAILED", e.message);
    process.exitCode = 1;
  }
})();