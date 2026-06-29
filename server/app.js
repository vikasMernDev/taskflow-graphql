const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const { ApolloServer } = require("apollo-server-express");
const { createResolvers, typeDefs } = require("./schema");

function createCorsOptions(config) {
  return {
    credentials: true,
    origin(origin, callback) {
      if (!origin || config.clientOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("Origin is not allowed by CORS"));
    },
  };
}

async function createApp(config) {
  const app = express();
  app.disable("x-powered-by");
  app.use(cors(createCorsOptions(config)));
  app.use(express.json({ limit: "100kb" }));
  app.use(cookieParser());

  const apolloServer = new ApolloServer({
    typeDefs,
    resolvers: createResolvers(config),
    context: ({ req, res }) => {
      const cookieToken = req.cookies?.token;
      const authHeader = req.headers.authorization || "";
      const bearerToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
      const token = cookieToken || bearerToken;
      if (!token) return { req, res };

      try {
        const payload = jwt.verify(token, config.jwtSecret);
        return { req, res, user: payload };
      } catch {
        return { req, res };
      }
    },
  });

  await apolloServer.start();
  apolloServer.applyMiddleware({ app, path: "/graphql", cors: false });
  return { app, apolloServer };
}

module.exports = { createApp, createCorsOptions };
