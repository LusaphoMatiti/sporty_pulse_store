import http from "k6/http";
import { check, sleep } from "k6";

const BASE = (__ENV.BASE_URL || "").replace(/\/+$/, "");
const PRODUCT_ID = __ENV.PRODUCT_ID;

const paths = [
  "/equipments",
  "/category/fitness",
  "/category/recovery",
  "/api/health",
];
if (PRODUCT_ID) paths.push(`/equipments/${PRODUCT_ID}`);

const thresholds = {
  http_req_failed: ["rate<0.01"],
  http_req_duration: ["p(95)<800"],
};
for (const p of paths) {
  thresholds[`http_req_duration{name:${p}}`] = ["p(95)<800"];
}

export const options = {
  stages: [
    { duration: "1m", target: 10 },
    { duration: "3m", target: 50 },
    { duration: "1m", target: 0 },
  ],
  summaryTrendStats: ["avg", "med", "p(75)", "p(90)", "p(95)", "max"],
  thresholds,
};

export default function () {
  const path = paths[Math.floor(Math.random() * paths.length)];
  const res = http.get(`${BASE}${path}`, {
    redirects: 0,
    tags: { name: path },
  });
  check(res, { "status 200": (r) => r.status === 200 });
  sleep(1);
}

http.setResponseCallback(http.expectedStatuses(200));
