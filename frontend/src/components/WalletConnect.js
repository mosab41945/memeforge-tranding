import React, { useState } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Wallet, ExternalLink, Copy, LogOut } from 'lucide-react';
import { useToast } from '../hooks/use-toast';

const WalletConnect = () => {
  const {
    isConnected,
    account,
    chainId,
    walletType,
    balance,
    supportedNetworks,
    connectMetaMask,
    connectBinanceWallet,
    switchNetwork,
    disconnect,
    checkMetaMaskInstalled
  } = useWeb3();
  
  const { toast } = useToast();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleConnectMetaMask = async () => {
    setIsConnecting(true);
    try {
      await connectMetaMask();
      setIsOpen(false);
      toast({
        title: "MetaMask Conectado!",
        description: "Sua carteira foi conectada com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro na Conexão",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleConnectBinance = async () => {
    setIsConnecting(true);
    try {
      await connectBinanceWallet();
      setIsOpen(false);
      toast({
        title: "Binance Wallet Conectado!",
        description: "Sua carteira foi conectada com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro na Conexão",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSwitchNetwork = async (networkId) => {
    try {
      await switchNetwork(networkId);
      toast({
        title: "Rede Alterada",
        description: `Conectado à ${supportedNetworks[networkId].name}`,
      });
    } catch (error) {
      toast({
        title: "Erro ao Trocar Rede",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(account);
    toast({
      title: "Endereço Copiado",
      description: "Endereço da carteira copiado para a área de transferência",
    });
  };

  const formatAddress = (address) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatBalance = (balance) => {
    return parseFloat(balance).toFixed(4);
  };

  const getCurrentNetwork = () => {
    return supportedNetworks[chainId];
  };

  if (isConnected) {
    return (
      <div className="flex items-center gap-4">
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="font-mono text-sm">{formatAddress(account)}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyAddress}
                  className="h-6 w-6 p-0"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
              
              <Badge variant="secondary" className="capitalize">
                {walletType}
              </Badge>
              
              {getCurrentNetwork() && (
                <Badge variant="outline">
                  {getCurrentNetwork().name}
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-medium">
                  {formatBalance(balance)} {getCurrentNetwork()?.currency || 'ETH'}
                </p>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={disconnect}
                className="h-8"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Network Switcher */}
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              Trocar Rede
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Selecionar Rede</DialogTitle>
            </DialogHeader>
            <div className="grid gap-3">
              {Object.entries(supportedNetworks).map(([id, network]) => (
                <Card 
                  key={id}
                  className={`cursor-pointer transition-colors ${
                    chainId === parseInt(id) 
                      ? 'bg-blue-50 border-blue-300' 
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => handleSwitchNetwork(parseInt(id))}
                >
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <h3 className="font-medium">{network.name}</h3>
                      <p className="text-sm text-gray-500">
                        Moeda: {network.currency}
                      </p>
                    </div>
                    {chainId === parseInt(id) && (
                      <Badge variant="default">Conectado</Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
          <Wallet className="mr-2 h-4 w-4" />
          Conectar Carteira
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Conectar Carteira</DialogTitle>
          <DialogDescription className="text-center">
            Escolha sua carteira preferida para começar a fazer trading de memecoins
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          {/* MetaMask */}
          <Card 
            className={`cursor-pointer transition-colors hover:bg-orange-50 hover:border-orange-300 ${
              !checkMetaMaskInstalled() ? 'opacity-50' : ''
            }`}
            onClick={checkMetaMaskInstalled() ? handleConnectMetaMask : undefined}
          >
            <CardContent className="flex items-center gap-4 p-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <img 
                  src="https://raw.githubusercontent.com/MetaMask/brand-resources/master/SVG/metamask-fox.svg" 
                  alt="MetaMask" 
                  className="w-8 h-8"
                />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">MetaMask</h3>
                <p className="text-sm text-gray-600">
                  {checkMetaMaskInstalled() 
                    ? 'Conectar com MetaMask' 
                    : 'MetaMask não instalado'
                  }
                </p>
              </div>
              {!checkMetaMaskInstalled() && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open('https://metamask.io/download/', '_blank');
                  }}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Binance Wallet */}
          <Card 
            className="cursor-pointer transition-colors hover:bg-yellow-50 hover:border-yellow-300"
            onClick={handleConnectBinance}
          >
            <CardContent className="flex items-center gap-4 p-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">B</span>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Binance Wallet</h3>
                <p className="text-sm text-gray-600">
                  Conectar com Binance Wallet
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {isConnecting && (
          <div className="text-center py-4">
            <div className="inline-flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-sm text-gray-600">Conectando...</span>
            </div>
          </div>
        )}

        <div className="text-center text-xs text-gray-500 mt-4">
          Ao conectar, você concorda com nossos termos de uso e política de privacidade
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WalletConnect;