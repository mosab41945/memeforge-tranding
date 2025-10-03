import React, { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';

const Web3Context = createContext();

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
};

export const Web3Provider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [walletType, setWalletType] = useState(null);
  const [balance, setBalance] = useState('0');

  // Supported networks
  const supportedNetworks = {
    1: { name: 'Ethereum Mainnet', currency: 'ETH', rpcUrl: 'https://mainnet.infura.io/v3/' },
    56: { name: 'Binance Smart Chain', currency: 'BNB', rpcUrl: 'https://bsc-dataseed.binance.org/' },
    137: { name: 'Polygon', currency: 'MATIC', rpcUrl: 'https://polygon-rpc.com/' }
  };

  // Check if MetaMask is installed
  const checkMetaMaskInstalled = () => {
    return typeof window !== 'undefined' && window.ethereum?.isMetaMask;
  };

  // Connect to MetaMask
  const connectMetaMask = async () => {
    try {
      if (!checkMetaMaskInstalled()) {
        throw new Error('MetaMask não está instalado. Instale a extensão MetaMask para continuar.');
      }

      // Request account access
      await window.ethereum.request({ method: 'eth_requestAccounts' });

      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      const web3Signer = await web3Provider.getSigner();
      const address = await web3Signer.getAddress();
      const network = await web3Provider.getNetwork();
      const balance = await web3Provider.getBalance(address);

      setProvider(web3Provider);
      setSigner(web3Signer);
      setAccount(address);
      setChainId(Number(network.chainId));
      setWalletType('metamask');
      setBalance(ethers.formatEther(balance));
      setIsConnected(true);

      // Save connection to backend
      await saveWalletConnection(address, 'metamask', Number(network.chainId));

      return { success: true, address, network: network.chainId };
    } catch (error) {
      console.error('Erro ao conectar MetaMask:', error);
      throw error;
    }
  };

  // Connect to Binance Wallet
  const connectBinanceWallet = async () => {
    try {
      if (!window.BinanceChain) {
        throw new Error('Binance Wallet não está instalado. Instale a extensão Binance Wallet para continuar.');
      }

      const accounts = await window.BinanceChain.request({ method: 'eth_requestAccounts' });
      
      const web3Provider = new ethers.BrowserProvider(window.BinanceChain);
      const web3Signer = await web3Provider.getSigner();
      const address = accounts[0];
      const network = await web3Provider.getNetwork();
      const balance = await web3Provider.getBalance(address);

      setProvider(web3Provider);
      setSigner(web3Signer);
      setAccount(address);
      setChainId(Number(network.chainId));
      setWalletType('binance');
      setBalance(ethers.formatEther(balance));
      setIsConnected(true);

      // Save connection to backend
      await saveWalletConnection(address, 'binance', Number(network.chainId));

      return { success: true, address, network: network.chainId };
    } catch (error) {
      console.error('Erro ao conectar Binance Wallet:', error);
      throw error;
    }
  };

  // Switch network
  const switchNetwork = async (targetChainId) => {
    try {
      const targetChainIdHex = `0x${targetChainId.toString(16)}`;
      
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: targetChainIdHex }],
      });

      setChainId(targetChainId);
      return true;
    } catch (error) {
      // If network doesn't exist, add it
      if (error.code === 4902) {
        await addNetwork(targetChainId);
        return true;
      }
      throw error;
    }
  };

  // Add network to wallet
  const addNetwork = async (chainId) => {
    const networkConfig = supportedNetworks[chainId];
    if (!networkConfig) {
      throw new Error('Rede não suportada');
    }

    const chainIdHex = `0x${chainId.toString(16)}`;

    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [{
        chainId: chainIdHex,
        chainName: networkConfig.name,
        nativeCurrency: {
          name: networkConfig.currency,
          symbol: networkConfig.currency,
          decimals: 18
        },
        rpcUrls: [networkConfig.rpcUrl],
      }],
    });

    setChainId(chainId);
  };

  // Save wallet connection to backend
  const saveWalletConnection = async (address, walletType, chainId) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/wallet/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address,
          wallet_type: walletType,
          chain_id: chainId
        }),
      });

      if (!response.ok) {
        console.error('Failed to save wallet connection');
      }
    } catch (error) {
      console.error('Error saving wallet connection:', error);
    }
  };

  // Disconnect wallet
  const disconnect = () => {
    setIsConnected(false);
    setAccount(null);
    setProvider(null);
    setSigner(null);
    setChainId(null);
    setWalletType(null);
    setBalance('0');
  };

  // Update balance
  const updateBalance = async () => {
    if (provider && account) {
      try {
        const balance = await provider.getBalance(account);
        setBalance(ethers.formatEther(balance));
      } catch (error) {
        console.error('Error updating balance:', error);
      }
    }
  };

  // Listen for account and network changes
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length === 0) {
          disconnect();
        } else {
          setAccount(accounts[0]);
          updateBalance();
        }
      });

      window.ethereum.on('chainChanged', (chainId) => {
        setChainId(parseInt(chainId, 16));
      });
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners();
      }
    };
  }, []);

  // Auto-connect on load
  useEffect(() => {
    const autoConnect = async () => {
      if (checkMetaMaskInstalled()) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            await connectMetaMask();
          }
        } catch (error) {
          console.error('Auto-connect failed:', error);
        }
      }
    };

    autoConnect();
  }, []);

  const value = {
    isConnected,
    account,
    provider,
    signer,
    chainId,
    walletType,
    balance,
    supportedNetworks,
    connectMetaMask,
    connectBinanceWallet,
    switchNetwork,
    disconnect,
    updateBalance,
    checkMetaMaskInstalled
  };

  return (
    <Web3Context.Provider value={value}>
      {children}
    </Web3Context.Provider>
  );
};