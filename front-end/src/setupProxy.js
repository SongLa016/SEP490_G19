const { createProxyMiddleware } = require("http-proxy-middleware");

// API URL - có thể thay đổi qua biến môi trường
const API_TARGET = process.env.REACT_APP_API_BASE_URL || "http://localhost:8080";

// hàm setup proxy
module.exports = function (app) {
  app.use(
    "/api",
    // proxy đến API backend
    createProxyMiddleware({
      target: API_TARGET,
      changeOrigin: true,
      secure: true,
      logLevel: "debug",
      onProxyReq: (proxyReq, req, res) => {},
      onError: (err, req, res) => {
        console.error("Proxy error:", err);
      },
      onProxyRes: (proxyRes, req, res) => {
        proxyRes.headers["Access-Control-Allow-Origin"] = "*";
        proxyRes.headers["Access-Control-Allow-Methods"] =
          "GET, POST, PUT, DELETE, OPTIONS";
        proxyRes.headers["Access-Control-Allow-Headers"] =
          "Content-Type, Authorization";
      },
    })
  );
};
