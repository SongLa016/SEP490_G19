const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = function (app) {
  app.use(
    "/api",
    createProxyMiddleware({
      target: "https://sep490-g19-zxph.onrender.com",
      changeOrigin: true,
      secure: true,
      logLevel: "debug",
      onProxyReq: (proxyReq, req, res) => {
        // Forward original host header if needed
      },
      onError: (err, req, res) => {
        console.error("Proxy error:", err);
      },
      onProxyRes: (proxyRes, req, res) => {
        // Handle CORS headers if backend doesn't set them
        proxyRes.headers["Access-Control-Allow-Origin"] = "*";
        proxyRes.headers["Access-Control-Allow-Methods"] =
          "GET, POST, PUT, DELETE, OPTIONS";
        proxyRes.headers["Access-Control-Allow-Headers"] =
          "Content-Type, Authorization";
      },
    })
  );
};
