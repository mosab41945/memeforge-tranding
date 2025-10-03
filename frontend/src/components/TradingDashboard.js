import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Zap, 
  ArrowUpRight, 
  ArrowDownRight,
  Search,
  RefreshCw,
  Flame
} from 'lucide-react';
import { useToast } from '../hooks/use-toast';

const TradingDashboard = () => {
  const { account, isConnected } = useWeb3();
  const { toast } = useToast();
  
  const [cryptoPrices, setCryptoPrices] = useState({});
  const [trendingCoins, setTrendingCoins] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedToken, setSelectedToken] = useState(null);
  const [tradeAmount, setTradeAmount] = useState('');
  const [tradeType, setTradeType] = useState('buy');
  const [portfolio, setPortfolio] = useState({ tokens: [], total_value_usd: 0 });
  const [trades, setTrades] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);

  // Popular memecoins to display
  const popularMemecoins = [
    'dogecoin',
    'shiba-inu',
    'pepe',
    'bonk',
    'floki',
    'baby-doge-coin',
    'wojak',
    'meme'
  ];

  // Fetch crypto prices
  const fetchCryptoPrices = async () => {
    try {
      const symbols = popularMemecoins.join(',');
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/crypto/prices?symbols=${symbols}`);
      const data = await response.json();
      setCryptoPrices(data.prices || {});
    } catch (error) {
      console.error('Error fetching prices:', error);
    }
  };

  // Fetch trending coins
  const fetchTrendingCoins = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/crypto/trending`);
      const data = await response.json();
      setTrendingCoins(data.trending?.slice(0, 10) || []);
    } catch (error) {
      console.error('Error fetching trending coins:', error);
    }
  };

  // Search tokens
  const searchTokens = async (query) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/crypto/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      setSearchResults(data.tokens || []);
    } catch (error) {
      console.error('Error searching tokens:', error);
    }
  };

  // Fetch portfolio
  const fetchPortfolio = async () => {
    if (!account) return;

    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/wallet/${account}/portfolio`);
      const data = await response.json();
      setPortfolio(data || { tokens: [], total_value_usd: 0 });
    } catch (error) {
      console.error('Error fetching portfolio:', error);
    }
  };

  // Fetch trade history
  const fetchTrades = async () => {
    if (!account) return;

    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/wallet/${account}/trades`);
      const data = await response.json();
      setTrades(data.trades || []);
    } catch (error) {
      console.error('Error fetching trades:', error);
    }
  };

  // Execute trade
  const executeTrade = async () => {
    if (!selectedToken || !tradeAmount || !account) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/trade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          wallet_address: account,
          token_symbol: selectedToken.symbol,
          token_address: selectedToken.id,
          trade_type: tradeType,
          amount: parseFloat(tradeAmount)
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: "Trade Executado!",
          description: `${tradeType === 'buy' ? 'Compra' : 'Venda'} de ${tradeAmount} ${selectedToken.symbol} registrada`
        });
        setIsTradeModalOpen(false);
        setTradeAmount('');
        fetchPortfolio();
        fetchTrades();
      } else {
        throw new Error(data.detail || 'Erro ao executar trade');
      }
    } catch (error) {
      toast({
        title: "Erro no Trade",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Format price with change indicator
  const formatPriceChange = (price, change) => {
    const isPositive = change && change > 0;
    return (
      <div className="flex items-center gap-1">
        <span className="font-semibold">${price?.toFixed(6) || '0.000000'}</span>
        {change && (
          <Badge 
            variant={isPositive ? "default" : "destructive"}
            className={`text-xs ${isPositive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
          >
            {isPositive ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
            {Math.abs(change).toFixed(2)}%
          </Badge>
        )}
      </div>
    );
  };

  useEffect(() => {
    fetchCryptoPrices();
    fetchTrendingCoins();
    
    const interval = setInterval(() => {
      fetchCryptoPrices();
    }, 30000); // Update prices every 30 seconds

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isConnected && account) {
      fetchPortfolio();
      fetchTrades();
    }
  }, [isConnected, account]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (searchQuery) {
        searchTokens(searchQuery);
      }
    }, 500);

    return () => clearTimeout(debounce);
  }, [searchQuery]);

  if (!isConnected) {
    return (
      <Card className="text-center p-8">
        <CardContent>
          <Zap className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Conecte sua Carteira</h3>
          <p className="text-gray-600">
            Para começar a fazer trading de memecoins, conecte sua carteira MetaMask ou Binance.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            MemeForge Trading
          </h1>
          <p className="text-gray-600">Faça trading de memecoins com segurança e facilidade</p>
        </div>
        <Button onClick={fetchCryptoPrices} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar Preços
        </Button>
      </div>

      <Tabs defaultValue="market" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="market">Mercado</TabsTrigger>
          <TabsTrigger value="portfolio">Portfólio</TabsTrigger>
          <TabsTrigger value="trade">Trading</TabsTrigger>
          <TabsTrigger value="create">Criar Memecoin</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
        </TabsList>

        {/* Market Tab */}
        <TabsContent value="market" className="space-y-6">
          {/* Trending Coins */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Flame className="h-5 w-5 text-orange-500" />
                Trending Memecoins
              </CardTitle>
              <CardDescription>
                As memecoins mais populares do momento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {trendingCoins.map((coin, index) => (
                  <Card key={coin.item.id} className="bg-gradient-to-br from-gray-50 to-gray-100">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <img 
                          src={coin.item.large} 
                          alt={coin.item.name} 
                          className="w-8 h-8 rounded-full"
                        />
                        <div>
                          <h4 className="font-semibold text-sm">{coin.item.symbol.toUpperCase()}</h4>
                          <p className="text-xs text-gray-500">#{index + 1}</p>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 truncate">{coin.item.name}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Popular Memecoins */}
          <Card>
            <CardHeader>
              <CardTitle>Memecoins Populares</CardTitle>
              <CardDescription>
                Preços em tempo real das principais memecoins
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {Object.entries(cryptoPrices).map(([id, data]) => (
                  <div key={id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div>
                      <h4 className="font-semibold capitalize">{id.replace('-', ' ')}</h4>
                      <p className="text-sm text-gray-500">24h Change</p>
                    </div>
                    <div className="text-right">
                      {formatPriceChange(data.usd, data.usd_24h_change)}
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => {
                        setSelectedToken({ id, symbol: id, name: id });
                        setIsTradeModalOpen(true);
                      }}
                    >
                      Trade
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Portfolio Tab */}
        <TabsContent value="portfolio" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-500" />
                Meu Portfólio
              </CardTitle>
              <CardDescription>
                Valor total: ${portfolio.total_value_usd?.toFixed(2) || '0.00'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {portfolio.tokens?.length > 0 ? (
                <div className="space-y-4">
                  {portfolio.tokens.map((token, index) => (
                    <div key={index} className="flex justify-between items-center p-4 border rounded-lg">
                      <div>
                        <h4 className="font-semibold">{token.symbol}</h4>
                        <p className="text-sm text-gray-500">{token.amount} tokens</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">${token.value?.toFixed(2) || '0.00'}</p>
                        <p className="text-sm text-gray-500">${token.price?.toFixed(6) || '0.00'} each</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">Seu portfólio está vazio</p>
                  <p className="text-sm text-gray-400">Comece fazendo seu primeiro trade!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trade Tab */}
        <TabsContent value="trade" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Buscar Token</CardTitle>
              <CardDescription>
                Encontre e faça trading de qualquer memecoin
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar por nome ou símbolo..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              {searchResults.length > 0 && (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {searchResults.map((token) => (
                    <div 
                      key={token.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => {
                        setSelectedToken(token);
                        setIsTradeModalOpen(true);
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <img 
                          src={token.large} 
                          alt={token.name} 
                          className="w-8 h-8 rounded-full"
                        />
                        <div>
                          <h4 className="font-semibold">{token.symbol?.toUpperCase()}</h4>
                          <p className="text-sm text-gray-500">{token.name}</p>
                        </div>
                      </div>
                      <Button size="sm">
                        Trade
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Trades</CardTitle>
              <CardDescription>
                Seus últimos {trades.length} trades
              </CardDescription>
            </CardHeader>
            <CardContent>
              {trades.length > 0 ? (
                <div className="space-y-4">
                  {trades.map((trade) => (
                    <div key={trade.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {trade.trade_type === 'buy' ? (
                          <ArrowUpRight className="h-5 w-5 text-green-500" />
                        ) : (
                          <ArrowDownRight className="h-5 w-5 text-red-500" />
                        )}
                        <div>
                          <h4 className="font-semibold">
                            {trade.trade_type === 'buy' ? 'Compra' : 'Venda'} - {trade.token_symbol?.toUpperCase()}
                          </h4>
                          <p className="text-sm text-gray-500">
                            {new Date(trade.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{trade.amount} tokens</p>
                        <Badge 
                          variant={trade.status === 'completed' ? 'default' : trade.status === 'failed' ? 'destructive' : 'secondary'}
                        >
                          {trade.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">Nenhum trade encontrado</p>
                  <p className="text-sm text-gray-400">Seu histórico aparecerá aqui</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Trade Modal */}
      <Dialog open={isTradeModalOpen} onOpenChange={setIsTradeModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedToken && (
                <>
                  <img 
                    src={selectedToken.large || selectedToken.thumb} 
                    alt={selectedToken.name} 
                    className="w-6 h-6 rounded-full"
                  />
                  Trade {selectedToken.symbol?.toUpperCase()}
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Tipo de Trade</label>
              <Select value={tradeType} onValueChange={setTradeType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="buy">Comprar</SelectItem>
                  <SelectItem value="sell">Vender</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Quantidade</label>
              <Input
                type="number"
                placeholder="0.00"
                value={tradeAmount}
                onChange={(e) => setTradeAmount(e.target.value)}
              />
            </div>

            <Button 
              onClick={executeTrade} 
              disabled={isLoading || !tradeAmount}
              className="w-full"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Executando...
                </div>
              ) : (
                `${tradeType === 'buy' ? 'Comprar' : 'Vender'} ${selectedToken?.symbol?.toUpperCase()}`
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TradingDashboard;