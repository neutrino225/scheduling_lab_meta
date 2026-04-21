import { AppShell } from "@/components/navigation/app-shell";
import { Badge, Card, Heading, SimpleGrid, Stack, Text } from "@chakra-ui/react";

const mediaItems = [
  { name: "hero-launch.jpg", type: "image", status: "Stored" },
  { name: "product-reel.mp4", type: "video", status: "Stored" },
  { name: "promo-story.jpg", type: "image", status: "Stored" },
];

export default function MediaPage() {
  return (
    <AppShell>
      <Stack gap="6">
        <Heading size="xl" fontFamily="heading">
          Media
        </Heading>

        <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} gap="4">
          {mediaItems.map((item) => (
            <Card.Root key={item.name} borderRadius="card" bg="bg.surface" shadow="panel">
              <Card.Body>
                <Text fontWeight="600">{item.name}</Text>
                <Text color="text.muted" textTransform="capitalize" mt="1">
                  {item.type}
                </Text>
                <Badge
                  mt="2"
                  px="2"
                  py="0.5"
                  borderRadius="md"
                  bg="status.successSurface"
                  color="status.success"
                  textTransform="none"
                  fontWeight="600"
                >
                  {item.status}
                </Badge>
              </Card.Body>
            </Card.Root>
          ))}
        </SimpleGrid>
      </Stack>
    </AppShell>
  );
}
