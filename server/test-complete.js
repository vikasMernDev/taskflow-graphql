const assert = require("node:assert/strict");

const url = process.env.GRAPHQL_URL || "http://localhost:4000/graphql";

async function request(query, variables, cookie) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: JSON.stringify({ query, variables }),
  });
  const body = await response.json();
  assert.equal(response.ok, true);
  assert.equal(body.errors, undefined, body.errors?.[0]?.message);
  return { body, response };
}

async function run() {
  const email = `smoke-${Date.now()}@example.com`;
  const password = "password123";

  const registration = await request(
    `mutation ($email: String!, $password: String!) {
      register(email: $email, password: $password) { id email }
    }`,
    { email, password }
  );
  assert.equal(registration.body.data.register.email, email);

  const setCookie = registration.response.headers.get("set-cookie");
  assert.ok(setCookie, "Registration did not set an authentication cookie");
  const cookie = setCookie.split(";")[0];

  const addition = await request(
    `mutation ($title: String!) {
      addTask(title: $title) { id title completed createdAt }
    }`,
    { title: "Smoke test task" },
    cookie
  );
  const task = addition.body.data.addTask;
  assert.equal(task.completed, false);
  assert.equal(Number.isNaN(new Date(task.createdAt).getTime()), false);

  const update = await request(
    `mutation ($id: ID!, $completed: Boolean) {
      updateTask(id: $id, completed: $completed) { id completed }
    }`,
    { id: task.id, completed: true },
    cookie
  );
  assert.equal(update.body.data.updateTask.completed, true);

  const deletion = await request(
    `mutation ($id: ID!) { deleteTask(id: $id) }`,
    { id: task.id },
    cookie
  );
  assert.equal(deletion.body.data.deleteTask, true);

  const logout = await request(`mutation { logout }`, undefined, cookie);
  assert.equal(logout.body.data.logout, true);
  console.log("Smoke test passed");
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
