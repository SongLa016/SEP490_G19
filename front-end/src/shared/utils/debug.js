export const debug = {
  log: (...args) => {
    if (process.env.NODE_ENV === "development") {
    }
  },
  warn: (...args) => {
    if (process.env.NODE_ENV === "development") {
      console.warn("[WARN]", ...args);
    }
  },
  error: (...args) => {
    if (process.env.NODE_ENV === "development") {
      console.error("[ERROR]", ...args);
    }
  },
};
