"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/store/userStore";
import { AuthGuard } from "@/components/AuthGuard";

export default function ProfilePage() {
  const router = useRouter();
  const { currentUser } = useUserStore();

  useEffect(() => {
    if (currentUser) {
      router.push(`/profile/${currentUser.address}`);
    }
  }, [currentUser, router]);

  return (
    <AuthGuard>
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin h-10 w-10 border-4 border-primary rounded-full border-t-transparent"></div>
      </div>
    </AuthGuard>
  );
} 