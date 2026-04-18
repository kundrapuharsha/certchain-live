/* eslint-disable react-hooks/exhaustive-deps, no-unused-vars */
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import contractABI       from "../utils/contractABI.json";
import contractAddresses from "../utils/contractAddress.json";
import toast from "react-hot-toast";

const Web3Context = createContext(null);

const CHAINS = {
  31337:    { name: "Localhost",  explorer: "" },
  11155111: { name: "Sepolia",   explorer: "https://sepolia.etherscan.io" },
  137:      { name: "Polygon",   explorer: "https://polygonscan.com" },
};

function getContractAddress(chainId) {
  const map = { 31337:"localhost", 11155111:"sepolia", 137:"polygon" };
  const key = map[chainId];
  return key && contractAddresses[key]?.address;
}

export function Web3Provider({ children }) {
  const [provider, setProvider]   = useState(null);
  const [signer,   setSigner]     = useState(null);
  const [contract, setContract]   = useState(null);
  const [account,  setAccount]    = useState(null);
  const [chainId,  setChainId]    = useState(null);
  const [isOwner,  setIsOwner]    = useState(false);
  const [isInstitution, setIsInstitution] = useState(false);
  const [institutionInfo, setInstitutionInfo] = useState(null);
  const [connecting, setConnecting] = useState(false);

  const checkRoles = useCallback(async (c, addr) => {
    try {
      const owner = await c.owner();
      setIsOwner(owner.toLowerCase() === addr.toLowerCase());
      const inst  = await c.institutions(addr);
      setIsInstitution(inst.active);
      if (inst.active) setInstitutionInfo({ name: inst.name, website: inst.website, emailDomain: inst.emailDomain });
      else setInstitutionInfo(null);
    } catch {}
  }, []);

  const connect = useCallback(async () => {
    if (!window.ethereum) { toast.error("MetaMask not detected — install it from metamask.io"); return; }
    setConnecting(true);
    try {
      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      await web3Provider.send("eth_requestAccounts", []);
      const web3Signer  = await web3Provider.getSigner();
      const address     = await web3Signer.getAddress();
      const network     = await web3Provider.getNetwork();
      const chain       = Number(network.chainId);

      setProvider(web3Provider); setSigner(web3Signer);
      setAccount(address); setChainId(chain);

      const addr = getContractAddress(chain);
      if (!addr) { toast.error("Contract not deployed on this network. Switch to Sepolia."); return; }

      const c = new ethers.Contract(addr, contractABI, web3Signer);
      setContract(c);
      await checkRoles(c, address);
      toast.success(`Connected: ${address.slice(0,6)}…${address.slice(-4)}`);
    } catch(e) { toast.error(e.message || "Connection failed"); }
    finally { setConnecting(false); }
  }, [checkRoles]);

  const disconnect = useCallback(() => {
    setProvider(null); setSigner(null); setContract(null);
    setAccount(null); setChainId(null);
    setIsOwner(false); setIsInstitution(false); setInstitutionInfo(null);
    toast("Disconnected");
  }, []);

  useEffect(() => {
    if (!window.ethereum) return;
    const onAccounts = async (accs) => {
      if (!accs.length) { disconnect(); return; }
      setAccount(accs[0]);
      if (contract) await checkRoles(contract, accs[0]);
    };
    window.ethereum.on("accountsChanged", onAccounts);
    window.ethereum.on("chainChanged", () => window.location.reload());
    return () => {
      window.ethereum.removeListener("accountsChanged", onAccounts);
    };
  }, [contract, checkRoles, disconnect]);

  const chain = CHAINS[chainId];
  return (
    <Web3Context.Provider value={{
      provider, signer, contract, account, chainId,
      networkName: chain?.name || (chainId ? `Chain ${chainId}` : null),
      explorerUrl: chain?.explorer || "",
      contractAddress: chainId ? getContractAddress(chainId) : null,
      isOwner, isInstitution, institutionInfo,
      connecting, connect, disconnect,
    }}>
      {children}
    </Web3Context.Provider>
  );
}

export const useWeb3 = () => useContext(Web3Context);
