const test = require("node:test");
const assert = require("node:assert/strict");
const {
  normalizeEmail,
  normalizeTitle,
  validateObjectId,
  validatePassword,
} = require("../validation");
const { createResolvers } = require("../schema");

test("normalizes valid email addresses", () => {
  assert.equal(normalizeEmail("  User@Example.COM "), "user@example.com");
});

test("rejects malformed email addresses", () => {
  assert.throws(() => normalizeEmail("not-an-email"), { message: "Enter a valid email address." });
});

test("normalizes task titles and rejects empty titles", () => {
  assert.equal(normalizeTitle("  Write tests  "), "Write tests");
  assert.throws(() => normalizeTitle("   "), { message: "Task title cannot be empty." });
});

test("enforces bcrypt's safe password boundary", () => {
  assert.equal(validatePassword("password123"), "password123");
  assert.throws(() => validatePassword("short"), { message: "Password must be at least 8 characters." });
  assert.throws(() => validatePassword("a".repeat(73)), { message: "Password must be at most 72 bytes." });
});

test("rejects malformed MongoDB ids", () => {
  assert.equal(validateObjectId("507f1f77bcf86cd799439011"), "507f1f77bcf86cd799439011");
  assert.throws(() => validateObjectId("bad-id"), { message: "Invalid task id." });
});

test("serializes task dates as ISO strings", () => {
  const date = new Date("2026-01-02T03:04:05.000Z");
  const resolvers = createResolvers({});
  assert.equal(resolvers.Task.createdAt({ createdAt: date }), "2026-01-02T03:04:05.000Z");
});
