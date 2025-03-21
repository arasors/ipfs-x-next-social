# IPFS-X: Decentralized Social Media Platform

<p align="center">
  <img src="https://img.shields.io/badge/status-alpha-blue" alt="Status: Alpha" />
  <img src="https://img.shields.io/badge/license-MIT-green" alt="License: MIT" />
</p>

IPFS-X is a decentralized social media platform built on the InterPlanetary File System (IPFS). The project aims to create a censorship-resistant, user-owned social network where content is stored on a distributed file system rather than centralized servers.

## Features

- **Decentralized Content Storage**: All posts and media are stored on IPFS
- **Crypto Wallet Authentication**: Connect with your Web3 wallet
- **Multi-file Media Uploads**: Support for images, videos and documents
- **Real-time IPFS Content Linking**: Share your content with permanent IPFS links
- **Community Boards**: Discover content from all users
- **Mobile-responsive Design**: Works on all devices

## Technology Stack

- **Frontend**: Next.js with React 19
- **Styling**: TailwindCSS
- **State Management**: Zustand
- **Authentication**: Web3Auth
- **File System**: IPFS/Helia
- **UI Components**: ShadcnUI

## Screenshots

*Coming soon*

## Getting Started

### Prerequisites

- Node.js 18+ and npm/pnpm
- Git

### Installation

1. Clone the repository:
```bash
git clone https://github.com/arasors/ipfs-x-next-social.git
cd ipfs-x
```

2. Install dependencies:
```bash
pnpm install
```

3. Start development server:
```bash
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
ipfs-x/
├── app/                # Next.js app router pages
│   ├── explore/        # Explore page
│   ├── profile/        # User profile page
│   └── layout.tsx      # Root layout with sidebar
├── components/         # React components
│   ├── ui/             # UI components from ShadcnUI
│   ├── BoardFeed.tsx   # Main content feed component
│   ├── CreatePost.tsx  # Post creation form
│   ├── PostItem.tsx    # Individual post display
│   └── Sidebar.tsx     # Navigation sidebar
├── lib/                # Utility functions
│   └── ipfs.ts         # IPFS/Helia configuration
├── models/             # Data models
│   └── Post.ts         # Post and user data types
├── store/              # State management
│   └── postStore.ts    # Zustand store for posts
└── ...
```

## How It Works

1. **Authentication**: Users connect their crypto wallets to identify themselves
2. **Creating Content**: Users can create posts with text and multiple media files
3. **IPFS Storage**: Content is uploaded to IPFS, returning a unique Content ID (CID)
4. **Content Discovery**: Users can browse content from all users in the main feed
5. **Profile Management**: Users can view their own posts and account details

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add some amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
