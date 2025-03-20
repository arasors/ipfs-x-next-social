// TypeScript tanımı için global window arayüzünü genişletme
declare global {
  interface Window {
    ethereum?: any;
  }
}

import { ethers } from 'ethers';
import { createWalletClient, custom } from 'viem';

// Ethereum sağlayıcısını oluştur
export async function createEthereumProvider() {
  if (typeof window === 'undefined') {
    return null;
  }
  
  if (window.ethereum) {
    try {
      // Metamask veya başka bir Web3 sağlayıcısı var
      const provider = new ethers.BrowserProvider(window.ethereum);
      return provider;
    } catch (error) {
      console.error('Ethereum sağlayıcısı oluşturulurken hata:', error);
      return null;
    }
  } else {
    console.log('Web3 sağlayıcısı bulunamadı. Lütfen MetaMask veya başka bir cüzdan yükleyin.');
    return null;
  }
}

// Cüzdan ile kimlik doğrulama
export async function connectWallet() {
  try {
    const provider = await createEthereumProvider();
    if (!provider) {
      throw new Error('Web3 sağlayıcısı bulunamadı');
    }
    
    // Kullanıcıdan hesaplarına erişim izni iste
    await window.ethereum.request({ method: 'eth_requestAccounts' });
    
    // Bağlı hesabı al
    const signer = await provider.getSigner();
    const address = await signer.getAddress();
    
    return {
      provider,
      signer,
      address
    };
  } catch (error) {
    console.error('Cüzdana bağlanırken hata:', error);
    throw error;
  }
}

// İmza ile kimlik doğrulama
export async function signMessage(message: string) {
  try {
    const { signer } = await connectWallet();
    const signature = await signer.signMessage(message);
    return signature;
  } catch (error) {
    console.error('Mesaj imzalanırken hata:', error);
    throw error;
  }
}

// Kullanıcının kimliğini doğrula
export async function verifySignature(message: string, signature: string, address: string): Promise<boolean> {
  try {
    const signerAddress = ethers.verifyMessage(message, signature);
    return signerAddress.toLowerCase() === address.toLowerCase();
  } catch (error) {
    console.error('İmza doğrulanırken hata:', error);
    return false;
  }
}

// Viem ile cüzdan istemcisi oluştur (ConnectKit ve diğer kütüphaneler için)
export function createViemWalletClient() {
  if (typeof window === 'undefined' || !window.ethereum) {
    return null;
  }
  
  return createWalletClient({
    transport: custom(window.ethereum)
  });
} 