"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Board from "@/components/Board";
import { useAuth } from "@/lib/auth";

export default function Home() {
  const { session, ready } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (ready && !session) router.replace("/login");
  }, [ready, session, router]);

  if (!ready || !session) {
    return <div className="min-h-screen flex-1 bg-slate-50" />;
  }

  return <Board />;
}
