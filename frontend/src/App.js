import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { Web3Provider, useWeb3 } from "./hooks/useWeb3";
import Navbar      from "./components/Navbar";
import Home        from "./pages/Home";
import Verify      from "./pages/Verify";
import Issue       from "./pages/Issue";
import Dashboard   from "./pages/Dashboard";
import Registry    from "./pages/Registry";
import Admin       from "./pages/Admin";
import CertDetail  from "./pages/CertDetail";
import "./App.css";

function AppRoutes() {
  const { isOwner, isInstitution } = useWeb3();
  return (
    <Routes>
      <Route path="/"           element={<Home />} />
      <Route path="/verify"     element={<Verify />} />
      <Route path="/verify/:id" element={<Verify />} />
      <Route path="/cert/:id"   element={<CertDetail />} />
      <Route path="/registry"   element={<Registry />} />
      <Route path="/dashboard"  element={<Dashboard />} />
      <Route path="/issue"      element={isInstitution || isOwner ? <Issue /> : <Navigate to="/" />} />
      <Route path="/admin"      element={isOwner ? <Admin /> : <Navigate to="/" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <Web3Provider>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
        <Navbar />
        <main className="main-content"><AppRoutes /></main>
      </BrowserRouter>
    </Web3Provider>
  );
}
