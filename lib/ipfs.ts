import { createHelia } from 'helia';
import pako from 'pako';
import { strings } from '@helia/strings';
import { unixfs } from '@helia/unixfs';
import { json } from '@helia/json';
import { CID } from 'multiformats/cid';
import { MemoryBlockstore } from 'blockstore-core/memory';
import { MemoryDatastore } from 'datastore-core/memory';

// Configuration for IPFS
const CONFIG = {
  compression: {
    enabled: true,
    minSize: 1024 * 10, // Only compress files larger than 10KB
    excludeTypes: ['image/jpeg', 'image/png', 'image/webp', 'video/mp4'] // These are already compressed
  },
  chunkSize: 1024 * 256, // 256KB chunks for large files
  concurrentUploads: 3,
  gateways: [
    'https://ipfs.io/ipfs/',
    'https://gateway.pinata.cloud/ipfs/',
    'https://cloudflare-ipfs.com/ipfs/',
    'https://dweb.link/ipfs/',
    'https://ipfs.fleek.co/ipfs/'
  ]
};

// Cached Helia instance
let heliaNode: any = null;

// Create a Helia node
export const createHeliaNode = async () => {
  // Only create once and cache the instance
  if (heliaNode) return heliaNode;
  
  // Skip in server-side execution
  if (typeof window === 'undefined') {
    console.log('Skipping Helia initialization on server-side');
    return null;
  }

  try {
    const blockstore = new MemoryBlockstore();
    const datastore = new MemoryDatastore();

    // Use minimal configuration without libp2p
    heliaNode = await createHelia({
      blockstore,
      datastore
    });
    
    console.log('Helia node created successfully');
    return heliaNode;
  } catch (error) {
    console.error('Failed to create Helia node:', error);
    return null;
  }
};

// Utility to determine if data should be compressed
const shouldCompress = (data: Uint8Array, mimeType?: string): boolean => {
  if (!CONFIG.compression.enabled) return false;
  
  // Don't compress if data is smaller than threshold
  if (data.length < CONFIG.compression.minSize) return false;
  
  // Don't compress already compressed formats
  if (mimeType && CONFIG.compression.excludeTypes.includes(mimeType)) return false;
  
  return true;
};

// Compress data with gzip
const compressData = (data: Uint8Array): Uint8Array => {
  try {
    return pako.deflate(data);
  } catch (error) {
    console.error('Compression failed:', error);
    return data; // Return original data if compression fails
  }
};

// Decompress data with gzip
const decompressData = (data: Uint8Array): Uint8Array => {
  try {
    return pako.inflate(data);
  } catch (error) {
    console.error('Decompression failed:', error);
    return data; // Return original data if decompression fails
  }
};

// Store compression metadata for a CID
const storeCompressionMetadata = async (cid: CID, isCompressed: boolean) => {
  try {
    const helia = await createHeliaNode();
    if (!helia) return;
    
    const j = json(helia);
    const metadataCid = await j.add({ 
      original: cid.toString(),
      compressed: isCompressed,
      timestamp: Date.now()
    });
    
    // Store reference to metadata
    localStorage.setItem(`ipfs-meta-${cid.toString()}`, metadataCid.toString());
    return metadataCid;
  } catch (error) {
    console.error('Failed to store compression metadata:', error);
  }
};

// Get compression metadata for a CID
const getCompressionMetadata = async (cid: CID): Promise<{compressed: boolean} | null> => {
  try {
    const helia = await createHeliaNode();
    if (!helia) return null;
    
    const metadataCidStr = localStorage.getItem(`ipfs-meta-${cid.toString()}`);
    if (!metadataCidStr) return null;
    
    const metadataCid = CID.parse(metadataCidStr);
    const j = json(helia);
    return await j.get(metadataCid);
  } catch (error) {
    console.error('Failed to get compression metadata:', error);
    return null;
  }
};

// Collect bytes from an async iterable
async function collectBytes(generator: AsyncIterable<Uint8Array>): Promise<Uint8Array> {
  const chunks: Uint8Array[] = [];
  for await (const chunk of generator) {
    chunks.push(chunk);
  }
  return concatBytes(chunks);
}

// Concatenate multiple byte arrays
function concatBytes(arrays: Uint8Array[]): Uint8Array {
  // Calculate total length
  let totalLength = 0;
  for (const arr of arrays) {
    totalLength += arr.length;
  }
  
  // Create new array and copy data
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  
  return result;
}

// Add bytes to IPFS with optional compression
export const addBytes = async (bytes: Uint8Array, options?: { filename?: string, mimeType?: string }): Promise<string | null> => {
  try {
    const helia = await createHeliaNode();
    if (!helia) return null;

    const fs = unixfs(helia);
    
    let dataToStore = bytes;
    let isCompressed = false;
    
    // Apply compression if needed
    if (shouldCompress(bytes, options?.mimeType)) {
      dataToStore = compressData(bytes);
      isCompressed = true;
      console.log(`Compressed ${bytes.length} bytes to ${dataToStore.length} bytes (${Math.round((dataToStore.length / bytes.length) * 100)}%)`);
    }
    
    // For small files, add directly
    if (dataToStore.length < CONFIG.chunkSize) {
      const cid = await fs.addBytes(dataToStore);
      
      // Store compression metadata
      if (isCompressed) {
        await storeCompressionMetadata(cid, true);
      }
      
      return cid.toString();
    } 
    // For large files, handle in chunks
    else {
      // Logic for chunked upload would go here
      // This is a simplification - actual implementation would require more complex chunking logic
      const cid = await fs.addBytes(dataToStore);
      
      // Store compression metadata
      if (isCompressed) {
        await storeCompressionMetadata(cid, true);
      }
      
      return cid.toString();
    }
  } catch (error) {
    console.error('Failed to add bytes:', error);
    return null;
  }
};

// Add content to IPFS
export const addContent = async (content: string): Promise<string | null> => {
  try {
    const helia = await createHeliaNode();
    if (!helia) return null;

    const s = strings(helia);
    const cid = await s.add(content);
    return cid.toString();
  } catch (error) {
    console.error('Failed to add content:', error);
    return null;
  }
};

// Add JSON to IPFS
export const addJson = async (jsonObj: any): Promise<string | null> => {
  try {
    const helia = await createHeliaNode();
    if (!helia) return null;

    const j = json(helia);
    const cid = await j.add(jsonObj);
    return cid.toString();
  } catch (error) {
    console.error('Failed to add JSON:', error);
    return null;
  }
};

// Get content from IPFS with gateway fallback
export const getContent = async (cidStr: string): Promise<string | null> => {
  try {
    // Try to get from local node first
    const result = await getContentFromLocalNode(cidStr);
    if (result) return result;
    
    // Fallback to gateways
    return await getContentFromGateways(cidStr);
  } catch (error) {
    console.error('Failed to get content:', error);
    return null;
  }
};

// Get content from local Helia node
const getContentFromLocalNode = async (cidStr: string): Promise<string | null> => {
  try {
    const helia = await createHeliaNode();
    if (!helia) return null;

    const cid = CID.parse(cidStr);
    
    // Check if content is compressed
    const metadata = await getCompressionMetadata(cid);
    const isCompressed = metadata?.compressed || false;
    
    const s = strings(helia);
    const content = await s.get(cid);
    
    if (!isCompressed) return content;
    
    // If compressed, we need to get the raw bytes, decompress, then convert to string
    const fs = unixfs(helia);
    const compressedBytes = await collectBytes(fs.cat(cid));
    const decompressedBytes = decompressData(compressedBytes);
    
    // Convert bytes to string
    const decoder = new TextDecoder();
    return decoder.decode(decompressedBytes);
  } catch (error) {
    console.error('Failed to get content from local node:', error);
    return null;
  }
};

// Get binary content from IPFS
export const getBinaryContent = async (cidStr: string): Promise<Uint8Array | null> => {
  try {
    const helia = await createHeliaNode();
    if (!helia) return null;

    const cid = CID.parse(cidStr);
    const fs = unixfs(helia);
    
    // Check if content is compressed
    const metadata = await getCompressionMetadata(cid);
    const isCompressed = metadata?.compressed || false;
    
    const bytes = await collectBytes(fs.cat(cid));
    
    if (isCompressed) {
      return decompressData(bytes);
    }
    
    return bytes;
  } catch (error) {
    console.error('Failed to get binary content:', error);
    return null;
  }
};

// Get JSON from IPFS
export const getJson = async (cidStr: string): Promise<any | null> => {
  try {
    const helia = await createHeliaNode();
    if (!helia) return null;

    const cid = CID.parse(cidStr);
    const j = json(helia);
    return await j.get(cid);
  } catch (error) {
    console.error('Failed to get JSON:', error);
    return null;
  }
};

// Test gateways for availability and speed
const testGateways = async (): Promise<string[]> => {
  const results = await Promise.allSettled(
    CONFIG.gateways.map(async (gateway) => {
      const startTime = Date.now();
      try {
        const response = await fetch(`${gateway}QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG/readme`, { 
          method: 'HEAD',
          signal: AbortSignal.timeout(3000) // 3 second timeout
        });
        
        if (response.ok) {
          const time = Date.now() - startTime;
          return { gateway, time, working: true };
        }
        return { gateway, working: false };
      } catch (error) {
        return { gateway, working: false };
      }
    })
  );
  
  // Filter working gateways and sort by response time
  const workingGateways = results
    .filter((result): result is PromiseFulfilledResult<{gateway: string, time: number, working: true}> => 
      result.status === 'fulfilled' && result.value.working)
    .sort((a, b) => a.value.time - b.value.time)
    .map(result => result.value.gateway);
    
  return workingGateways.length > 0 ? workingGateways : CONFIG.gateways;
};

// Cache for working gateways
let cachedGateways: string[] | null = null;

// Get content from IPFS gateways
const getContentFromGateways = async (cidStr: string): Promise<string | null> => {
  if (!cachedGateways) {
    cachedGateways = await testGateways();
  }
  
  // Try gateways in order of previously measured speed
  for (const gateway of cachedGateways) {
    try {
      const response = await fetch(`${gateway}${cidStr}`);
      if (response.ok) {
        return await response.text();
      }
    } catch (error) {
      continue; // Try next gateway
    }
  }
  
  // If all gateways fail, reset cache and return null
  cachedGateways = null;
  return null;
};

// Get binary content from IPFS gateways
export const getBinaryContentFromGateways = async (cidStr: string): Promise<Uint8Array | null> => {
  if (!cachedGateways) {
    cachedGateways = await testGateways();
  }
  
  // Try gateways in order of previously measured speed
  for (const gateway of cachedGateways) {
    try {
      const response = await fetch(`${gateway}${cidStr}`);
      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        return new Uint8Array(arrayBuffer);
      }
    } catch (error) {
      continue; // Try next gateway
    }
  }
  
  // If all gateways fail, reset cache and return null
  cachedGateways = null;
  return null;
}; 

export const addJsonContent = async (jsonObj: any): Promise<string | null> => {
  const cid = await addJson(jsonObj);
  return cid;
};