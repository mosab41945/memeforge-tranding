import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Web3Provider } from "@/contexts/Web3Context";
import { Toaster } from "@/components/ui/toaster";
import WalletConnect from "@/components/WalletConnect";
import TradingDashboard from "@/components/TradingDashboard";

const Home = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">M</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    MemeForge
                  </h1>
                  <p className="text-sm text-gray-500">Real Memecoin Trading</p>
                </div>
              </div>
            </div>
            
            <WalletConnect />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <TradingDashboard />
      </main>

      {/* Footer */}
      <footer className="border-t bg-white/80 backdrop-blur-md mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-gray-600 mb-2">
              MemeForge - A plataforma definitiva para trading de memecoins
            </p>
            <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
              <span>✅ MetaMask Support</span>
              <span>✅ Binance Wallet Support</span>
              <span>✅ Real-time Prices</span>
              <span>✅ Secure Trading</span>
            </div>
          </div>
        </div>
      </footer>

      <Toaster />
    </div>
  );
};

function App() {
  return (
    <Web3Provider>
      <div className="App">
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
          </Routes>
        </BrowserRouter>
      </div>
    </Web3Provider>
  );
}

export default App;
