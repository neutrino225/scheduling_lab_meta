"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/navigation/app-shell";
import { getApiData } from "@/lib/client/api";
import { Post } from "@/lib/client/types";
import {
  Badge,
  Box,
  Button,
  Card,
  Heading,
  HStack,
  Input,
  NativeSelect,
  Spinner,
  Stack,
  Table,
  Text,
} from "@chakra-ui/react";

function statusBadge(postStatus: string) {
  switch (postStatus) {
    case "published":
      return { bg: "status.successSurface", color: "status.success", label: "Published" };
    case "scheduled":
      return { bg: "status.infoSurface", color: "status.info", label: "Scheduled" };
    case "processing":
      return { bg: "status.warningSurface", color: "status.warning", label: "Processing" };
    case "failed":
      return { bg: "status.dangerSurface", color: "status.danger", label: "Failed" };
    default:
      return { bg: "bg.subtle", color: "text.muted", label: "Draft" };
  }
}

function formatDateTime(timestamp: number | null) {
  if (!timestamp) {
    return "Not scheduled";
  }

  return new Date(timestamp).toLocaleString();
}

export default function PostsPage() {
  const [rows, setRows] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("");
  const [platform, setPlatform] = useState<string>("");
  const [accountId, setAccountId] = useState<string>("");

  useEffect(() => {
    let active = true;

    async function loadPosts() {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({ limit: "100" });

      if (status) {
        params.set("status", status);
      }

      if (platform) {
        params.set("platform", platform);
      }

      if (accountId) {
        params.set("accountId", accountId);
      }

      try {
        const data = await getApiData<Post[]>(`/api/posts/list?${params.toString()}`);

        if (!active) {
          return;
        }

        setRows(data);
      } catch (err) {
        if (!active) {
          return;
        }

        setError(err instanceof Error ? err.message : "Failed to fetch posts");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadPosts();

    return () => {
      active = false;
    };
  }, [status, platform, accountId]);

  function resetFilters() {
    setStatus("");
    setPlatform("");
    setAccountId("");
  }

  return (
    <AppShell>
      <Stack gap="6">
        <Heading size="xl" fontFamily="heading">
          Posts
        </Heading>

        <Card.Root borderRadius="card" bg="bg.surface" shadow="panel">
          <Card.Header>
            <Heading size="md" fontFamily="heading">
              Recent Posts
            </Heading>
            <Text color="text.muted" fontSize="sm">Live data from `/api/posts/list`.</Text>
          </Card.Header>
          <Card.Body>
            <HStack gap="3" mb="4" flexWrap="wrap" align="stretch">
              <NativeSelect.Root minW="180px" size="sm">
                <NativeSelect.Field
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                  aria-label="Filter by post status"
                >
                  <option value="">All statuses</option>
                  <option value="draft">Draft</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="processing">Processing</option>
                  <option value="published">Published</option>
                  <option value="failed">Failed</option>
                </NativeSelect.Field>
                <NativeSelect.Indicator />
              </NativeSelect.Root>

              <NativeSelect.Root minW="180px" size="sm">
                <NativeSelect.Field
                  value={platform}
                  onChange={(event) => setPlatform(event.target.value)}
                  aria-label="Filter by platform"
                >
                  <option value="">All platforms</option>
                  <option value="facebook">Facebook</option>
                  <option value="instagram">Instagram</option>
                </NativeSelect.Field>
                <NativeSelect.Indicator />
              </NativeSelect.Root>

              <Input
                size="sm"
                placeholder="Filter by account ID"
                value={accountId}
                onChange={(event) => setAccountId(event.target.value)}
                maxW="280px"
                aria-label="Filter by account ID"
              />

              <Button
                size="sm"
                variant="subtle"
                colorPalette="neutral"
                onClick={resetFilters}
                aria-label="Reset all filters"
              >
                Reset
              </Button>
            </HStack>

            {loading ? (
              <HStack color="text.muted" mb="4">
                <Spinner size="sm" />
                <Text>Loading posts...</Text>
              </HStack>
            ) : null}

            {error ? (
              <Text color="status.danger" mb="4">
                {error}
              </Text>
            ) : null}

            <Box overflowX="auto">
              <Table.Root size="sm" minW="680px">
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeader>Post ID</Table.ColumnHeader>
                    <Table.ColumnHeader>Platform</Table.ColumnHeader>
                    <Table.ColumnHeader>Status</Table.ColumnHeader>
                    <Table.ColumnHeader>Schedule</Table.ColumnHeader>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {rows.map((row) => {
                    const badge = statusBadge(row.status);

                    return (
                      <Table.Row key={row.id}>
                        <Table.Cell fontFamily="mono" fontSize="xs">
                          {row.id}
                        </Table.Cell>
                        <Table.Cell textTransform="capitalize">{row.platform}</Table.Cell>
                        <Table.Cell>
                          <Badge
                            px="2"
                            py="0.5"
                            borderRadius="md"
                            bg={badge.bg}
                            color={badge.color}
                            textTransform="none"
                            fontWeight="600"
                          >
                            {badge.label}
                          </Badge>
                        </Table.Cell>
                        <Table.Cell>{formatDateTime(row.scheduledAt)}</Table.Cell>
                      </Table.Row>
                    );
                  })}
                </Table.Body>
              </Table.Root>
            </Box>

            {!loading && rows.length === 0 ? (
              <Text color="text.muted" fontSize="sm" mt="3">
                No posts match your filters.
              </Text>
            ) : null}
          </Card.Body>
        </Card.Root>
      </Stack>
    </AppShell>
  );
}
