async function run() {
  const url = process.env.GRAPHQL_URL || 'http://localhost:4000/graphql';
  const email = `test-${Date.now()}@example.com`;

  const registerQuery = {
    query: `mutation Register($email: String!, $password: String!) { register(email: $email, password: $password) { id email } }`,
    variables: { email, password: 'password123' }
  };

  const tasksQuery = {
    query: `query { tasks { id title createdAt } }`
  };

  try {
    console.log('Registering user...');
    const regResp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registerQuery)
    });
    const regData = await regResp.json();
    console.log('register response:', regData);

    const setCookie = regResp.headers.get('set-cookie');
    console.log('set-cookie header:', setCookie);

    if (!setCookie) {
      console.log('No cookie set. Login response may not be sending cookies.');
      process.exitCode = 1;
      return;
    }

    console.log('Fetching tasks using cookie...');
    const tasksResp = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: setCookie.split(';')[0]
      },
      body: JSON.stringify(tasksQuery)
    });
    const tasksData = await tasksResp.json();
    console.log('tasks response:', tasksData);
  } catch (err) {
    console.error(err);
    process.exitCode = 1;
  }
}

run();
