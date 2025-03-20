import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export function PostDetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* Back button skeleton */}
      <div className="mb-4">
        <Skeleton className="h-9 w-20" />
      </div>
      
      {/* Post card skeleton */}
      <Card className="overflow-hidden">
        <CardHeader className="py-4 px-6 flex-row items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
          <div className="ml-auto">
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </CardHeader>
        
        <CardContent className="px-6 py-4">
          {/* Post content skeleton */}
          <div className="space-y-3 mb-6">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
          </div>
          
          {/* Media skeleton */}
          <Skeleton className="h-64 w-full rounded-md" />
          
          {/* Post stats skeleton */}
          <div className="flex items-center gap-4 mt-6">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-24" />
          </div>
        </CardContent>
        
        <Separator />
        
        <CardFooter className="px-6 py-3 flex justify-between">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-16" />
        </CardFooter>
      </Card>
      
      {/* Comments section skeleton */}
      <div className="space-y-6">
        <Skeleton className="h-6 w-40" />
        
        {/* Comment form skeleton */}
        <Card>
          <CardContent className="pt-6">
            <Skeleton className="h-24 w-full rounded-md" />
          </CardContent>
          <CardFooter className="flex justify-end">
            <Skeleton className="h-9 w-32" />
          </CardFooter>
        </Card>
        
        {/* Comments list skeleton */}
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader className="py-3 px-4 flex-row items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </CardHeader>
              <CardContent className="py-2 px-4">
                <Skeleton className="h-16 w-full rounded-md" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
} 