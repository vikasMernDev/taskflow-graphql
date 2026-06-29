const DEFAULT_CLIENT_ORIGIN = "http://localhost:5173";

function requireEnvironmentVariable(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is required. Add it to server/.env before starting the server.`);
  }
  return value;
}

function getConfig() {
  const jwtSecret = requireEnvironmentVariable("JWT_SECRET");
  if (jwtSecret.length < 32) {
    throw new Error("JWT_SECRET must contain at least 32 characters.");
  }

  const port = Number.parseInt(process.env.PORT || "4000", 10);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("PORT must be an integer between 1 and 65535.");
  }

  return {
    clientOrigins: (process.env.CLIENT_ORIGIN || DEFAULT_CLIENT_ORIGIN)
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean),
    isProduction: process.env.NODE_ENV === "production",
    jwtSecret,
    mongoUri: process.env.MONGO_URI || "mongodb://localhost:27017/taskmanager",
    port,
  };
}

module.exports = { getConfig };
