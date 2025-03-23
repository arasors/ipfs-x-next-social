import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Chat | IPFS-X",
  description: "Direct messaging on IPFS-X"
};

export default function MessageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 