import { AuthGuard } from "@/components/AuthGuard";
import CreatePost from "@/components/CreatePost";

export default function CreatePage() {
  return (
    <AuthGuard>
      <div className="container max-w-2xl mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold mb-6">Create New Post</h1>
        <CreatePost />
      </div>
    </AuthGuard>
  );
} 