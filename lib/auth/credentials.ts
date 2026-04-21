export function getExpectedCredentials() {
  return {
    username: process.env.AUTH_USERNAME || "test",
    password: process.env.AUTH_PASSWORD || "test123",
  };
}

export function validateCredentials(username: string, password: string) {
  const expected = getExpectedCredentials();
  return username === expected.username && password === expected.password;
}
