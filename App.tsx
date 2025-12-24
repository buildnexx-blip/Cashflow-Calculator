import React, { useEffect } from 'react';
import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import CalculatorPage from './pages/CalculatorPage';
import ComparePage from './pages/ComparePage';

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const App: React.FC = () => {
  return (
    <Router>
      <ScrollToTop />
      <div className="flex flex-col min-h-screen font-sans text-[#0B090A] bg-[#FFFCED]">
        <main className="flex-grow flex flex-col w-full relative z-0">
          <Routes>
            {/* V3.1 Baselined Cashflow Calculator - Existing Product */}
            <Route path="/" element={<CalculatorPage />} />
            
            {/* Property Comparison Tool - New Isolated Product */}
            <Route path="/compare" element={<ComparePage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;