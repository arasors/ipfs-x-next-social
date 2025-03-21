import { NextApiRequest, NextApiResponse } from 'next';
import { v4 as uuidv4 } from 'uuid';
import { Notification, NotificationType } from '@/models/Notification';

// Sample data for generating test notifications
const userAddresses = [
  '0x1234567890123456789012345678901234567890',
  '0x2345678901234567890123456789012345678901',
  '0x3456789012345678901234567890123456789012',
  '0x4567890123456789012345678901234567890123',
];

const userNames = ['Alice', 'Bob', 'Charlie', 'Dave', 'Eve', 'Frank'];

const postIds = [
  uuidv4(), uuidv4(), uuidv4(), uuidv4(), uuidv4()
];

const postContentCIDs = [
  'QmZ4tDuvesekSs4qM5ZBKpXiZGun7S2CYtEZRB3DYXkjGx',
  'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG',
  'QmSgvgwxZGaBLqkGyWemEDqikCqU52XxsYLKtdy3vGZ8uq',
  'QmT7fTvBFM6qXQwpEgLxJeJ4fs5qvsEj2nKpXQzsmBvk3h',
];

const messageTemplates = [
  'liked your post',
  'commented on your post: "This is a great post!"',
  'mentioned you in a post',
  'started following you',
  'reposted your content',
  'System notification: Your content is trending!'
];

// Create a random notification
function createRandomNotification(recipientAddress: string): Notification {
  const types: NotificationType[] = ['like', 'comment', 'mention', 'follow', 'repost', 'system'];
  const randomType = types[Math.floor(Math.random() * types.length)];
  
  const actorIndex = Math.floor(Math.random() * userAddresses.length);
  const actorAddress = userAddresses[actorIndex];
  const actorName = userNames[Math.floor(Math.random() * userNames.length)];
  
  const postId = postIds[Math.floor(Math.random() * postIds.length)];
  const postContentCID = postContentCIDs[Math.floor(Math.random() * postContentCIDs.length)];
  
  // Create type-specific message
  let title: string;
  let message: string;
  
  switch (randomType) {
    case 'like':
      title = 'New Like';
      message = `${actorName} liked your post`;
      break;
    case 'comment':
      title = 'New Comment';
      message = `${actorName} commented on your post: "This is amazing! I like how you explained everything in detail."`;
      break;
    case 'mention':
      title = 'New Mention';
      message = `${actorName} mentioned you in a post`;
      break;
    case 'follow':
      title = 'New Follower';
      message = `${actorName} started following you`;
      break;
    case 'repost':
      title = 'New Repost';
      message = `${actorName} reposted your content`;
      break;
    case 'system':
      title = 'System Notification';
      message = 'Your content is trending and getting shared across the platform!';
      break;
    default:
      title = 'Notification';
      message = 'You have a new notification';
  }
  
  return {
    id: uuidv4(),
    type: randomType,
    timestamp: Date.now() - Math.floor(Math.random() * 86400000), // Random time in the last 24 hours
    isRead: Math.random() > 0.7, // 30% chance of being read
    actorAddress: randomType !== 'system' ? actorAddress : undefined,
    actorName: randomType !== 'system' ? actorName : undefined,
    recipientAddress,
    title,
    message,
    postId: ['like', 'comment', 'mention', 'repost'].includes(randomType) ? postId : undefined,
    postContentCID: ['like', 'comment', 'mention', 'repost'].includes(randomType) ? postContentCID : undefined,
    metadata: {
      avatar: `https://robohash.org/${actorAddress}?set=set4`
    }
  };
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  
  try {
    const { recipientAddress, count = 5 } = req.body;
    
    if (!recipientAddress) {
      return res.status(400).json({ message: 'Recipient address is required' });
    }
    
    // Generate random notifications
    const notifications: Notification[] = [];
    
    for (let i = 0; i < count; i++) {
      notifications.push(createRandomNotification(recipientAddress));
    }
    
    // Sort by timestamp (newest first)
    notifications.sort((a, b) => b.timestamp - a.timestamp);
    
    return res.status(200).json({ 
      success: true, 
      notifications,
      message: `Successfully generated ${count} test notifications`
    });
  } catch (error) {
    console.error('Error generating test notifications:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Failed to generate test notifications' 
    });
  }
} 