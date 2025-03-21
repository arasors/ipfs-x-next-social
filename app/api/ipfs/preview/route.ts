import { NextRequest, NextResponse } from 'next/server';
import { getBinaryContentFromGateways } from '@/lib/ipfs';

/**
 * API route that returns the binary content of an IPFS CID
 * This is especially useful for previewing images and other media files
 * 
 * @param request - NextRequest object containing URL parameters
 * @returns Response with the binary content and appropriate headers
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const cid = searchParams.get('cid');
  
  if (!cid) {
    return NextResponse.json(
      { error: 'Missing CID parameter' },
      { status: 400 }
    );
  }

  try {
    // Fetch binary content from IPFS gateways
    const content = await getBinaryContentFromGateways(cid);
    
    if (!content) {
      return NextResponse.json(
        { error: 'Content not found' },
        { status: 404 }
      );
    }

    // Attempt to detect MIME type from binary content
    let contentType = 'application/octet-stream';

    // Basic MIME type detection based on magic numbers/file signatures
    if (content.length > 2) {
      const signature = content.slice(0, 4);
      
      // JPEG
      if (signature[0] === 0xFF && signature[1] === 0xD8) {
        contentType = 'image/jpeg';
      }
      // PNG
      else if (
        signature[0] === 0x89 &&
        signature[1] === 0x50 &&
        signature[2] === 0x4E &&
        signature[3] === 0x47
      ) {
        contentType = 'image/png';
      }
      // GIF
      else if (
        signature[0] === 0x47 &&
        signature[1] === 0x49 &&
        signature[2] === 0x46
      ) {
        contentType = 'image/gif';
      }
      // PDF
      else if (
        signature[0] === 0x25 &&
        signature[1] === 0x50 &&
        signature[2] === 0x44 &&
        signature[3] === 0x46
      ) {
        contentType = 'application/pdf';
      }
      // WebP
      else if (
        content.length > 12 &&
        content[8] === 0x57 &&
        content[9] === 0x45 &&
        content[10] === 0x42 &&
        content[11] === 0x50
      ) {
        contentType = 'image/webp';
      }
      // MP4 and other container formats
      else if (
        signature[0] === 0x66 &&
        signature[1] === 0x74 &&
        signature[2] === 0x79 &&
        signature[3] === 0x70
      ) {
        contentType = 'video/mp4';
      }
      // SVG (text-based, look for <?xml or <svg)
      else if (
        (content.length > 5 &&
          content[0] === 0x3C &&
          content[1] === 0x3F &&
          content[2] === 0x78 &&
          content[3] === 0x6D &&
          content[4] === 0x6C) ||
        (content.length > 4 &&
          content[0] === 0x3C &&
          content[1] === 0x73 &&
          content[2] === 0x76 &&
          content[3] === 0x67)
      ) {
        contentType = 'image/svg+xml';
      }
    }

    // Create a response with the content and appropriate headers
    return new Response(content, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    console.error('Error fetching IPFS content:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve content from IPFS' },
      { status: 500 }
    );
  }
} 