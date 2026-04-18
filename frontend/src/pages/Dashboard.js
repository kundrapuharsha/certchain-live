import { useState } from "react";
import { useCertificate } from "../hooks/useCertificate";
import { useWeb3 } from "../hooks/useWeb3";
import CertificateCard from "../components/CertificateCard";
import { Search, LayoutDashboard, Building2, GraduationCap, RefreshCw } from "lucide-react";
import "./Dashboard.css";

export default function Dashboard() {
  const { account, isInstitution, isOwner } = useWeb3();
  const { getStudentCertificates, getInstitutionCertificates, getCertificate, revokeCertificate } = useCertificate();

  const [tab, setTab]             = useState("student");
  const [studentId, setStudentId] = useState("");
  const [instAddr, setInstAddr]   = useState("");
  const [certIds, setCertIds]     = useState([]);
  const [certs, setCerts]         = useState([]);
  const [loading, setLoading]     = useState(false);
  const [searched, setSearched]   = useState(false);

  async function fetchStudentCerts() {
    if (!studentId.trim()) return;
    setLoading(true); setSearched(true);
    const ids = await getStudentCertificates(studentId.trim());
    setCertIds(ids);
    const resolved = await Promise.all(ids.map(id => getCertificate(id)));
    setCerts(resolved);
    setLoading(false);
  }

  async function fetchInstCerts() {
    const addr = instAddr.trim() || account;
    if (!addr) return;
    setLoading(true); setSearched(true);
    const ids = await getInstitutionCertificates(addr);
    setCertIds(ids);
    const resolved = await Promise.all(ids.map(id => getCertificate(id)));
    setCerts(resolved);
    setLoading(false);
  }

  async function loadMyIssuedCerts() {
    setInstAddr(account || "");
    setLoading(true); setSearched(true);
    const ids = await getInstitutionCertificates(account);
    setCertIds(ids);
    const resolved = await Promise.all(ids.map(id => getCertificate(id)));
    setCerts(resolved);
    setLoading(false);
  }

  async function handleRevoke(certId) {
    if (!window.confirm("Revoke this certificate? This action cannot be undone.")) return;
    const ok = await revokeCertificate(certId);
    if (ok) {
      // refresh
      const updated = await getCertificate(certId);
      setCerts(prev => prev.map((c, i) => certIds[i] === certId ? updated : c));
    }
  }

  function reset() {
    setCertIds([]); setCerts([]); setSearched(false);
  }

  function switchTab(t) {
    setTab(t); reset();
  }

  return (
    <div className="page">
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ marginBottom: 6, display: "flex", alignItems: "center", gap: 10 }}>
          <LayoutDashboard size={28} style={{ color: "var(--accent)" }} /> Dashboard
        </h1>
        <p style={{ color: "var(--muted2)" }}>Search and browse certificates by student or institution.</p>
      </div>

      {/* Tabs */}
      <div className="dash-tabs" style={{ marginBottom: 24 }}>
        <button className={`dash-tab ${tab==="student" ? "active":""}`} onClick={() => switchTab("student")}>
          <GraduationCap size={15} /> By Student ID
        </button>
        <button className={`dash-tab ${tab==="institution" ? "active":""}`} onClick={() => switchTab("institution")}>
          <Building2 size={15} /> By Institution
        </button>
      </div>

      {/* Student search */}
      {tab === "student" && (
        <div className="card card-accent" style={{ marginBottom: 24 }}>
          <div className="form-group">
            <label className="form-label">Student ID / Roll Number</label>
            <div className="input-row">
              <input className="form-input" value={studentId}
                onChange={e => setStudentId(e.target.value)}
                onKeyDown={e => e.key==="Enter" && fetchStudentCerts()}
                placeholder="e.g. IITH-2024-001" />
              <button className="btn btn-primary btn-md" onClick={fetchStudentCerts} disabled={loading}>
                {loading ? <span className="spinner"/> : <Search size={14}/>} Search
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Institution search */}
      {tab === "institution" && (
        <div className="card card-accent" style={{ marginBottom: 24 }}>
          <div className="form-group">
            <label className="form-label">Institution Wallet Address</label>
            <div className="input-row">
              <input className="form-input" value={instAddr}
                onChange={e => setInstAddr(e.target.value)}
                onKeyDown={e => e.key==="Enter" && fetchInstCerts()}
                placeholder="0x…" />
              <button className="btn btn-primary btn-md" onClick={fetchInstCerts} disabled={loading}>
                {loading ? <span className="spinner"/> : <Search size={14}/>} Search
              </button>
            </div>
          </div>
          {(isInstitution || isOwner) && (
            <button className="btn btn-ghost btn-sm" onClick={loadMyIssuedCerts} disabled={loading}>
              <RefreshCw size={13}/> Load My Issued Certificates
            </button>
          )}
        </div>
      )}

      {/* Results */}
      {searched && !loading && certs.length === 0 && (
        <div className="empty-state">
          <GraduationCap size={40} />
          <div>No certificates found.</div>
        </div>
      )}

      {certs.length > 0 && (
        <>
          <div className="dash-results-header">
            <span style={{ color: "var(--muted2)", fontSize: 14 }}>
              {certs.length} certificate{certs.length !== 1 ? "s" : ""} found
            </span>
          </div>
          <div className="certs-grid">
            {certs.map((cert, i) => cert && (
              <CertificateCard
                key={certIds[i]}
                cert={cert}
                certId={certIds[i]}
                canRevoke={isInstitution || isOwner}
                onRevoke={handleRevoke}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
