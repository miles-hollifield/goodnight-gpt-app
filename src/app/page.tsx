
"use client";
import ChatContainer from "@/components/ChatContainer";
import { ClientOnly } from "@/components/ClientOnly";
import { CircularProgress } from "@mui/material";

export default function Home() {
  return (
    <ClientOnly fallback={<CircularProgress />}>
      <ChatContainer />
    </ClientOnly>
  );
}
