import { createFileRoute } from "@tanstack/react-router";
import { ReliquaryApp } from "@/components/reliquary/app";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <ReliquaryApp />;
}
