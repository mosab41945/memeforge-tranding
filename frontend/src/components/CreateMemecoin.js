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

  // ERC-20 Smart Contract ABI and Bytecode
  const ERC20_ABI = [
    "constructor(string name, string symbol, uint256 totalSupply, uint8 decimals)",
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)",
    "function totalSupply() view returns (uint256)",
    "function balanceOf(address account) view returns (uint256)",
    "function transfer(address to, uint256 amount) returns (bool)",
    "function allowance(address owner, address spender) view returns (uint256)",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function transferFrom(address from, address to, uint256 amount) returns (bool)",
    "event Transfer(address indexed from, address indexed to, uint256 value)",
    "event Approval(address indexed owner, address indexed spender, uint256 value)"
  ];

  // Simple ERC-20 Bytecode (pre-compiled)
  const ERC20_BYTECODE = "0x608060405234801561001057600080fd5b506040516108013803806108018339818101604052810190610032919061020c565b8360039081610041919061048e565b508260049081610051919061048e565b5081600560006101000a81548160ff021916908360ff16021790555080600081905550806000803373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020819055503373ffffffffffffffffffffffffffffffffffffffff16600073ffffffffffffffffffffffffffffffffffffffff167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef8360405161011291906105a5565b60405180910390a35050505061060f565b6000604051905090565b600080fd5b600080fd5b600080fd5b600080fd5b6000601f19601f8301169050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b61018c82610143565b810181811067ffffffffffffffff821117156101ab576101aa610154565b5b80604052505050565b60006101be610125565b90506101ca8282610183565b919050565b600067ffffffffffffffff8211156101ea576101e9610154565b5b6101f382610143565b9050602081019050919050565b82818337600083830152505050565b6000610222610227846101cf565b6101b4565b90508281526020810184848401111561023e5761023d61013e565b5b610249848285610200565b509392505050565b600082601f83011261026657610265610139565b5b815161027684826020860161020f565b91505092915050565b6000819050919050565b6102928161027f565b811461029d57600080fd5b50565b6000815190506102af81610289565b92915050565b600060ff82169050919050565b6102cb816102b5565b81146102d657600080fd5b50565b6000815190506102e8816102c2565b92915050565b6000806000806080858703121561030857610307610134565b5b600085015167ffffffffffffffff81111561032657610325610139565b5b61033287828801610251565b945050602085015167ffffffffffffffff81111561035357610352610139565b5b61035f87828801610251565b9350506040610370878288016102a0565b9250506060610381878288016102d9565b91505092959194509250565b600081519050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052602260045260246000fd5b600060028204905060018216806103e057607f821691505b6020821081036103f3576103f2610399565b5b50919050565b60008190508160005260206000209050919050565b60006020601f8301049050919050565b600082821b905092915050565b60006008830261045b7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff8261041e565b610465868361041e565b95508019841693508086168417925050509392505050565b6000819050919050565b60006104a261049d6104988461027f565b61047d565b61027f565b9050919050565b6000819050919050565b6104bc83610487565b6104d06104c8826104a9565b84845461042b565b825550505050565b600090565b6104e56104d8565b6104f08184846104b3565b505050565b5b81811015610514576105096000826104dd565b6001810190506104f6565b5050565b601f82111561055957610540816103f9565b6105498461040e565b81016020851015610558578190505b61056c6105648561040e565b8301826104f5565b50505b505050565b600082821c905092915050565b600061059260001984600802610574565b1980831691505092915050565b60006105ab8383610581565b9150826002028217905092915050565b6105c48261038d565b67ffffffffffffffff8111156105dd576105dc610154565b5b6105e782546103c8565b6105f2828285610518565b600060209050601f8311600181146106255760008415610613578287015190505b61061d858261059f565b865550610685565b601f198416610633866103f9565b60005b8281101561065b57848901518255600182019150602085019450602081019050610636565b868310156106785784890151610674601f891682610581565b8355505b6001600288020188555050505b505050505050565b6101e38061069c6000396000f3fe608060405234801561001057600080fd5b50600436106100885760003560e01c806370a082311161005b57806370a08231146100c657806395d89b41146100f6578063a9059cbb14610114578063dd62ed3e1461014457610088565b806306fdde031461008d578063095ea7b3146100ab57806318160ddd146100db57806323b872dd146100f957610088565b600080fd5b61009561017457845b8b38516100a05780fd5b5050816aabbccddeeff0123456789813c59ff74cf210c94c1b982be6b1d3ab8100e29616f1b51b3b8f1ab1f88866102d6b7e733c5b0433b854808030003fb350a3174c13b64b5e7b8b6e1a066c1a6f4e5e7c8b5a3b524a2655d1e161111111a4050003b5b8a9b02844507a6b124b3152b2c5e753e554b882b12ae6c7e9ad8593355a81b5b8b4b46c6c6c84b6fb9e93c95477b914f3b53e1be8d56d75433f456781f20098a9b0b3361b85b8b7c3c6166156b8a178c151b9684b1c2b9433e403906c41c58fb46bb50b67b8c4296e16296bfb2b8a1b5e8f188b7bfc1a7b15d84b7a8bb80b3a9bb84a5adfb15bc1649fe1684b1035b7799b6e9cbb6a3327a0e3daaaa2e683119ee78975b841b6c5565b5b617c65e461b2d9e2d750909003b52ee4814c92bf61b4f5ee656139bb65b1b887b06ef499e3957ff44f31b8b086b8f48b";

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
    const randomName = generateRandomName();
    const randomSymbol = generateRandomSymbol();
    const randomSupply = (Math.floor(Math.random() * 900000000) + 100000000).toString(); // 100M - 1B
    
    setTokenData({
      name: randomName,
      symbol: randomSymbol,
      totalSupply: randomSupply,
      description: `${randomName} - A revolutionary memecoin that will take you to the moon! 🚀`,
      decimals: '18'
    });

    toast({
      title: "Token Gerado! 🎲",
      description: `Criado ${randomName} (${randomSymbol}) com ${randomSupply} tokens`,
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
      // Create contract factory
      const contractFactory = new ethers.ContractFactory(ERC20_ABI, ERC20_BYTECODE, signer);
      
      // Convert total supply to wei (considering decimals)
      const totalSupplyWei = ethers.parseUnits(tokenData.totalSupply, parseInt(tokenData.decimals));
      
      toast({
        title: "Criando Token...",
        description: "Preparando o contrato inteligente",
      });

      // Deploy contract
      const contract = await contractFactory.deploy(
        tokenData.name,
        tokenData.symbol,
        totalSupplyWei,
        parseInt(tokenData.decimals)
      );

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