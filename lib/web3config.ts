import { getDefaultConfig } from "connectkit";
import { createConfig } from "wagmi";
import { mainnet, sepolia } from "wagmi/chains";

export const chains = [mainnet, sepolia];

export const config = createConfig(
  getDefaultConfig({
    // ConnectKit yapılandırması
    appName: "IPFS-X",
    walletConnectProjectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "",
    chains: [mainnet, sepolia],
    // Diğer seçenekler
    ssr: true,
  }),
); 