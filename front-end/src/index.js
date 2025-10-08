import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css"; // phải có dòng này
import App from "./App";
import "react-day-picker/dist/style.css";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
