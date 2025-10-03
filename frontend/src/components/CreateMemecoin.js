import React, { useState } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { 
  Coins, 
  Sparkles, 
  Rocket, 
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { ethers } from 'ethers';
import { deployMemecoin, TOKEN_TEMPLATES } from '../contracts/MemecoinContract';

const CreateMemecoin = () => {
  const { signer, account, chainId, isConnected } = useWeb3();
  const { toast } = useToast();
  
  const [isCreating, setIsCreating] = useState(false);
  const [tokenData, setTokenData] = useState({
    name: '',
    symbol: '',
    totalSupply: '1000000',
    description: '',
    decimals: '18'
  });
  const [deployedToken, setDeployedToken] = useState(null);

  // Load templates for quick selection
  const [availableTemplates] = useState(TOKEN_TEMPLATES);

  const generateRandomName = () => {
    const adjectives = ['Moon', 'Rocket', 'Diamond', 'Laser', 'Cyber', 'Neon', 'Turbo', 'Super', 'Mega', 'Ultra'];
    const nouns = ['Doge', 'Pepe', 'Shiba', 'Cat', 'Frog', 'Coin', 'Token', 'Meme', 'Ape', 'Bird'];
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    return `${adj}${noun}`;
  };

  const generateRandomSymbol = () => {
    const name = generateRandomName();
    return name.substring(0, 6).toUpperCase();
  };

  const handleInputChange = (field, value) => {
    setTokenData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const generateRandomToken = () => {
    const templates = Object.keys(availableTemplates);
    const randomTemplate = templates[Math.floor(Math.random() * templates.length)];
    const template = availableTemplates[randomTemplate];
    
    setTokenData(template);

    toast({
      title: "Template Aplicado! 🎲",
      description: `Aplicado template: ${template.name} (${template.symbol})`,
    });
  };

  const applyTemplate = (templateKey) => {
    const template = availableTemplates[templateKey];
    setTokenData(template);
    
    toast({
      title: "Template Aplicado! ✨",
      description: `Template ${template.name} aplicado`,
    });
  };

  const deployToken = async () => {
    if (!isConnected || !signer) {
      toast({
        title: "Erro",
        description: "Conecte sua carteira primeiro",
        variant: "destructive"
      });
      return;
    }

    if (!tokenData.name || !tokenData.symbol || !tokenData.totalSupply) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    setIsCreating(true);

    try {
      toast({
        title: "Criando Token...",
        description: "Preparando o contrato inteligente",
      });

      // Deploy using our helper function
      const contract = await deployMemecoin(signer, tokenData);

      toast({
        title: "Aguardando Confirmação...",
        description: "Aguarde a transação ser minerada na blockchain",
      });

      // Wait for deployment
      await contract.waitForDeployment();
      const contractAddress = await contract.getAddress();

      // Save to backend
      await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/memecoin/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: tokenData.name,
          symbol: tokenData.symbol,
          contract_address: contractAddress,
          total_supply: tokenData.totalSupply,
          decimals: parseInt(tokenData.decimals),
          description: tokenData.description,
          creator_address: account,
          chain_id: chainId,
          transaction_hash: contract.deploymentTransaction()?.hash
        })
      });

      setDeployedToken({
        name: tokenData.name,
        symbol: tokenData.symbol,
        address: contractAddress,
        totalSupply: tokenData.totalSupply,
        txHash: contract.deploymentTransaction()?.hash
      });

      toast({
        title: "🎉 Memecoin Criada com Sucesso!",
        description: `${tokenData.name} (${tokenData.symbol}) foi implantada na blockchain!`,
      });

      // Reset form
      setTokenData({
        name: '',
        symbol: '',
        totalSupply: '1000000',
        description: '',
        decimals: '18'
      });

    } catch (error) {
      console.error('Error deploying token:', error);
      toast({
        title: "Erro na Criação",
        description: error.message || "Falha ao criar a memecoin",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  const getNetworkName = () => {
    const networks = {
      1: 'Ethereum',
      56: 'Binance Smart Chain',
      137: 'Polygon'
    };
    return networks[chainId] || 'Rede Atual';
  };

  if (!isConnected) {
    return (
      <Card className="text-center">
        <CardContent className="pt-6">
          <Coins className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Conecte sua Carteira</h3>
          <p className="text-gray-600">
            Para criar sua própria memecoin, conecte sua carteira primeiro.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-purple-600" />
            Criar Sua Memecoin
          </CardTitle>
          <CardDescription>
            Crie sua própria memecoin real na blockchain {getNetworkName()}. 
            Será um token ERC-20 verdadeiro!
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Detalhes do Token</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button 
                onClick={generateRandomToken} 
                variant="outline" 
                size="sm"
                className="mb-4"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Gerar Aleatório
              </Button>
            </div>

            <div>
              <Label htmlFor="name">Nome do Token *</Label>
              <Input
                id="name"
                value={tokenData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="ex: MoonDoge"
                maxLength={50}
              />
            </div>

            <div>
              <Label htmlFor="symbol">Símbolo *</Label>
              <Input
                id="symbol"
                value={tokenData.symbol}
                onChange={(e) => handleInputChange('symbol', e.target.value.toUpperCase())}
                placeholder="ex: MDOGE"
                maxLength={10}
              />
            </div>

            <div>
              <Label htmlFor="totalSupply">Supply Total *</Label>
              <Input
                id="totalSupply"
                type="number"
                value={tokenData.totalSupply}
                onChange={(e) => handleInputChange('totalSupply', e.target.value)}
                placeholder="1000000"
                min="1"
              />
            </div>

            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={tokenData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Descreva sua memecoin..."
                rows={3}
              />
            </div>

            <Button 
              onClick={deployToken} 
              disabled={isCreating || !tokenData.name || !tokenData.symbol}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando Token...
                </>
              ) : (
                <>
                  <Rocket className="mr-2 h-4 w-4" />
                  Criar Memecoin Real
                </>
              )}
            </Button>

            <div className="text-xs text-gray-500 space-y-1">
              <p className="flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Esta ação criará um token real na blockchain
              </p>
              <p>• Taxa de rede será necessária para o deploy</p>
              <p>• O token será ERC-20 padrão</p>
              <p>• Você será o proprietário inicial de todos os tokens</p>
            </div>
          </CardContent>
        </Card>

        {/* Preview/Result */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Preview / Resultado</CardTitle>
          </CardHeader>
          <CardContent>
            {tokenData.name && tokenData.symbol ? (
              <div className="space-y-4">
                <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                  <h3 className="font-bold text-xl">{tokenData.name}</h3>
                  <Badge variant="secondary" className="mt-1">{tokenData.symbol}</Badge>
                  <p className="text-sm text-gray-600 mt-2">
                    Supply: {parseInt(tokenData.totalSupply).toLocaleString()} tokens
                  </p>
                  <p className="text-sm text-gray-600">
                    Rede: {getNetworkName()}
                  </p>
                  {tokenData.description && (
                    <p className="text-sm text-gray-700 mt-2">{tokenData.description}</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <Coins className="mx-auto h-12 w-12 mb-2" />
                <p>Preencha os dados para ver o preview</p>
              </div>
            )}

            {deployedToken && (
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <h4 className="font-semibold text-green-800">Token Criado com Sucesso!</h4>
                </div>
                <div className="space-y-2 text-sm">
                  <p><strong>Nome:</strong> {deployedToken.name}</p>
                  <p><strong>Símbolo:</strong> {deployedToken.symbol}</p>
                  <p><strong>Endereço:</strong> 
                    <code className="bg-gray-100 px-1 rounded text-xs ml-1">
                      {deployedToken.address}
                    </code>
                  </p>
                  <p><strong>Supply:</strong> {parseInt(deployedToken.totalSupply).toLocaleString()}</p>
                  {deployedToken.txHash && (
                    <p><strong>Hash da Transação:</strong>
                      <code className="bg-gray-100 px-1 rounded text-xs ml-1 break-all">
                        {deployedToken.txHash}
                      </code>
                    </p>
                  )}
                </div>
                <p className="text-xs text-green-600 mt-3">
                  ✅ Sua memecoin foi criada e está funcionando na blockchain!
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreateMemecoin;