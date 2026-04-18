import { NavLink } from "react-router-dom";
import { useWeb3 } from "../hooks/useWeb3";
import { ShieldCheck, LayoutDashboard, PlusCircle, Settings, Wallet, LogOut, Globe } from "lucide-react";
import "./Navbar.css";

export default function Navbar() {
  const { account, networkName, isOwner, isInstitution, connect, disconnect, connecting, explorerUrl, contractAddress } = useWeb3();

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <NavLink to="/" className="nav-logo">
          <ShieldCheck size={20}/>
          <span>CertChain</span>
        </NavLink>

        <div className="nav-links">
          <NavLink to="/verify"   className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}>
            <ShieldCheck size={14}/> Verify
          </NavLink>
          <NavLink to="/registry" className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}>
            <Globe size={14}/> Registry
          </NavLink>
          <NavLink to="/dashboard" className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}>
            <LayoutDashboard size={14}/> Dashboard
          </NavLink>
          {(isInstitution || isOwner) && (
            <NavLink to="/issue" className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}>
              <PlusCircle size={14}/> Issue
            </NavLink>
          )}
          {isOwner && (
            <NavLink to="/admin" className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}>
              <Settings size={14}/> Admin
            </NavLink>
          )}
        </div>

        <div className="nav-wallet">
          {account ? (
            <>
              <div className="wallet-info">
                {networkName && <span className="net-badge">{networkName}</span>}
                <span className="addr-badge">{account.slice(0,6)}…{account.slice(-4)}</span>
                {isOwner      && <span className="role-badge owner">Owner</span>}
                {isInstitution && !isOwner && <span className="role-badge inst">Institution</span>}
              </div>
              {explorerUrl && contractAddress && (
                <a href={`${explorerUrl}/address/${contractAddress}`}
                   target="_blank" rel="noreferrer"
                   className="btn-icon" title="View on Etherscan">
                  <Globe size={14}/>
                </a>
              )}
              <button className="btn-icon" onClick={disconnect} title="Disconnect">
                <LogOut size={14}/>
              </button>
            </>
          ) : (
            <button className="btn-connect" onClick={connect} disabled={connecting}>
              {connecting ? <><span className="spinner sm"/>{" "}Connecting…</> : <><Wallet size={14}/> Connect Wallet</>}
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
