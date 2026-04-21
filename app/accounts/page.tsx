"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/navigation/app-shell";
import { getApiData } from "@/lib/client/api";
import { Account } from "@/lib/client/types";
import { Box, Card, Heading, HStack, Spinner, Stack, Table, Text } from "@chakra-ui/react";

function tokenExpiryLabel(timestamp: number | null) {
  if (!timestamp) {
    return "Not set";
  }

  return new Date(timestamp).toLocaleString();
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadAccounts() {
      setLoading(true);
      setError(null);

      try {
        const data = await getApiData<Account[]>("/api/accounts");

        if (!active) {
          return;
        }

        setAccounts(data);
      } catch (err) {
        if (!active) {
          return;
        }

        setError(err instanceof Error ? err.message : "Failed to fetch accounts");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadAccounts();

    return () => {
      active = false;
    };
  }, []);

  return (
    <AppShell>
      <Stack gap="6">
        <Heading size="xl" fontFamily="heading">
          Accounts
        </Heading>

        <Card.Root borderRadius="card" bg="bg.surface" shadow="panel">
          <Card.Header>
            <Text color="text.muted" fontSize="sm">
              Connected Meta accounts from `/api/accounts`.
            </Text>
          </Card.Header>
          <Card.Body>
            {loading ? (
              <HStack color="text.muted" mb="4">
                <Spinner size="sm" />
                <Text>Loading accounts...</Text>
              </HStack>
            ) : null}

            {error ? (
              <Text color="status.danger" mb="4">
                {error}
              </Text>
            ) : null}

            <Box overflowX="auto">
              <Table.Root size="sm" minW="860px">
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeader>Name</Table.ColumnHeader>
                    <Table.ColumnHeader>Platform</Table.ColumnHeader>
                    <Table.ColumnHeader>Account ID</Table.ColumnHeader>
                    <Table.ColumnHeader>Token</Table.ColumnHeader>
                    <Table.ColumnHeader>Token Expires</Table.ColumnHeader>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {accounts.map((account) => (
                    <Table.Row key={account.id}>
                      <Table.Cell>{account.name}</Table.Cell>
                      <Table.Cell textTransform="capitalize">{account.platform}</Table.Cell>
                      <Table.Cell fontFamily="mono" fontSize="xs">
                        {account.id}
                      </Table.Cell>
                      <Table.Cell fontFamily="mono" fontSize="xs" maxW="320px" whiteSpace="normal">
                        {account.accessToken || "-"}
                      </Table.Cell>
                      <Table.Cell>{tokenExpiryLabel(account.tokenExpiresAt)}</Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>
            </Box>

            {!loading && accounts.length === 0 ? (
              <Text color="text.muted" fontSize="sm" mt="3">
                No connected accounts yet.
              </Text>
            ) : null}
          </Card.Body>
        </Card.Root>
      </Stack>
    </AppShell>
  );
}
