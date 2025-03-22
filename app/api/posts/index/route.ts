import { NextResponse } from "next/server";
import * as fs from 'fs';
import * as path from 'path';
import { addJson } from "@/lib/ipfs";

const DATA_DIR = path.join(process.cwd(), 'data');
const POSTS_INDEX_FILE = path.join(DATA_DIR, 'posts-index.json');

/**
 * GET /api/posts/index
 * Returns the CID of the posts index
 */
export const runtime = 'nodejs';
export async function GET() {
  try {
    // Make sure the data directory exists
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    // Check if we have a posts index file
    if (!fs.existsSync(POSTS_INDEX_FILE)) {
      // Create an initial empty index
      const initialIndex = {
        posts: [],
        lastUpdated: Date.now()
      };
      fs.writeFileSync(POSTS_INDEX_FILE, JSON.stringify(initialIndex, null, 2));
    }

    // Read the posts index
    const indexContent = fs.readFileSync(POSTS_INDEX_FILE, 'utf-8');
    const postsIndex = JSON.parse(indexContent);

    // Check if we need to update the CID
    if (!postsIndex.cid || Date.now() - postsIndex.lastUpdated > 3600000) { // Update if older than 1 hour
      // Upload to IPFS and update the CID
      const cid = await addJson(postsIndex);
      if (cid) {
        postsIndex.cid = cid;
        postsIndex.lastUpdated = Date.now();
        fs.writeFileSync(POSTS_INDEX_FILE, JSON.stringify(postsIndex, null, 2));
      }
    }

    return NextResponse.json({ 
      cid: postsIndex.cid || null,
      posts: postsIndex.posts.length,
      lastUpdated: postsIndex.lastUpdated
    });
  } catch (error) {
    console.error("Error retrieving posts index:", error);
    return NextResponse.json(
      { error: "Failed to retrieve posts index" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/posts/index
 * Add a post CID to the posts index
 */
export async function POST(request: Request) {
  try {
    const { cid } = await request.json();
    
    if (!cid) {
      return NextResponse.json(
        { error: "Missing post CID" },
        { status: 400 }
      );
    }

    // Make sure the data directory exists
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    // Read or create the posts index
    let postsIndex;
    if (fs.existsSync(POSTS_INDEX_FILE)) {
      const indexContent = fs.readFileSync(POSTS_INDEX_FILE, 'utf-8');
      postsIndex = JSON.parse(indexContent);
    } else {
      postsIndex = {
        posts: [],
        lastUpdated: Date.now()
      };
    }

    // Add the post CID if it's not already in the index
    if (!postsIndex.posts.includes(cid)) {
      postsIndex.posts.unshift(cid); // Add to beginning for most recent first
      postsIndex.lastUpdated = Date.now();

      // Upload the updated index to IPFS
      const newCid = await addJson(postsIndex);
      if (newCid) {
        postsIndex.cid = newCid;
      }

      // Save the updated index
      fs.writeFileSync(POSTS_INDEX_FILE, JSON.stringify(postsIndex, null, 2));

      return NextResponse.json({ 
        success: true, 
        message: "Post added to index",
        totalPosts: postsIndex.posts.length,
        cid: postsIndex.cid || null
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        message: "Post already in index",
        totalPosts: postsIndex.posts.length,
        cid: postsIndex.cid || null
      });
    }
  } catch (error) {
    console.error("Error updating posts index:", error);
    return NextResponse.json(
      { error: "Failed to update posts index" },
      { status: 500 }
    );
  }
} 