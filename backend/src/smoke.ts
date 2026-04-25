import { buildServer } from "./server";

async function run() {
  const app = buildServer();
  await app.ready();

  const login = await app.inject({
    method: "POST",
    url: "/api/v1/auth/login",
    payload: { email: "dsc-23@yandex.ru", password: "123123123" },
  });
  const loginJson = login.json() as { token: string };
  const token = loginJson.token;

  const createSession = await app.inject({
    method: "POST",
    url: "/api/v1/chat/sessions",
    headers: { authorization: `Bearer ${token}` },
  });
  const session = createSession.json() as { id: string };

  const testOpenAiKey = process.env.OPENAI_TEST_KEY;
  if (testOpenAiKey) {
    const attachIntegration = await app.inject({
      method: "POST",
      url: "/api/v1/integrations/openai",
      headers: { authorization: `Bearer ${token}` },
      payload: { apiKey: testOpenAiKey },
    });
    console.log("integration.status", attachIntegration.statusCode);
  }

  const sendMessage = await app.inject({
    method: "POST",
    url: `/api/v1/chat/sessions/${session.id}/messages`,
    headers: { authorization: `Bearer ${token}` },
    payload: { content: "lead: John Doe, +1-555-1010" },
  });

  const stream = await app.inject({
    method: "GET",
    url: `/api/v1/chat/stream?sessionId=${session.id}&message=hello%20stream`,
    headers: { authorization: `Bearer ${token}` },
  });

  console.log("login.status", login.statusCode);
  console.log("session.status", createSession.statusCode);
  console.log("message.status", sendMessage.statusCode);
  console.log("stream.status", stream.statusCode);
  console.log("stream.contentType", stream.headers["content-type"]);
  console.log("message.body", sendMessage.body);
  console.log("stream.body", stream.body);

  await app.close();
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
