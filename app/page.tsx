"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/navigation/app-shell";
import { getApiData } from "@/lib/client/api";
import { Account, Job, JobSummary, Post } from "@/lib/client/types";
import {
  Badge,
  Box,
  Card,
  Grid,
  Heading,
  HStack,
  Spinner,
  Stack,
  Text,
} from "@chakra-ui/react";

function itemBadgeColor(itemStatus: string) {
  switch (itemStatus) {
    case "published":
    case "done":
      return { bg: "status.successSurface", color: "status.success" };
    case "scheduled":
    case "pending":
      return { bg: "status.infoSurface", color: "status.info" };
    case "processing":
    case "running":
      return { bg: "status.warningSurface", color: "status.warning" };
    case "failed":
      return { bg: "status.dangerSurface", color: "status.danger" };
    default:
      return { bg: "bg.subtle", color: "text.muted" };
  }
}

function formatDateTime(timestamp: number | null) {
  if (!timestamp) {
    return "Not scheduled";
  }

  return new Date(timestamp).toLocaleString();
}

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobSummary, setJobSummary] = useState<JobSummary | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadData() {
      setLoading(true);
      setError(null);

      try {
        const [postsData, jobsData, summaryPayload, accountsData] = await Promise.all([
          getApiData<Post[]>("/api/posts/list?limit=8"),
          getApiData<Job[]>("/api/jobs?limit=8"),
          getApiData<{ summary: JobSummary }>("/api/jobs?summary=true"),
          getApiData<Account[]>("/api/accounts"),
        ]);

        if (!active) {
          return;
        }

        setPosts(postsData);
        setJobs(jobsData);
        setJobSummary(summaryPayload.summary);
        setAccounts(accountsData);
      } catch (err) {
        if (!active) {
          return;
        }

        setError(err instanceof Error ? err.message : "Failed to load dashboard data");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadData();

    return () => {
      active = false;
    };
  }, []);

  const scheduledPosts = useMemo(
    () => posts.filter((post) => post.status === "scheduled").length,
    [posts]
  );
  const publishedToday = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    return posts.filter((post) => (post.publishedAt || 0) >= start).length;
  }, [posts]);

  const cards = [
    { label: "Scheduled posts", value: scheduledPosts, note: "Queued for publish" },
    { label: "Published today", value: publishedToday, note: "Completed since midnight" },
    { label: "Failed jobs", value: jobSummary?.failed || 0, note: "Requires attention" },
    { label: "Connected accounts", value: accounts.length, note: "Available destinations" },
  ];

  return (
    <AppShell>
      <Stack gap="6">
        <Box>
          <Heading size="xl" fontFamily="heading">
            Dashboard
          </Heading>
          <Text mt="1" color="text.muted">
            Monitor queue health and scheduled content at a glance.
          </Text>
        </Box>

        {loading ? (
          <HStack color="text.muted">
            <Spinner size="sm" />
            <Text>Loading dashboard metrics...</Text>
          </HStack>
        ) : null}

        {error ? (
          <Card.Root borderRadius="card" bg="bg.surface" shadow="panel">
            <Card.Body>
              <Text color="status.danger">{error}</Text>
            </Card.Body>
          </Card.Root>
        ) : null}

        <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", xl: "repeat(4, 1fr)" }} gap="4">
          {cards.map((item) => (
            <Card.Root key={item.label} borderRadius="card" bg="bg.surface" shadow="panel">
              <Card.Body>
                <Text color="text.muted" fontSize="sm">
                  {item.label}
                </Text>
                <Heading size="2xl" mt="2" fontFamily="heading">
                  {item.value}
                </Heading>
                <Text mt="1" fontSize="sm" color="text.muted">
                  {item.note}
                </Text>
              </Card.Body>
            </Card.Root>
          ))}
        </Grid>

        <Card.Root borderRadius="card" bg="bg.surface" shadow="panel">
          <Card.Header>
            <Heading size="md" fontFamily="heading">
              Upcoming Posts
            </Heading>
          </Card.Header>
          <Card.Body>
            <Stack gap="3">
              {posts.slice(0, 5).map((post) => (
                <Box key={post.id} borderWidth="1px" borderColor="border.default" rounded="md" p="3">
                  <HStack justify="space-between" align="center" gap="2">
                    <Text fontWeight="600" fontSize="sm" textTransform="capitalize">
                      {post.platform}
                    </Text>
                    <Badge
                      px="2"
                      py="0.5"
                      borderRadius="md"
                      bg={itemBadgeColor(post.status).bg}
                      color={itemBadgeColor(post.status).color}
                      textTransform="none"
                      fontWeight="600"
                    >
                      {post.status}
                    </Badge>
                  </HStack>
                  <Text color="text.muted" fontSize="sm" mt="1">
                    {post.caption || "No caption"}
                  </Text>
                  <Text color="text.muted" fontSize="xs" mt="1">
                    {formatDateTime(post.scheduledAt)}
                  </Text>
                </Box>
              ))}
              {!loading && posts.length === 0 ? (
                <Text color="text.muted" fontSize="sm">
                  No posts found yet.
                </Text>
              ) : null}
            </Stack>
          </Card.Body>
        </Card.Root>

        <Card.Root borderRadius="card" bg="bg.surface" shadow="panel">
          <Card.Header>
            <Heading size="md" fontFamily="heading">
              Recent Jobs
            </Heading>
          </Card.Header>
          <Card.Body>
            <Stack gap="2">
              {jobs.slice(0, 5).map((job) => (
                <HStack
                  key={job.id}
                  justify="space-between"
                  align="center"
                  borderWidth="1px"
                  borderColor="border.default"
                  rounded="md"
                  p="2"
                >
                  <Text color="text.muted" fontSize="sm" fontFamily="mono">
                    {job.id}
                  </Text>
                  <HStack gap="2">
                    <Badge
                      px="2"
                      py="0.5"
                      borderRadius="md"
                      bg={itemBadgeColor(job.status).bg}
                      color={itemBadgeColor(job.status).color}
                      textTransform="none"
                      fontWeight="600"
                    >
                      {job.status}
                    </Badge>
                    <Text color="text.muted" fontSize="xs">
                      attempts {job.attempts}
                    </Text>
                  </HStack>
                </HStack>
              ))}
              {!loading && jobs.length === 0 ? (
                <Text color="text.muted" fontSize="sm">
                  No job activity yet.
                </Text>
              ) : null}
            </Stack>
          </Card.Body>
        </Card.Root>
      </Stack>
    </AppShell>
  );
}
