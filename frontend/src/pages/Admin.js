/* eslint-disable react-hooks/exhaustive-deps, no-unused-vars */
import { useState, useEffect } from "react";
import { useWeb3 }        from "../hooks/useWeb3";
import { useCertificate } from "../hooks/useCertificate";
import { Settings, PlusCircle, ShieldX, Building2, RefreshCw, Edit3 } from "lucide-react";
import "./Admin.css";

export default function Admin() {
  const { account, isOwner } = useWeb3();
  const { registerInstitution, updateInstitution, revokeInstitution, getAllInstitutions } = useCertificate();

  const [institutions, setInstitutions] = useState([]);
  const [loadingList,  setLoadingList]  = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [editTarget,   setEditTarget]   = useState(null);
  const [log,          setLog]          = useState([]);
  const [form, setForm] = useState({
    address: "", name: "", website: "", emailDomain: ""
  });

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  function addLog(msg, type = "ok") {
    setLog(prev => [{ msg, type, ts: new Date().toLocaleTimeString() }, ...prev.slice(0, 29)]);
  }

  async function loadInstitutions() {
    setLoadingList(true);
    const list = await getAllInstitutions();
    setInstitutions(list);
    setLoadingList(false);
  }

  useEffect(() => { loadInstitutions(); }, []);

  if (!isOwner) return (
    <div className="page-sm">
      <div className="alert alert-danger">Only the contract owner can access this page.</div>
    </div>
  );

  async function handleRegister(e) {
    e.preventDefault();
    if (!form.address.startsWith("0x") || form.address.length !== 42) {
      addLog("Invalid address format.", "err"); return;
    }
    setLoading(true);
    const ok = editTarget
      ? await updateInstitution(form.address, form.name, form.website, form.emailDomain)
      : await registerInstitution(form.address, form.name, form.website, form.emailDomain);

    if (ok) {
      addLog(`${editTarget ? "Updated" : "Registered"}: ${form.name} (${form.address.slice(0,10)}…)`, "ok");
      setForm({ address: "", name: "", website: "", emailDomain: "" });
      setEditTarget(null);
      await loadInstitutions();
    } else {
      addLog("Transaction failed.", "err");
    }
    setLoading(false);
  }

  async function handleRevoke(address, name) {
    if (!window.confirm(`Revoke "${name}"? They will no longer be able to issue certificates.`)) return;
    setLoading(true);
    const ok = await revokeInstitution(address);
    if (ok) {
      addLog(`Revoked: ${name}`, "ok");
      await loadInstitutions();
    } else {
      addLog("Revoke failed.", "err");
    }
    setLoading(false);
  }

  function startEdit(inst) {
    setEditTarget(inst.address);
    setForm({ address: inst.address, name: inst.name, website: inst.website || "", emailDomain: inst.emailDomain || "" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditTarget(null);
    setForm({ address: "", name: "", website: "", emailDomain: "" });
  }

  const activeList  = institutions.filter(i => i.active);
  const revokedList = institutions.filter(i => !i.active);

  return (
    <div className="page-sm">
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ marginBottom: 6, display: "flex", alignItems: "center", gap: 10 }}>
          <Settings size={28} style={{ color: "var(--accent)" }}/> Admin Panel
        </h1>
        <p style={{ color: "var(--muted2)", fontSize: 13, fontFamily: "var(--mono)" }}>
          Owner: {account}
        </p>
      </div>

      {/* Register / Edit form */}
      <div className="card card-accent" style={{ marginBottom: 20 }}>
        <div className="admin-card-title" style={{ color: editTarget ? "var(--yellow)" : "var(--accent)" }}>
          {editTarget ? <><Edit3 size={15}/> Edit Institution</> : <><PlusCircle size={15}/> Register Institution</>}
        </div>
        <p style={{ color: "var(--muted2)", fontSize: 13, marginBottom: 20 }}>
          {editTarget
            ? "Update the institution's details below."
            : "Add a university or college as an authorised certificate issuer."
          }
        </p>
        <form onSubmit={handleRegister}>
          <div className="grid-2" style={{ gap: 14, marginBottom: 14 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Wallet Address *</label>
              <input className="form-input" required value={form.address}
                onChange={set("address")} placeholder="0x…"
                disabled={!!editTarget}
                style={{ opacity: editTarget ? 0.6 : 1 }}/>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Institution Name *</label>
              <input className="form-input" required value={form.name}
                onChange={set("name")} placeholder="e.g. IIT Hyderabad"/>
            </div>
          </div>
          <div className="grid-2" style={{ gap: 14, marginBottom: 14 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Website URL</label>
              <input className="form-input" type="url" value={form.website}
                onChange={set("website")} placeholder="https://iith.ac.in"/>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Email Domain</label>
              <input className="form-input" value={form.emailDomain}
                onChange={set("emailDomain")} placeholder="iith.ac.in"/>
            </div>
          </div>
          <div className="btn-row">
            <button className="btn btn-primary btn-md" type="submit" disabled={loading}>
              {loading
                ? <><span className="spinner sm-white"/> Processing…</>
                : editTarget
                  ? <><Edit3 size={14}/> Update Institution</>
                  : <><PlusCircle size={14}/> Register Institution</>
              }
            </button>
            {editTarget && (
              <button className="btn btn-outline btn-md" type="button" onClick={cancelEdit}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Active institutions */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
          <div className="admin-card-title" style={{ marginBottom:0 }}>
            <Building2 size={15}/> Active Institutions ({activeList.length})
          </div>
          <button className="btn btn-ghost btn-sm" onClick={loadInstitutions} disabled={loadingList}>
            <RefreshCw size={13}/> {loadingList ? "Loading…" : "Refresh"}
          </button>
        </div>

        {loadingList ? (
          <div style={{ color:"var(--muted2)", fontSize:14, padding:"16px 0" }}>Loading…</div>
        ) : activeList.length === 0 ? (
          <div style={{ color:"var(--muted)", fontSize:14, padding:"16px 0" }}>No institutions registered yet.</div>
        ) : (
          <div className="inst-table-wrap">
            <table className="inst-table">
              <thead>
                <tr>
                  <th>Institution</th>
                  <th>Address</th>
                  <th>Domain</th>
                  <th>Issued</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {activeList.map(inst => (
                  <tr key={inst.address}>
                    <td>
                      <div style={{ fontWeight:700 }}>{inst.name}</div>
                      {inst.website && (
                        <a href={inst.website} target="_blank" rel="noreferrer"
                          style={{ fontSize:11, color:"var(--accent)" }}>{inst.website}</a>
                      )}
                    </td>
                    <td><code style={{ fontSize:11, color:"var(--muted2)" }}>{inst.address.slice(0,10)}…{inst.address.slice(-6)}</code></td>
                    <td><span style={{ fontSize:12, color:"var(--muted2)" }}>@{inst.emailDomain || "—"}</span></td>
                    <td><span style={{ fontFamily:"var(--mono)", fontSize:13 }}>{inst.totalIssued}</span></td>
                    <td>
                      <div className="btn-row" style={{ gap:6 }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => startEdit(inst)}>
                          <Edit3 size={12}/> Edit
                        </button>
                        <button className="btn btn-danger btn-sm"
                          onClick={() => handleRevoke(inst.address, inst.name)}
                          disabled={loading}>
                          <ShieldX size={12}/> Revoke
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Revoked institutions */}
      {revokedList.length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="admin-card-title" style={{ color:"var(--muted2)" }}>
            <ShieldX size={15}/> Revoked Institutions ({revokedList.length})
          </div>
          <div className="inst-table-wrap">
            <table className="inst-table">
              <thead><tr><th>Institution</th><th>Address</th><th>Issued</th></tr></thead>
              <tbody>
                {revokedList.map(inst => (
                  <tr key={inst.address} style={{ opacity:0.5 }}>
                    <td style={{ fontWeight:700 }}>{inst.name}</td>
                    <td><code style={{ fontSize:11 }}>{inst.address.slice(0,10)}…</code></td>
                    <td>{inst.totalIssued}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Activity log */}
      {log.length > 0 && (
        <div className="card">
          <div className="admin-card-title">Activity Log</div>
          <div className="admin-log">
            {log.map((e, i) => (
              <div key={i} className={`admin-log-entry ${e.type}`}>
                <span className="admin-log-ts">{e.ts}</span>
                <span>{e.msg}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}