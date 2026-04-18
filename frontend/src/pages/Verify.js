import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Search, ShieldCheck, ShieldX, AlertCircle, CheckCircle2, FileQuestion, ExternalLink } from "lucide-react";
import { useCertificate }              from "../hooks/useCertificate";
import { useWeb3 }                     from "../hooks/useWeb3";
import { usePDF, extractStoredHash }   from "../hooks/usePDF";
import { ipfsToHttp }                  from "../hooks/usePinata";
import PDFUploader                     from "../components/PDFUploader";
import CertificateCard                 from "../components/CertificateCard";
import "./Verify.css";

function extractIpfsUrl(metadataURI) {
  if (!metadataURI) return null;
  const match = metadataURI.match(/ipfs:\/\/[^\s]+/);
  return match ? ipfsToHttp(match[0]) : null;
}

export default function Verify() {
  const { id }       = useParams();
  const navigate     = useNavigate();
  const { contract } = useWeb3();
  const { verifyCertificate } = useCertificate();
  const pdfHook      = usePDF();

  const [input,    setInput]    = useState(id || "");
  const [loading,  setLoading]  = useState(false);
  const [result,   setResult]   = useState(null);
  const [error,    setError]    = useState(null);
  const [pdfMatch, setPdfMatch] = useState(null);

  useEffect(() => { if (id && contract) handleVerify(id); }, [id, contract]);

  useEffect(() => {
    if (pdfHook.hash && result) checkMatch(pdfHook.hash, result.cert);
    else setPdfMatch(null);
  }, [pdfHook.hash, result]);

  async function handleVerify(certId = input.trim()) {
    if (!certId) return;
    if (!certId.startsWith("0x") || certId.length !== 66) {
      setError("Invalid ID — must be a 66-character hex string starting with 0x."); return;
    }
    setLoading(true); setResult(null); setError(null); setPdfMatch(null);
    navigate(`/verify/${certId}`, { replace: true });
    const res = await verifyCertificate(certId);
    if (!res)                           setError("Verification failed. Check network.");
    else if (res.cert.status==="NotIssued") setError("No certificate found with this ID.");
    else                                setResult({ ...res, certId });
    setLoading(false);
  }

  function checkMatch(hash, cert) {
    const stored = extractStoredHash(cert?.metadataURI || "");
    if (!stored) { setPdfMatch("no-hash"); return; }
    setPdfMatch(stored === hash.toLowerCase() ? true : false);
  }

  const ipfsUrl = result ? extractIpfsUrl(result.cert?.metadataURI) : null;

  return (
    <div className="page-sm">
      <h1 style={{ marginBottom: 8 }}>Verify Certificate</h1>
      <p style={{ color: "var(--muted2)", marginBottom: 32 }}>
        Paste a certificate ID to verify authenticity on-chain — no wallet required.
        Optionally upload the original PDF to confirm it has not been tampered with.
      </p>

      {/* Step 1 — certId */}
      <div className="card card-accent" style={{ marginBottom: 20 }}>
        <div className="verify-step-title"><span className="verify-step-num">1</span> Verify Certificate ID</div>
        <div className="form-group">
          <label className="form-label">Certificate ID (bytes32)</label>
          <div className="input-row">
            <input className="form-input" value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="0xabc123…"
              onKeyDown={e => e.key==="Enter" && handleVerify()}/>
            <button className="btn btn-primary btn-md"
              onClick={() => handleVerify()} disabled={loading || !input.trim()}>
              {loading ? <span className="spinner"/> : <Search size={15}/>}
              {loading ? "Verifying…" : "Verify"}
            </button>
          </div>
          <p className="form-hint">66-character hex string beginning with 0x</p>
        </div>

        {error && (
          <div className="alert alert-danger" style={{ display:"flex", gap:10, alignItems:"flex-start", marginTop:8 }}>
            <AlertCircle size={18} style={{ flexShrink:0, marginTop:2 }}/><span>{error}</span>
          </div>
        )}

        {result && (
          <div style={{ marginTop: 16 }}>
            <div className={`verify-banner ${result.valid ? "valid" : "invalid"}`}>
              {result.valid
                ? <><ShieldCheck size={28}/><div><strong>Certificate Valid</strong><div>Authentic and active on the Ethereum blockchain.</div></div></>
                : <><ShieldX    size={28}/><div><strong>Certificate Invalid</strong><div>Revoked or expired.</div></div></>
              }
            </div>
            {ipfsUrl && (
              <a href={ipfsUrl} target="_blank" rel="noreferrer"
                className="btn btn-ghost btn-sm" style={{ marginTop:10, width:"fit-content" }}>
                <ExternalLink size={13}/> View Certificate PDF (IPFS)
              </a>
            )}
            <div style={{ marginTop: 14 }}>
              <CertificateCard cert={result.cert} certId={result.certId}/>
            </div>
          </div>
        )}
      </div>

      {/* Step 2 — PDF integrity */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="verify-step-title"><span className="verify-step-num">2</span> PDF Integrity Check (optional)</div>
        <p style={{ fontSize:13, color:"var(--muted2)", marginBottom:16 }}>
          Upload the original certificate PDF. Its SHA-256 hash is computed locally and compared against the hash stored on-chain.
        </p>
        <PDFUploader hook={pdfHook} compact/>

        {pdfHook.hash && !pdfHook.hashing && (
          <div style={{ marginTop:4 }}>
            {pdfMatch===true && (
              <div className="verify-banner valid">
                <CheckCircle2 size={26}/>
                <div><strong>PDF Authentic</strong><div>Hash matches on-chain record. File is unaltered.</div></div>
              </div>
            )}
            {pdfMatch===false && (
              <div className="verify-banner invalid">
                <ShieldX size={26}/>
                <div><strong>PDF Mismatch</strong><div>Hash does not match on-chain record. File may have been tampered with.</div></div>
              </div>
            )}
            {pdfMatch==="no-hash" && (
              <div className="verify-banner warn">
                <FileQuestion size={26}/>
                <div><strong>No PDF Hash on Record</strong><div>This certificate was issued without a PDF fingerprint.</div></div>
              </div>
            )}
            {pdfMatch===null && !result && (
              <div className="alert alert-info" style={{ marginTop:8, fontSize:13 }}>
                Verify a Certificate ID in Step 1 first — the PDF hash will be compared automatically.
              </div>
            )}
          </div>
        )}
      </div>

      {!result && !loading && !error && (
        <div className="alert alert-info">
          <strong>Tip:</strong> After issuing a certificate, copy its certId and paste it above. Upload the original PDF to also verify file integrity.
        </div>
      )}
    </div>
  );
}
