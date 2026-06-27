
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { ApolloServer } = require("apollo-server-express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || "change_this_secret";
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/taskmanager";

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

mongoose.connect(MONGO_URI).then(() => console.log("DB Connected")).catch(err => console.error("DB connection error:", err));

const typeDefs = `
  type Task { id: ID!, title: String!, completed: Boolean!, createdAt: String }
  type User { id: ID!, email: String! }
  type Query { tasks: [Task!]! me: User }
  type Mutation {
    register(email: String!, password: String!): User!
    login(email: String!, password: String!): User!
    logout: Boolean!
    addTask(title: String!): Task!
    updateTask(id: ID!, title: String, completed: Boolean): Task!
    deleteTask(id: ID!): Boolean!
  }
`;

const Task = mongoose.model(
  "Task",
  new mongoose.Schema(
    {
      title: { type: String, required: true },
      completed: { type: Boolean, default: false },
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
    },
    { timestamps: true }
  )
);

const User = mongoose.model(
  "User",
  new mongoose.Schema(
    {
      email: { type: String, required: true, unique: true },
      password: { type: String, required: true }
    },
    { timestamps: true }
  )
);

const resolvers = {
  Query: {
    tasks: async (_, __, { user }) => {
      if (!user) throw new Error("Unauthorized");
      return Task.find({ userId: user.id }).sort({ createdAt: -1 });
    },
    me: async (_, __, { user }) => {
      if (!user) return null;
      return User.findById(user.id).select("_id email");
    }
  },
  Mutation: {
    register: async (_, { email, password }, { res }) => {
      const existing = await User.findOne({ email });
      if (existing) throw new Error("Email already registered");

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await User.create({ email, password: hashedPassword });
      const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
      res.cookie("token", token, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 7 * 24 * 60 * 60 * 1000
      });
      return { id: user._id, email: user.email };
    },
    login: async (_, { email, password }, { res }) => {
      const user = await User.findOne({ email });
      if (!user) throw new Error("Invalid credentials");

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) throw new Error("Invalid credentials");

      const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
      res.cookie("token", token, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 7 * 24 * 60 * 60 * 1000
      });
      return { id: user._id, email: user.email };
    },
    logout: async (_, __, { res }) => {
      res.clearCookie("token", {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production"
      });
      return true;
    },
    addTask: async (_, { title }, { user }) => {
      if (!user) throw new Error("Unauthorized");
      return Task.create({ title, userId: user.id });
    },
    updateTask: async (_, { id, title, completed }, { user }) => {
      if (!user) throw new Error("Unauthorized");
      const updateFields = {};
      if (title !== undefined) updateFields.title = title;
      if (completed !== undefined) updateFields.completed = completed;
      if (Object.keys(updateFields).length === 0) throw new Error("Nothing to update");
      const task = await Task.findOneAndUpdate({ _id: id, userId: user.id }, updateFields, { new: true });
      if (!task) throw new Error("Not found");
      return task;
    },
    deleteTask: async (_, { id }, { user }) => {
      if (!user) throw new Error("Unauthorized");
      const resDel = await Task.deleteOne({ _id: id, userId: user.id });
      return resDel.deletedCount === 1;
    }
  }
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req, res }) => {
    const cookieToken = req.cookies?.token;
    const authHeader = req.headers.authorization || "";
    const bearer = authHeader.replace("Bearer ", "").trim();
    const token = cookieToken || bearer;
    if (!token) return { req, res };

    try {
      const payload = jwt.verify(token, JWT_SECRET);
      return { req, res, user: payload };
    } catch (error) {
      return { req, res };
    }
  }
});

server.start().then(() => {
  server.applyMiddleware({ app, path: "/graphql", cors: false });
  app.listen(4000, () => console.log("Server running on http://localhost:4000/graphql"));
});
