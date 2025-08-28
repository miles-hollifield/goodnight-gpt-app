
"use client";
import ChatUI from "./ChatUI";
import { ClientOnly } from "@/components/ClientOnly";
import { CircularProgress } from "@mui/material";

export default function Home() {
  return (
    <ClientOnly fallback={<CircularProgress />}>
      <ChatUI />
    </ClientOnly>
  );
}
