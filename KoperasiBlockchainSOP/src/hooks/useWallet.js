// hooks/useWallet.js
import { useEffect, useState } from 'react';
import { ethers } from 'ethers';

export const useWallet = () => {
  const [account, setAccount] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isCheckingConnection, setIsCheckingConnection] = useState(true);
  const [error, setError] = useState('');

  // Check connection on mount
  useEffect(() => {
    const checkConnection = async () => {
      if (!window.ethereum) {
        setIsCheckingConnection(false);
        return;
      }

      // [FIX] Cek apakah user pernah login sebelumnya (explicit login)
      const isConnected = localStorage.getItem('isWalletConnected') === 'true';
      if (!isConnected) {
        setIsCheckingConnection(false);
        return;
      }

      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          const addr = accounts[0].toLowerCase();
          const token = localStorage.getItem(`auth_token_${addr}`);
          if (token) {
            setAccount(accounts[0]);
          } else {
            console.log(`[Auth] Auto-connect blocked: No JWT token found in localStorage for ${accounts[0]}.`);
            localStorage.removeItem('isWalletConnected');
          }
        }
      } catch (err) {
        console.error('Auto-connect failed:', err);
      } finally {
        setIsCheckingConnection(false);
      }
    };

    checkConnection();

    // Listen for account changes
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        // [FIX] Hanya auto-update jika statusnya "Connected"
        const isConnected = localStorage.getItem('isWalletConnected') === 'true';

        if (accounts.length > 0 && isConnected) {
          const addr = accounts[0].toLowerCase();
          const token = localStorage.getItem(`auth_token_${addr}`);
          if (token) {
            setAccount(accounts[0]);
          } else {
            console.log(`[Auth] Account changed to ${accounts[0]} but no JWT token found. Disconnecting...`);
            setAccount(null);
            localStorage.removeItem('isWalletConnected');
          }
        } else {
          setAccount(null);
          // Jika akun kosong (disconnect dari wallet), kita anggap logout juga
          if (accounts.length === 0) {
            localStorage.removeItem('isWalletConnected');
          }
        }
      });
    }

    return () => {
      if (window.ethereum && window.ethereum.removeListener) {
        window.ethereum.removeListener('accountsChanged', () => { });
      }
    };
  }, []);

  // [SECURITY] Listen to unauthorized API events and trigger clean disconnection
  useEffect(() => {
    const handleUnauthorized = (e) => {
      const eventAddr = e.detail?.address;
      if (eventAddr && account && eventAddr.toLowerCase() === account.toLowerCase()) {
        console.log(`[Auth] Received unauthorized event for current account. Disconnecting...`);
        disconnectWallet();
      }
    };
    window.addEventListener('auth-unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('auth-unauthorized', handleUnauthorized);
    };
  }, [account]);

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
      const timestamp = Date.now();
      const message = `Login ke Koperasi Kita\n\nWallet: ${addr}\nTimestamp: ${timestamp}`;
      const signature = await signer.signMessage(message);

      // [SECURITY] Kirim signature ke backend untuk mendapatkan JWT session token
      try {
        const authRes = await fetch(window.API_BASE + '/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address: addr, message, signature })
        });
        const authData = await authRes.json();
        if (authData.success && authData.token) {
          localStorage.setItem(`auth_token_${addr.toLowerCase()}`, authData.token);
          console.log('[Auth] JWT session token acquired successfully.');
        } else {
          console.warn('[Auth] Failed to get session token:', authData.error);
        }
      } catch (authErr) {
        console.warn('[Auth] Backend auth unavailable, proceeding without token:', authErr.message);
      }

      setAccount(addr);
      // [FIX] Simpan status login
      localStorage.setItem('isWalletConnected', 'true');
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
    // [SECURITY] Clear JWT token
    if (account) {
      localStorage.removeItem(`auth_token_${account.toLowerCase()}`);
    }
    setAccount(null);
    setError('');
    // [FIX] Hapus status login
    localStorage.removeItem('isWalletConnected');
  };

  return {
    account,
    isConnecting,
    isCheckingConnection,
    connectWallet,
    disconnectWallet,
    error,
  };
};
