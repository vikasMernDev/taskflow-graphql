const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { GraphQLError } = require("graphql");
const { Task, User } = require("./models");
const {
  normalizeEmail,
  normalizeTitle,
  userInputError,
  validateObjectId,
  validatePassword,
} = require("./validation");

const typeDefs = `
  type Task { id: ID!, title: String!, completed: Boolean!, createdAt: String! }
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

function authenticationError(message = "Unauthorized") {
  return new GraphQLError(message, { extensions: { code: "UNAUTHENTICATED" } });
}

function requireUser(user) {
  if (!user) throw authenticationError();
  return user;
}

function setAuthCookie(res, token, config) {
  res.cookie("token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: config.isProduction,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

function signToken(user, config) {
  return jwt.sign({ id: user.id }, config.jwtSecret, { expiresIn: "7d" });
}

function createResolvers(config) {
  return {
    Task: {
      createdAt: (task) => task.createdAt.toISOString(),
    },
    Query: {
      tasks: async (_, __, { user }) => {
        const authenticatedUser = requireUser(user);
        return Task.find({ userId: authenticatedUser.id }).sort({ createdAt: -1 });
      },
      me: async (_, __, { user }) => {
        if (!user) return null;
        return User.findById(user.id).select("_id email");
      },
    },
    Mutation: {
      register: async (_, { email: rawEmail, password: rawPassword }, { res }) => {
        const email = normalizeEmail(rawEmail);
        const password = validatePassword(rawPassword);
        const existing = await User.exists({ email });
        if (existing) throw userInputError("Email already registered");

        try {
          const hashedPassword = await bcrypt.hash(password, 10);
          const user = await User.create({ email, password: hashedPassword });
          setAuthCookie(res, signToken(user, config), config);
          return user;
        } catch (error) {
          if (error?.code === 11000) throw userInputError("Email already registered");
          throw error;
        }
      },
      login: async (_, { email: rawEmail, password: rawPassword }, { res }) => {
        const email = normalizeEmail(rawEmail);
        const password = validatePassword(rawPassword);
        const user = await User.findOne({ email }).select("+password");
        if (!user || !(await bcrypt.compare(password, user.password))) {
          throw authenticationError("Invalid credentials");
        }

        setAuthCookie(res, signToken(user, config), config);
        return user;
      },
      logout: async (_, __, { res }) => {
        res.clearCookie("token", {
          httpOnly: true,
          sameSite: "lax",
          secure: config.isProduction,
        });
        return true;
      },
      addTask: async (_, { title }, { user }) => {
        const authenticatedUser = requireUser(user);
        return Task.create({ title: normalizeTitle(title), userId: authenticatedUser.id });
      },
      updateTask: async (_, { id, title, completed }, { user }) => {
        const authenticatedUser = requireUser(user);
        validateObjectId(id);

        const updateFields = {};
        if (title !== undefined) updateFields.title = normalizeTitle(title);
        if (completed !== undefined) updateFields.completed = completed;
        if (Object.keys(updateFields).length === 0) {
          throw new GraphQLError("Nothing to update", { extensions: { code: "BAD_USER_INPUT" } });
        }

        const task = await Task.findOneAndUpdate(
          { _id: id, userId: authenticatedUser.id },
          updateFields,
          { new: true, runValidators: true }
        );
        if (!task) throw new GraphQLError("Task not found", { extensions: { code: "NOT_FOUND" } });
        return task;
      },
      deleteTask: async (_, { id }, { user }) => {
        const authenticatedUser = requireUser(user);
        validateObjectId(id);
        const result = await Task.deleteOne({ _id: id, userId: authenticatedUser.id });
        if (result.deletedCount !== 1) {
          throw new GraphQLError("Task not found", { extensions: { code: "NOT_FOUND" } });
        }
        return true;
      },
    },
  };
}

module.exports = { createResolvers, typeDefs };
