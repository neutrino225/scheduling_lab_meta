"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/navigation/app-shell";
import { getApiData } from "@/lib/client/api";
import { Job, JobSummary } from "@/lib/client/types";
import {
  Badge,
  Box,
  Card,
  Grid,
  Heading,
  HStack,
  NativeSelect,
  Spinner,
  Stack,
  Table,
  Text,
} from "@chakra-ui/react";

function jobStatusBadge(jobStatus: string) {
  switch (jobStatus) {
    case "done":
      return { bg: "status.successSurface", color: "status.success", label: "Done" };
    case "pending":
      return { bg: "status.infoSurface", color: "status.info", label: "Pending" };
    case "running":
      return { bg: "status.warningSurface", color: "status.warning", label: "Running" };
    case "failed":
      return { bg: "status.dangerSurface", color: "status.danger", label: "Failed" };
    default:
      return { bg: "bg.subtle", color: "text.muted", label: jobStatus };
  }
}

function formatDateTime(timestamp: number | null) {
  if (!timestamp) {
    return "-";
  }

  return new Date(timestamp).toLocaleString();
}

export default function JobsPage() {
  const [summary, setSummary] = useState<JobSummary | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [status, setStatus] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadData() {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({ limit: "100" });

      if (status) {
        params.set("status", status);
      }

      try {
        const [summaryData, jobsData] = await Promise.all([
          getApiData<{ summary: JobSummary }>("/api/jobs?summary=true"),
          getApiData<Job[]>(`/api/jobs?${params.toString()}`),
        ]);

        if (!active) {
          return;
        }

        setSummary(summaryData.summary);
        setJobs(jobsData);
      } catch (err) {
        if (!active) {
          return;
        }

        setError(err instanceof Error ? err.message : "Failed to fetch jobs");
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
  }, [status]);

  const jobStats = [
    { label: "Pending", value: summary?.pending || 0 },
    { label: "Running", value: summary?.running || 0 },
    { label: "Done", value: summary?.done || 0 },
    { label: "Failed", value: summary?.failed || 0 },
  ];

  return (
    <AppShell>
      <Stack gap="6">
        <Heading size="xl" fontFamily="heading">
          Jobs
        </Heading>

        <Grid templateColumns={{ base: "1fr", sm: "repeat(2, 1fr)", xl: "repeat(4, 1fr)" }} gap="4">
          {jobStats.map((item) => (
            <Card.Root key={item.label} borderRadius="card" bg="bg.surface" shadow="panel">
              <Card.Body>
                <Text color="text.muted" fontSize="sm">
                  {item.label}
                </Text>
                <Heading size="xl" fontFamily="heading" mt="1">
                  {String(item.value)}
                </Heading>
              </Card.Body>
            </Card.Root>
          ))}
        </Grid>

        <Card.Root borderRadius="card" bg="bg.surface" shadow="panel">
          <Card.Header>
            <HStack justify="space-between" flexWrap="wrap" gap="3">
              <Heading size="md" fontFamily="heading">
                Queue Activity
              </Heading>
              <NativeSelect.Root minW="180px" size="sm">
                <NativeSelect.Field
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                  aria-label="Filter jobs by status"
                >
                  <option value="">All statuses</option>
                  <option value="pending">Pending</option>
                  <option value="running">Running</option>
                  <option value="done">Done</option>
                  <option value="failed">Failed</option>
                </NativeSelect.Field>
                <NativeSelect.Indicator />
              </NativeSelect.Root>
            </HStack>
          </Card.Header>
          <Card.Body>
            {loading ? (
              <HStack color="text.muted" mb="4">
                <Spinner size="sm" />
                <Text>Loading jobs...</Text>
              </HStack>
            ) : null}

            {error ? (
              <Text color="status.danger" mb="4">
                {error}
              </Text>
            ) : null}

            <Box overflowX="auto">
              <Table.Root size="sm" minW="900px">
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeader>Job ID</Table.ColumnHeader>
                    <Table.ColumnHeader>Post ID</Table.ColumnHeader>
                    <Table.ColumnHeader>Status</Table.ColumnHeader>
                    <Table.ColumnHeader>Attempts</Table.ColumnHeader>
                    <Table.ColumnHeader>Run At</Table.ColumnHeader>
                    <Table.ColumnHeader>Last Error</Table.ColumnHeader>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {jobs.map((job) => {
                    const badge = jobStatusBadge(job.status);

                    return (
                      <Table.Row key={job.id}>
                        <Table.Cell fontFamily="mono" fontSize="xs">
                          {job.id}
                        </Table.Cell>
                        <Table.Cell fontFamily="mono" fontSize="xs">
                          {job.postId}
                        </Table.Cell>
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
                        <Table.Cell>{job.attempts}</Table.Cell>
                        <Table.Cell>{formatDateTime(job.runAt)}</Table.Cell>
                        <Table.Cell maxW="260px" whiteSpace="normal" color="text.muted">
                          {job.lastError || "-"}
                        </Table.Cell>
                      </Table.Row>
                    );
                  })}
                </Table.Body>
              </Table.Root>
            </Box>

            {!loading && jobs.length === 0 ? (
              <Text color="text.muted" fontSize="sm" mt="3">
                No jobs found for this filter.
              </Text>
            ) : null}
          </Card.Body>
        </Card.Root>
      </Stack>
    </AppShell>
  );
}
