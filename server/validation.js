const mongoose = require("mongoose");
const { GraphQLError } = require("graphql");

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function userInputError(message) {
  return new GraphQLError(message, { extensions: { code: "BAD_USER_INPUT" } });
}

function normalizeEmail(value) {
  const email = value.trim().toLowerCase();
  if (!EMAIL_PATTERN.test(email) || email.length > 254) {
    throw userInputError("Enter a valid email address.");
  }
  return email;
}

function validatePassword(password) {
  const byteLength = Buffer.byteLength(password, "utf8");
  if (password.length < 8) {
    throw userInputError("Password must be at least 8 characters.");
  }
  if (byteLength > 72) {
    throw userInputError("Password must be at most 72 bytes.");
  }
  return password;
}

function normalizeTitle(value) {
  const title = value.trim();
  if (!title) throw userInputError("Task title cannot be empty.");
  if (title.length > 200) throw userInputError("Task title must be 200 characters or fewer.");
  return title;
}

function validateObjectId(value) {
  if (!mongoose.isObjectIdOrHexString(value)) {
    throw userInputError("Invalid task id.");
  }
  return value;
}

module.exports = {
  normalizeEmail,
  normalizeTitle,
  userInputError,
  validateObjectId,
  validatePassword,
};
