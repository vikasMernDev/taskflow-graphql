const fetch = require('node-fetch');

async function run() {
  const url = 'http://localhost:4000/graphql';

  const loginQuery = {
    query: `mutation Login($email: String!, $password: String!) { login(email: $email, password: $password) { id email } }`,
    variables: { email: 'test@example.com', password: 'password123' }
  };

  const tasksQuery = { query: `query { tasks { id title completed createdAt } }` };

  try {
    console.log('Logging in...');
    const loginResp = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(loginQuery) });
    const loginData = await loginResp.json();
    console.log('login', loginData);

    const setCookie = loginResp.headers.get('set-cookie');
    if (!setCookie) { console.log('No cookie set on login'); return; }
    const cookie = setCookie.split(';')[0];

    console.log('Fetching tasks...');
    const tasksResp = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: cookie }, body: JSON.stringify(tasksQuery) });
    const tasksData = await tasksResp.json();
    console.log('tasks before:', tasksData);

    if (!tasksData.data.tasks.length) { console.log('No tasks to toggle. Adding one...');
      const addQuery = { query: `mutation AddTask($title: String!) { addTask(title: $title) { id title completed } }`, variables: { title: 'temp task' } };
      await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: cookie }, body: JSON.stringify(addQuery) });
    }

    const tasksResp2 = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: cookie }, body: JSON.stringify(tasksQuery) });
    const tasksData2 = await tasksResp2.json();
    console.log('tasks after add:', tasksData2);

    const task = tasksData2.data.tasks[0];
    const toggleQuery = { query: `mutation UpdateTask($id: ID!, $completed: Boolean) { updateTask(id: $id, completed: $completed) { id title completed } }`, variables: { id: task.id, completed: !task.completed } };
    const toggleResp = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: cookie }, body: JSON.stringify(toggleQuery) });
    const toggleData = await toggleResp.json();
    console.log('toggled:', toggleData);
  } catch (err) {
    console.error(err);
  }
}

run();
