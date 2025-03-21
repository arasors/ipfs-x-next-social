"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { usePostStore } from "@/store/postStore";
import PostItem from "@/components/PostItem";
import { Comments } from "@/components/Comments";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, AlertCircle } from "lucide-react";



export default function PostDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { getPost } = usePostStore();
  const [post, setPost] = useState(getPost(params?.id as string));
  const [loading, setLoading] = useState(!post);

  useEffect(() => {
    // If post is not found in store, try to load it
    if (!post) {
      setLoading(true);
      // In a real app, you might fetch the post from an API here
      const foundPost = getPost(params?.id as string);
      
      if (foundPost) {
        setPost(foundPost);
      }
      
      setLoading(false);
    }
  }, [params?.id, post, getPost]);

  const handleBack = () => {
    router.back();
  };

  if (loading) {
    return (
      <div className="container max-w-3xl mx-auto py-8 px-4">
        <div className="mb-6">
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        
        <Card className="mb-8">
          <div className="p-6">
            <div className="flex items-center space-x-4 mb-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div>
                <Skeleton className="h-5 w-32 mb-1" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4 mb-4" />
            <Skeleton className="h-64 w-full rounded-md mb-4" />
            <div className="flex space-x-4">
              <Skeleton className="h-9 w-20" />
              <Skeleton className="h-9 w-20" />
              <Skeleton className="h-9 w-20" />
            </div>
          </div>
        </Card>
        
        <Card>
          <div className="p-6">
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex space-x-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-32 mb-1" />
                    <Skeleton className="h-4 w-full mb-1" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="container max-w-3xl mx-auto py-8 px-4">
        <div className="mb-6">
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        
        <Card className="p-8 text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-2xl font-bold mb-2">Post Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The post you're looking for doesn't exist or has been removed.
          </p>
          <Button onClick={() => router.push("/")}>
            Go to Home
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-3xl mx-auto py-8 px-4">
      <div className="mb-6">
        <Button variant="ghost" size="sm" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>
      
      <PostItem post={post} showFullContent />
      
      <Card className="mt-8 p-6">
        <Comments post={post} showForm />
      </Card>
    </div>
  );
} 