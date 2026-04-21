"use client";

import { useState } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Button,
  Card,
  Field,
  Heading,
  Input,
  Stack,
  Text,
} from "@chakra-ui/react";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [nextPath, setNextPath] = useState("/");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const next = params.get("next") || "/";
    setNextPath(next);
  }, []);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { message?: string };
        setError(payload.message || "Unable to login");
        return;
      }

      router.push(nextPath);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box
      minH="100vh"
      display="grid"
      placeItems="center"
      px="4"
      bg="bg.canvas"
    >
      <Card.Root w="full" maxW="md" shadow="panel" borderRadius="card" bg="bg.surface">
        <Card.Header pb="2">
          <Heading size="lg" fontFamily="heading">
            Login to Meta Lab
          </Heading>
          <Text color="text.muted" fontSize="sm" mt="1">
            Single-operator access for scheduling and publishing.
          </Text>
        </Card.Header>
        <Card.Body>
          <form onSubmit={onSubmit}>
            <Stack gap="4">
              <Field.Root required>
                <Field.Label>Username</Field.Label>
                <Input
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="Enter username"
                  aria-label="Username"
                />
              </Field.Root>

              <Field.Root required>
                <Field.Label>Password</Field.Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter password"
                  aria-label="Password"
                />
              </Field.Root>

              {error ? (
                <Text color="status.danger" fontSize="sm">
                  {error}
                </Text>
              ) : null}

              <Button
                type="submit"
                colorPalette="brand"
                variant="solid"
                loading={loading}
                aria-label="Sign in to Meta Lab"
              >
                Login
              </Button>
            </Stack>
          </form>
        </Card.Body>
      </Card.Root>
    </Box>
  );
}
