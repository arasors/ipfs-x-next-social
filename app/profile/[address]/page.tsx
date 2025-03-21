import { UserProfile } from "@/components/UserProfile";
import { Card } from "@/components/ui/card";
import { UserIcon } from "lucide-react";

interface ProfilePageProps {
  params: {
    address: string;
  };
}

export default function ProfilePage({ params }: ProfilePageProps) {
  // Check if address is valid
  if (!params.address || params.address.trim() === "") {
    return (
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <Card className="p-8 flex flex-col items-center justify-center">
          <UserIcon size={64} className="text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Invalid Profile</h1>
          <p className="text-muted-foreground text-center">
            The profile you're looking for doesn't exist or has an invalid address.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <UserProfile address={params.address} />
    </div>
  );
} 