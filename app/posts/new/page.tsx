"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/navigation/app-shell";
import { getApiData, postJson } from "@/lib/client/api";
import { Account, Post } from "@/lib/client/types";
import {
  Alert,
  Box,
  Button,
  Card,
  Field,
  Heading,
  HStack,
  Input,
  NativeSelect,
  Spinner,
  Stack,
  Text,
  Textarea,
} from "@chakra-ui/react";

interface CreatedPostResponse {
  post: Post;
}

function toLocalDateTimeValue(timestamp: number) {
  const date = new Date(timestamp);
  const offset = date.getTimezoneOffset();
  const localDate = new Date(timestamp - offset * 60000);
  return localDate.toISOString().slice(0, 16);
}

export default function NewPostPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [accountError, setAccountError] = useState<string | null>(null);

  const [accountId, setAccountId] = useState("");
  const [platform, setPlatform] = useState<"facebook" | "instagram">("facebook");
  const [caption, setCaption] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaType, setMediaType] = useState<"image" | "video">("image");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadAccounts() {
      setLoadingAccounts(true);
      setAccountError(null);

      try {
        const data = await getApiData<Account[]>("/api/accounts");

        if (!active) {
          return;
        }

        setAccounts(data);

        if (data.length > 0) {
          const preferred = data.find((item) => item.platform === "facebook") || data[0];
          if (preferred) {
            setAccountId(preferred.id);
            setPlatform(preferred.platform);
          }
        }
      } catch (err) {
        if (!active) {
          return;
        }

        setAccountError(err instanceof Error ? err.message : "Failed to load accounts");
      } finally {
        if (active) {
          setLoadingAccounts(false);
        }
      }
    }

    void loadAccounts();

    return () => {
      active = false;
    };
  }, []);

  const accountOptions = useMemo(
    () => accounts.filter((item) => item.platform === platform),
    [accounts, platform]
  );

  useEffect(() => {
    if (accountOptions.length === 0) {
      setAccountId("");
      return;
    }

    if (!accountOptions.some((item) => item.id === accountId)) {
      setAccountId(accountOptions[0]!.id);
    }
  }, [accountOptions, accountId]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setSuccessMessage(null);

    if (!accountId) {
      setFormError("Please select an account.");
      return;
    }

    if (platform === "instagram" && !mediaUrl.trim()) {
      setFormError("Instagram posts require at least one media URL.");
      return;
    }

    const normalizedScheduledAt = scheduledAt
      ? new Date(scheduledAt).getTime()
      : undefined;

    if (normalizedScheduledAt && Number.isNaN(normalizedScheduledAt)) {
      setFormError("Scheduled time is invalid.");
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        accountId,
        platform,
        caption,
        scheduledAt: normalizedScheduledAt,
        media: mediaUrl.trim()
          ? [
              {
                url: mediaUrl.trim(),
                type: mediaType,
              },
            ]
          : undefined,
      };

      const response = await postJson<CreatedPostResponse>("/api/posts", payload);
      setSuccessMessage(`Post created: ${response.post.id}`);
      setCaption("");
      setMediaUrl("");
      setScheduledAt("");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to create post");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell>
      <Stack gap="6">
        <Box>
          <Heading size="xl" fontFamily="heading">
            Create Post
          </Heading>
          <Text color="text.muted" mt="1">
            Build a Facebook or Instagram post with optional scheduling.
          </Text>
        </Box>

        <Card.Root borderRadius="card" bg="bg.surface" shadow="panel">
          <Card.Body>
            {loadingAccounts ? (
              <HStack color="text.muted" mb="4">
                <Spinner size="sm" />
                <Text>Loading account options...</Text>
              </HStack>
            ) : null}

            {accountError ? (
              <Alert.Root status="error" mb="4">
                <Alert.Indicator />
                <Alert.Content>
                  <Alert.Description>{accountError}</Alert.Description>
                </Alert.Content>
              </Alert.Root>
            ) : null}

            <form onSubmit={onSubmit}>
              <Stack gap="4">
                <Field.Root required>
                  <Field.Label>Platform</Field.Label>
                  <NativeSelect.Root>
                    <NativeSelect.Field
                      value={platform}
                      onChange={(event) =>
                        setPlatform(event.target.value as "facebook" | "instagram")
                      }
                      aria-label="Select platform"
                    >
                      <option value="facebook">Facebook</option>
                      <option value="instagram">Instagram</option>
                    </NativeSelect.Field>
                    <NativeSelect.Indicator />
                  </NativeSelect.Root>
                </Field.Root>

                <Field.Root required>
                  <Field.Label>Account</Field.Label>
                  <NativeSelect.Root>
                    <NativeSelect.Field
                      value={accountId}
                      onChange={(event) => setAccountId(event.target.value)}
                      aria-label="Select account"
                    >
                      {accountOptions.length === 0 ? (
                        <option value="">No accounts for selected platform</option>
                      ) : null}
                      {accountOptions.map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.name}
                        </option>
                      ))}
                    </NativeSelect.Field>
                    <NativeSelect.Indicator />
                  </NativeSelect.Root>
                </Field.Root>

                <Field.Root>
                  <Field.Label>Caption</Field.Label>
                  <Textarea
                    value={caption}
                    onChange={(event) => setCaption(event.target.value)}
                    placeholder="Write your post caption"
                    minH="140px"
                    aria-label="Post caption"
                  />
                </Field.Root>

                <Field.Root>
                  <Field.Label>Schedule (optional)</Field.Label>
                  <Input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(event) => setScheduledAt(event.target.value)}
                    min={toLocalDateTimeValue(Date.now())}
                    aria-label="Select schedule time"
                  />
                </Field.Root>

                <Field.Root required={platform === "instagram"}>
                  <Field.Label>
                    Media URL {platform === "instagram" ? "(required)" : "(optional)"}
                  </Field.Label>
                  <Input
                    value={mediaUrl}
                    onChange={(event) => setMediaUrl(event.target.value)}
                    placeholder="https://..."
                    aria-label="Media URL"
                  />
                </Field.Root>

                <Field.Root disabled={!mediaUrl.trim()}>
                  <Field.Label>Media Type</Field.Label>
                  <NativeSelect.Root>
                    <NativeSelect.Field
                      value={mediaType}
                      onChange={(event) =>
                        setMediaType(event.target.value as "image" | "video")
                      }
                      aria-label="Select media type"
                    >
                      <option value="image">Image</option>
                      <option value="video">Video</option>
                    </NativeSelect.Field>
                    <NativeSelect.Indicator />
                  </NativeSelect.Root>
                </Field.Root>

                {platform === "instagram" ? (
                  <Text fontSize="sm" color="text.muted">
                    Instagram requires at least one image or video URL.
                  </Text>
                ) : null}

                {formError ? (
                  <Alert.Root status="error">
                    <Alert.Indicator />
                    <Alert.Content>
                      <Alert.Description>{formError}</Alert.Description>
                    </Alert.Content>
                  </Alert.Root>
                ) : null}

                {successMessage ? (
                  <Alert.Root status="success">
                    <Alert.Indicator />
                    <Alert.Content>
                      <Alert.Description>{successMessage}</Alert.Description>
                    </Alert.Content>
                  </Alert.Root>
                ) : null}

                <HStack justify="flex-end">
                  <Button
                    type="submit"
                    colorPalette="brand"
                    variant="solid"
                    loading={submitting}
                    aria-label="Create scheduled post"
                  >
                    Create Post
                  </Button>
                </HStack>
              </Stack>
            </form>
          </Card.Body>
        </Card.Root>
      </Stack>
    </AppShell>
  );
}
