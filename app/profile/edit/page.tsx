"use client";

import { ProfileEditForm } from "@/components/ProfileEditForm";
import { AuthGuard } from "@/components/AuthGuard";

export default function EditProfilePage() {
  return (
    <AuthGuard>
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <ProfileEditForm />
      </div>
    </AuthGuard>
  );
} 