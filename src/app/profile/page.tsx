"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function ProfileRedirect() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;

    if (session?.user?.id) {
      router.replace(`/profile/${session.user.id}`);
    } else {
      router.push("/auth/signin");
    }
  }, [session, status, router]);

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  return null;
}
