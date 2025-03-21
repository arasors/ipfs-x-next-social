import { NextRequest, NextResponse } from 'next/server';

// Configuration for Pinata credentials from environment or hardcoded (for demo)
const CONFIG = {
  pinata: {
    apiKey: process.env.PINATA_API_KEY || 'f694d50e1e7f165a1715',
    secretApiKey: process.env.PINATA_SECRET_API_KEY || '635433cb2d4921d8b0d419e655838b10cd463e084876a1e5b9fc6ee921702646',
    jwt: process.env.PINATA_JWT || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiJhMWNjM2ZhMS1mYjRiLTRiOTctYWMzMi04ZjM0MTA4YzhlNGQiLCJlbWFpbCI6ImFyYXNpbnRoZWhlbGxAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsInBpbl9wb2xpY3kiOnsicmVnaW9ucyI6W3siZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiRlJBMSJ9LHsiZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiTllDMSJ9XSwidmVyc2lvbiI6MX0sIm1mYV9lbmFibGVkIjpmYWxzZSwic3RhdHVzIjoiQUNUSVZFIn0sImF1dGhlbnRpY2F0aW9uVHlwZSI6InNjb3BlZEtleSIsInNjb3BlZEtleUtleSI6ImY2OTRkNTBlMWU3ZjE2NWExNzE1Iiwic2NvcGVkS2V5U2VjcmV0IjoiNjM1NDMzY2IyZDQ5MjFkOGIwZDQxOWU2NTU4MzhiMTBjZDQ2M2UwODQ4NzZhMWU1YjlmYzZlZTkyMTcwMjY0NiIsImV4cCI6MTc3NDA1MDM2Mn0.l_CudiC2WV3UwjDfts9nCQfDamOs3O08t1Y6zsaBHs4',
    gateway: 'https://azure-central-bobolink-99.mypinata.cloud/ipfs/'
  }
};

/**
 * API route that proxies content from Pinata gateway with appropriate authentication
 * This helps avoid CORS issues and enables direct access to Pinata content
 * 
 * @param request - NextRequest object containing URL parameters
 * @returns Response with the content from Pinata and appropriate headers
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
    // First, check if this is a metadata request by Pinata
    const metadataRequest = searchParams.get('metadata') === 'true';
    if (metadataRequest) {
      // Query the Pinata API for metadata
      const metadataUrl = `https://api.pinata.cloud/pinning/hashMetadata?ipfsPinHash=${cid}`;
      const metadataHeaders: HeadersInit = {
        'Content-Type': 'application/json'
      };
      
      if (CONFIG.pinata.jwt) {
        metadataHeaders['Authorization'] = `Bearer ${CONFIG.pinata.jwt}`;
      } else {
        metadataHeaders['pinata_api_key'] = CONFIG.pinata.apiKey;
        metadataHeaders['pinata_secret_api_key'] = CONFIG.pinata.secretApiKey;
      }
      
      const metadataResponse = await fetch(metadataUrl, {
        method: 'GET',
        headers: metadataHeaders,
        next: { revalidate: 3600 } // Cache for 1 hour
      });
      
      if (metadataResponse.ok) {
        const metadata = await metadataResponse.json();
        return NextResponse.json(metadata, { status: 200 });
      }
    }
    
    // Construct the URL to access the content from Pinata gateway
    // Use the direct pinata gateway (no subdomain) for better compatibility
    const gatewayUrl = `https://gateway.pinata.cloud/ipfs/${cid}`;
    
    // Fetch the content with appropriate headers
    const response = await fetch(gatewayUrl, {
      next: { revalidate: 86400 } // Cache for 24 hours
    });

    if (!response.ok) {
      // Try the custom gateway if the public one fails
      const dedicatedGatewayUrl = `${CONFIG.pinata.gateway}${cid}`;
      const headers: HeadersInit = {};
      
      // Use JWT if available, otherwise use API key
      if (CONFIG.pinata.jwt) {
        headers['Authorization'] = `Bearer ${CONFIG.pinata.jwt}`;
      } else if (CONFIG.pinata.apiKey && CONFIG.pinata.secretApiKey) {
        headers['pinata_api_key'] = CONFIG.pinata.apiKey;
        headers['pinata_secret_api_key'] = CONFIG.pinata.secretApiKey;
      }
      
      const dedicatedResponse = await fetch(dedicatedGatewayUrl, {
        headers,
        next: { revalidate: 86400 }
      });
      
      if (!dedicatedResponse.ok) {
        return NextResponse.json(
          { error: `Failed to retrieve content from Pinata: ${dedicatedResponse.statusText}` },
          { status: dedicatedResponse.status }
        );
      }
      
      // Get the content type from the response
      const contentType = dedicatedResponse.headers.get('content-type') || 'application/octet-stream';
      
      // Retrieve the content as ArrayBuffer
      const contentArrayBuffer = await dedicatedResponse.arrayBuffer();
      
      // Create a response with the content and appropriate headers
      return new Response(contentArrayBuffer, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=31536000, immutable',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    
    // Get the content type from the first response
    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    
    // Retrieve the content as ArrayBuffer
    const contentArrayBuffer = await response.arrayBuffer();
    
    // Create a response with the content and appropriate headers
    return new Response(contentArrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    console.error('Error fetching content from Pinata:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve content from Pinata' },
      { status: 500 }
    );
  }
} 