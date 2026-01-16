// hooks/useWallet.js
import { useEffect, useState } from 'react';
import { ethers } from 'ethers';

export const useWallet = () => {
  const [account, setAccount] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState('');

  // Check connection on mount
  useEffect(() => {
    const checkConnection = async () => {
      if (!window.ethereum) return;
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setAccount(accounts[0]);
        }
      } catch (err) {
        console.error('Auto-connect failed:', err);
      }
    };

    checkConnection();

    // Listen for account changes
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
        } else {
          setAccount(null);
        }
      });
    }

    return () => {
      // Cleanup listener if possible suitable for this environment
      // Note: Ethereum provider .removeListener might differ across versions/providers
      // but usually safe to ignore or implementation dependent. 
      // For standard Metamask:
      if (window.ethereum && window.ethereum.removeListener) {
        window.ethereum.removeListener('accountsChanged', () => { });
      }
    };
  }, []);

  const connectWallet = async () => {
    if (!window.ethereum) {
      setError('Harap install MetaMask terlebih dahulu');
      return;
    }
    try {
      setIsConnecting(true);
      setError('');

      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send('eth_requestAccounts', []);
      const signer = await provider.getSigner();
      const addr = await signer.getAddress();

      // Minta tanda tangan untuk memastikan user unlock & sadar login
      const message = `Login ke Koperasi Kita\n\nWallet: ${addr}\nTimestamp: ${Date.now()}`;
      await signer.signMessage(message);

      setAccount(addr);
    } catch (err) {
      console.error(err);
      if (err.code === 4001 || err.code === 'ACTION_REJECTED') {
        setError('Koneksi dibatalkan');
      } else {
        setError(err.data?.message || err.message || 'Gagal menghubungkan wallet');
      }
    } finally {
      setIsConnecting(false);
    }
  };



  const disconnectWallet = () => {
    setAccount(null);
    setError('');
  };

  return {
    account,
    isConnecting,
    connectWallet,
    disconnectWallet,
    error,
  };
};
