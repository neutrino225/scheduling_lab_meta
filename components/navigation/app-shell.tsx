"use client";

import NextLink from "next/link";
import { usePathname } from "next/navigation";
import {
  Box,
  Button,
  Flex,
  Heading,
  Link,
  Stack,
  Text,
} from "@chakra-ui/react";

const navItems = [
  { href: "/", label: "Dashboard" },
  { href: "/posts", label: "Posts" },
  { href: "/posts/new", label: "Create Post" },
  { href: "/jobs", label: "Jobs" },
  { href: "/accounts", label: "Accounts" },
  { href: "/media", label: "Media" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <Flex minH="100vh" bg="bg.canvas" color="text.primary">
      <Box
        as="aside"
        w={{ base: "100%", md: "260px" }}
        maxW={{ base: "100%", md: "260px" }}
        borderRightWidth={{ base: "0", md: "1px" }}
        borderBottomWidth={{ base: "1px", md: "0" }}
        borderColor="border.default"
        bg="bg.surface"
        backdropFilter="blur(8px)"
      >
        <Flex
          px="6"
          py="5"
          align="center"
          justify="space-between"
          borderBottomWidth="1px"
          borderColor="border.default"
        >
          <Heading as="h1" size="md" fontFamily="heading" letterSpacing="0.02em" fontWeight="600">
            Meta Lab
          </Heading>
          <Text fontSize="xs" color="text.muted" textTransform="uppercase" letterSpacing="0.16em">
            Internal
          </Text>
        </Flex>

        <Stack direction={{ base: "row", md: "column" }} p="4" gap="2" overflowX="auto">
          {navItems.map((item) => {
            const active = pathname === item.href;

            return (
              <Link
                key={item.href}
                as={NextLink}
                href={item.href}
                px="3"
                py="2"
                rounded="md"
                fontWeight={active ? "600" : "500"}
                fontSize="sm"
                borderWidth="1px"
                borderColor={active ? "accent.primary" : "transparent"}
                bg={active ? "accent.surface" : "transparent"}
                color={active ? "accent.text" : "text.primary"}
                _hover={{
                  textDecoration: "none",
                  bg: active ? "accent.surface" : "bg.subtle",
                  borderColor: active ? "accent.primary" : "border.default",
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </Stack>
      </Box>

      <Flex direction="column" flex="1" minW="0">
        <Flex
          as="header"
          h="16"
          px={{ base: "4", md: "8" }}
          align="center"
          justify="space-between"
          borderBottomWidth="1px"
          borderColor="border.default"
          bg="bg.surface"
          backdropFilter="blur(8px)"
          position="sticky"
          top="0"
          zIndex="appBar"
        >
          <Text fontSize="sm" color="text.muted" letterSpacing="0.02em">
            Scheduling workspace
          </Text>
          <Button
            size="sm"
            variant="outline"
            colorPalette="red"
            onClick={handleLogout}
            aria-label="Log out"
            minW="84px"
            borderColor="status.danger"
            color="status.danger"
            _hover={{ bg: "status.dangerSurface", borderColor: "status.danger", color: "status.danger" }}
          >
            Logout
          </Button>
        </Flex>

        <Box as="main" px={{ base: "4", md: "8" }} py={{ base: "5", md: "8" }}>
          {children}
        </Box>
      </Flex>
    </Flex>
  );
}
