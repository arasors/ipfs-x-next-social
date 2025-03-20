import { Suspense } from 'react';
import { Metadata } from 'next';
import PostDetail from '@/components/PostDetail';
import { Skeleton } from '@/components/ui/skeleton';

type Props = {
  params: {
    id: string;
  };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const postId = params.id;
  
  return {
    title: `Post Detail - ${postId}`,
    description: 'View post details, comments and interactions',
  };
}

export default function PostPage({ params }: Props) {
  return (
    <div className="container max-w-4xl py-8">
      <Suspense fallback={<PostDetailSkeleton />}>
        <PostDetail postId={params.id} />
      </Suspense>
    </div>
  );
}

function PostDetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* Post header skeleton */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
      
      {/* Post content skeleton */}
      <div className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
      </div>
      
      {/* Media skeleton */}
      <Skeleton className="h-64 w-full rounded-md" />
      
      {/* Actions skeleton */}
      <div className="flex justify-between">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-20" />
      </div>
      
      {/* Comments header skeleton */}
      <div className="pt-6 space-y-2">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-24 w-full rounded-md" />
      </div>
      
      {/* Comments list skeleton */}
      <div className="space-y-4 pt-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-16 w-full rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 