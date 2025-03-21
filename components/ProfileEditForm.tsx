"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/store/userStore";
import { User } from "@/models/User";
import { addBytes, pinContent } from "@/lib/ipfs";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Upload, X } from "lucide-react";

export function ProfileEditForm() {
  const router = useRouter();
  const { currentUser, updateCurrentUser } = useUserStore();
  const [loading, setLoading] = useState(false);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [profileData, setProfileData] = useState<Partial<User>>({
    username: "",
    displayName: "",
    bio: "",
  });
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser) {
      router.push('/');
      return;
    }

    // Initialize form with current user data
    setProfileData({
      username: currentUser.username || "",
      displayName: currentUser.displayName || "",
      bio: currentUser.bio || "",
    });

    // Set image previews if they exist
    if (currentUser.profileImageCID) {
      setProfileImagePreview(`https://ipfs.io/ipfs/${currentUser.profileImageCID}`);
    }
    if (currentUser.coverImageCID) {
      setCoverImagePreview(`https://ipfs.io/ipfs/${currentUser.coverImageCID}`);
    }
  }, [currentUser, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfileImageFile(file);
      setProfileImagePreview(URL.createObjectURL(file));
    }
  };

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCoverImageFile(file);
      setCoverImagePreview(URL.createObjectURL(file));
    }
  };

  const clearProfileImage = () => {
    setProfileImageFile(null);
    setProfileImagePreview(null);
    setProfileData(prev => ({
      ...prev,
      profileImageCID: undefined
    }));
  };

  const clearCoverImage = () => {
    setCoverImageFile(null);
    setCoverImagePreview(null);
    setProfileData(prev => ({
      ...prev,
      coverImageCID: undefined
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    try {
      setLoading(true);
      const updates: Partial<User> = { ...profileData };

      // Upload profile image if changed
      if (profileImageFile) {
        const fileBuffer = await profileImageFile.arrayBuffer();
        const result = await addBytes(
          new Uint8Array(fileBuffer),
          { mimeType: profileImageFile.type }
        );
        
        if (result) {
          updates.profileImageCID = result;
        }
      } else if (profileImagePreview === null && currentUser.profileImageCID) {
        // User removed the profile image
        updates.profileImageCID = undefined;
      }

      // Upload cover image if changed
      if (coverImageFile) {
        const fileBuffer = await coverImageFile.arrayBuffer();
        const result = await addBytes(
          new Uint8Array(fileBuffer),
          { mimeType: coverImageFile.type }
        );
        
        if (result) {
          updates.coverImageCID = result;
        }
      } else if (coverImagePreview === null && currentUser.coverImageCID) {
        // User removed the cover image
        updates.coverImageCID = undefined;
      }

      // Update the user in the store
      updateCurrentUser(updates);
      toast.success("Profile updated successfully");
      
      // Navigate back to profile page
      router.push(`/profile/${currentUser.address}`);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return null;
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Edit Profile</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          {/* Display Name */}
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              name="displayName"
              value={profileData.displayName || ""}
              onChange={handleInputChange}
              placeholder="Your display name"
            />
          </div>

          {/* Username */}
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              name="username"
              value={profileData.username || ""}
              onChange={handleInputChange}
              placeholder="username"
            />
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              name="bio"
              value={profileData.bio || ""}
              onChange={handleInputChange}
              placeholder="Tell us about yourself"
              rows={4}
            />
          </div>

          {/* Profile Image */}
          <div className="space-y-2">
            <Label>Profile Image</Label>
            <div className="flex items-center gap-4">
              <div className="relative h-24 w-24">
                <Avatar className="h-full w-full">
                  {profileImagePreview ? (
                    <AvatarImage src={profileImagePreview} alt="Profile preview" />
                  ) : (
                    <AvatarFallback>
                      {(profileData.displayName?.[0] || profileData.username?.[0] || currentUser.address[0]).toUpperCase()}
                    </AvatarFallback>
                  )}
                </Avatar>
                {profileImagePreview && (
                  <button
                    type="button"
                    onClick={clearProfileImage}
                    className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground p-1 rounded-full"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
              <div>
                <Input
                  id="profileImage"
                  type="file"
                  accept="image/*"
                  onChange={handleProfileImageChange}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById("profileImage")?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" /> Upload
                </Button>
              </div>
            </div>
          </div>

          {/* Cover Image */}
          <div className="space-y-2">
            <Label>Cover Image</Label>
            <div className="space-y-2">
              {coverImagePreview && (
                <div className="relative w-full h-32 rounded-md overflow-hidden">
                  <img
                    src={coverImagePreview}
                    alt="Cover preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={clearCoverImage}
                    className="absolute top-2 right-2 bg-destructive text-destructive-foreground p-1 rounded-full"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
              <div>
                <Input
                  id="coverImage"
                  type="file"
                  accept="image/*"
                  onChange={handleCoverImageChange}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById("coverImage")?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" /> {coverImagePreview ? "Change Cover" : "Upload Cover"}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/profile/${currentUser.address}`)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
} 