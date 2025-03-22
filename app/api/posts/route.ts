import { NextResponse } from 'next/server';
import { fetchPostsFromRemote } from '@/lib/ipfs';

// In-memory cache for posts between requests
// In a production environment, you'd use a database or Redis
let postsCache: any[] = [];
let lastFetchTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// GET handler to retrieve posts
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50); // Cap at 50 posts
    const sinceParam = searchParams.get('since');
    const since = sinceParam ? parseInt(sinceParam, 10) : 0;
    
    // Check if we need to refresh the cache
    const now = Date.now();
    if (postsCache.length === 0 || now - lastFetchTime > CACHE_TTL) {
      const remotePosts = await fetchPostsFromRemote();
      if (remotePosts.length > 0) {
        postsCache = remotePosts;
        lastFetchTime = now;
      }
    }
    
    // Filter posts by timestamp if 'since' parameter is provided
    let filteredPosts = postsCache;
    if (since > 0) {
      filteredPosts = postsCache.filter(post => post.timestamp > since);
    }
    
    // Paginate results
    const paginatedPosts = filteredPosts.slice(offset, offset + limit);
    
    // Return posts with pagination metadata
    return NextResponse.json({
      posts: paginatedPosts,
      pagination: {
        total: filteredPosts.length,
        offset,
        limit,
        hasMore: offset + limit < filteredPosts.length
      }
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    );
  }
}

// POST handler to add a new post to the index
export async function POST(request: Request) {
  try {
    const postData = await request.json();
    
    // Basic validation
    if (!postData.id || !postData.contentCID) {
      return NextResponse.json(
        { error: 'Invalid post data: missing required fields' },
        { status: 400 }
      );
    }
    
    // Check if post already exists
    const existingPost = postsCache.find(p => p.id === postData.id);
    if (existingPost) {
      return NextResponse.json(
        { error: 'Post already exists', post: existingPost },
        { status: 409 }
      );
    }
    
    // Add timestamp if not provided
    if (!postData.timestamp) {
      postData.timestamp = Date.now();
    }
    
    // Add post to cache
    postsCache.unshift(postData);
    
    // In a real application, you would persist this to a database
    // and potentially create a new IPFS DAG with the updated index
    
    return NextResponse.json({ 
      success: true, 
      message: 'Post added successfully',
      post: postData
    });
  } catch (error) {
    console.error('Error adding post:', error);
    return NextResponse.json(
      { error: 'Failed to add post' },
      { status: 500 }
    );
  }
} 