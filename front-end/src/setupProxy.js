const { createProxyMiddleware } = require("http-proxy-middleware");
// hàm setup proxy
module.exports = function (app) {
  app.use(
    "/api",
    // proxy đến API backend
    createProxyMiddleware({
      target: "https://sep490-g19-zxph.onrender.com",
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
