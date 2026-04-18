/* eslint-disable react-hooks/exhaustive-deps, no-unused-vars */
import { useState, useEffect } from "react";
import { useCertificate } from "../hooks/useCertificate";
import { useWeb3 }        from "../hooks/useWeb3";
import { Building2, Search, GraduationCap, Globe, ExternalLink, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import "./Registry.css";

export default function Registry() {
  const { contract }        = useWeb3();
  const { getAllInstitutions, getInstitutionCertificates, getCertificate } = useCertificate();

  const [institutions, setInstitutions] = useState([]);
  const [selected,     setSelected]     = useState(null); // address
  const [certs,        setCerts]        = useState([]);
  const [certIds,      setCertIds]      = useState([]);
  const [loading,      setLoading]      = useState(false);
  const [loadingList,  setLoadingList]  = useState(false);
  const [search,       setSearch]       = useState("");
  const [stats,        setStats]        = useState({ total: 0, institutions: 0 });

  // Load institutions on mount
  useEffect(() => {
    if (!contract) return;
    (async () => {
      setLoadingList(true);
      const list = await getAllInstitutions();
      const active = list.filter(i => i.active);
      setInstitutions(active);

      // Get total certificate count
      try {
        const total = await contract.totalCertificates();
        setStats({ total: Number(total), institutions: active.length });
      } catch {}

      setLoadingList(false);
    })();
  }, [contract]);

  async function loadInstitutionCerts(addr) {
    setSelected(addr);
    setCerts([]);
    setCertIds([]);
    setLoading(true);
    const ids = await getInstitutionCertificates(addr);
    setCertIds(ids);
    const resolved = await Promise.all(
      ids.slice(0, 20).map(id => getCertificate(id)) // cap at 20 for perf
    );
    setCerts(resolved.filter(Boolean));
    setLoading(false);
  }

  const filtered = institutions.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    i.emailDomain?.toLowerCase().includes(search.toLowerCase())
  );

  const selectedInst = institutions.find(i => i.address === selected);

  return (
    <div className="page">
      {/* ── Header ── */}
      <div className="registry-header">
        <div>
          <h1 style={{ marginBottom: 6 }}>Certificate Registry</h1>
          <p style={{ color: "var(--muted2)" }}>
            Public registry of all blockchain-verified certificates. No account required.
          </p>
        </div>
        <div className="registry-stats">
          <div className="reg-stat">
            <div className="reg-stat-value">{stats.total}</div>
            <div className="reg-stat-label">Certificates</div>
          </div>
          <div className="reg-stat">
            <div className="reg-stat-value">{stats.institutions}</div>
            <div className="reg-stat-label">Institutions</div>
          </div>
        </div>
      </div>

      {!contract && (
        <div className="alert alert-info" style={{ marginBottom: 24 }}>
          Connect your wallet to browse the registry. Verification is always free.
        </div>
      )}

      <div className="registry-layout">
        {/* ── Institution sidebar ── */}
        <div className="registry-sidebar">
          <div className="sidebar-search">
            <Search size={14} style={{ color: "var(--muted2)", flexShrink: 0 }} />
            <input
              className="sidebar-input"
              placeholder="Search institutions…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {loadingList ? (
            <div className="reg-loading"><span className="spinner sm-accent"/> Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="reg-empty">No institutions found</div>
          ) : (
            <div className="inst-list">
              {filtered.map(inst => (
                <button
                  key={inst.address}
                  className={`inst-item ${selected === inst.address ? "active" : ""}`}
                  onClick={() => loadInstitutionCerts(inst.address)}
                >
                  <div className="inst-icon"><Building2 size={16}/></div>
                  <div className="inst-info">
                    <div className="inst-name">{inst.name}</div>
                    <div className="inst-meta">
                      {inst.emailDomain && <span>@{inst.emailDomain}</span>}
                      <span>{inst.totalIssued} certs</span>
                    </div>
                  </div>
                  {inst.website && (
                    <a href={inst.website} target="_blank" rel="noreferrer"
                       onClick={e => e.stopPropagation()}
                       className="inst-link" title="Visit website">
                      <Globe size={13}/>
                    </a>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Certificate list ── */}
        <div className="registry-main">
          {!selected ? (
            <div className="reg-placeholder">
              <Building2 size={48} style={{ opacity: 0.15, display: "block", margin: "0 auto 16px" }}/>
              <p style={{ color: "var(--muted)", textAlign: "center" }}>
                Select an institution from the left to browse its certificates
              </p>
            </div>
          ) : (
            <>
              <div className="reg-main-header">
                <div>
                  <h2 style={{ fontSize: 18, marginBottom: 4 }}>{selectedInst?.name}</h2>
                  <p style={{ color: "var(--muted2)", fontSize: 13 }}>
                    {certIds.length} certificate{certIds.length !== 1 ? "s" : ""} issued
                    {certIds.length > 20 ? " (showing first 20)" : ""}
                  </p>
                </div>
                <button className="btn btn-ghost btn-sm"
                  onClick={() => loadInstitutionCerts(selected)} disabled={loading}>
                  <RefreshCw size={13}/> Refresh
                </button>
              </div>

              {loading ? (
                <div className="reg-loading"><span className="spinner sm-accent"/> Loading certificates…</div>
              ) : certs.length === 0 ? (
                <div className="reg-empty">No certificates issued yet</div>
              ) : (
                <div className="reg-cert-grid">
                  {certs.map((cert, i) => (
                    <div key={certIds[i]} className="reg-cert-card">
                      <div className="reg-cert-top">
                        <span className={`badge ${cert.status === "Active" ? "badge-active" : "badge-revoked"}`}>
                          {cert.status}
                        </span>
                        {cert.grade && (
                          <span className="reg-cert-grade">{cert.grade}</span>
                        )}
                      </div>
                      <div className="reg-cert-name">{cert.studentName}</div>
                      <div className="reg-cert-course">{cert.courseName}</div>
                      <div className="reg-cert-id">
                        {certIds[i]?.slice(0, 14)}…
                      </div>
                      <Link
                        to={`/verify/${certIds[i]}`}
                        className="btn btn-ghost btn-sm"
                        style={{ marginTop: 10, width: "100%", justifyContent: "center" }}
                      >
                        <ExternalLink size={12}/> Verify
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
