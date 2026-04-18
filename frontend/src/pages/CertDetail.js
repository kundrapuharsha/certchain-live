/* eslint-disable react-hooks/exhaustive-deps, no-unused-vars */
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useCertificate } from "../hooks/useCertificate";
import { useWeb3 } from "../hooks/useWeb3";
import { format } from "date-fns";
import {
  ShieldCheck, ShieldX, Clock, ArrowLeft,
  Building2, GraduationCap, ExternalLink, Copy,
} from "lucide-react";
import "./CertDetail.css";

function Field({ label, value, mono }) {
  if (!value) return null;
  return (
    <div className="cert-field">
      <div className="cert-field-label">{label}</div>
      <div className={`cert-field-value ${mono ? "mono" : ""}`}>{value}</div>
    </div>
  );
}

export default function CertDetail() {
  const { id } = useParams();
  const { contract, isInstitution, isOwner } = useWeb3();
  const { verifyCertificate, revokeCertificate } = useCertificate();

  const [data, setData]   = useState(null); // { valid, cert }
  const [loading, setLoading] = useState(true);
  const [copied, setCopied]   = useState(false);

  useEffect(() => {
    if (!id || !contract) return;
    (async () => {
      setLoading(true);
      const res = await verifyCertificate(id);
      setData(res);
      setLoading(false);
    })();
  }, [id, contract]);

  function copy(text) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleRevoke() {
    if (!window.confirm("Revoke this certificate? This cannot be undone.")) return;
    const ok = await revokeCertificate(id);
    if (ok) {
      const res = await verifyCertificate(id);
      setData(res);
    }
  }

  if (loading) {
    return (
      <div className="page-sm" style={{ textAlign: "center", paddingTop: 80 }}>
        <span className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
        <p style={{ marginTop: 16, color: "var(--muted2)" }}>Loading certificate…</p>
      </div>
    );
  }

  if (!data || data.cert?.status === "NotIssued") {
    return (
      <div className="page-sm">
        <div className="alert alert-danger">Certificate not found on-chain.</div>
        <Link to="/verify" className="btn btn-ghost btn-md"><ArrowLeft size={14}/> Back to Verify</Link>
      </div>
    );
  }

  const { valid, cert } = data;
  const isActive  = cert.status === "Active";
  const isRevoked = cert.status === "Revoked";
  const expired   = cert.expiryDate && new Date() > cert.expiryDate;

  const statusClass = isRevoked ? "revoked" : expired ? "expired" : valid ? "valid" : "expired";
  const StatusIcon  = isRevoked || expired ? ShieldX : ShieldCheck;

  return (
    <div className="page-sm">
      <Link to="/dashboard" className="back-link">
        <ArrowLeft size={14} /> Back
      </Link>

      {/* Status banner */}
      <div className={`detail-banner ${statusClass}`}>
        <StatusIcon size={28} />
        <div>
          <div className="detail-banner-title">
            {isRevoked ? "Certificate Revoked" : expired ? "Certificate Expired" : "Certificate Valid"}
          </div>
          <div className="detail-banner-sub">
            {isRevoked ? "This certificate has been revoked by the issuing institution."
              : expired ? "This certificate's validity period has ended."
              : "This certificate is authentic and currently active on-chain."}
          </div>
        </div>
      </div>

      {/* Main cert card */}
      <div className="detail-card card">
        {/* Header */}
        <div className="detail-header">
          <div className="detail-logo">
            <GraduationCap size={32} />
          </div>
          <div>
            <div className="detail-inst">{cert.institutionName || cert.institution}</div>
            <div className="detail-course">{cert.courseName}</div>
          </div>
        </div>

        <div className="divider" />

        {/* Student */}
        <div className="detail-student">
          <div className="detail-student-name">{cert.studentName}</div>
          <div className="detail-student-label">has successfully completed</div>
          <div className="detail-course-big">{cert.courseName}</div>
          {cert.courseId && <div style={{ color: "var(--muted2)", fontSize: 14, marginTop: 4 }}>({cert.courseId})</div>}
          {cert.grade && (
            <div className="detail-grade">
              Grade: <strong>{cert.grade}</strong>
            </div>
          )}
        </div>

        <div className="divider" />

        {/* Meta fields */}
        <div className="detail-fields">
          <Field label="Student ID"         value={cert.studentId} mono />
          <Field label="Issued On"          value={cert.issueDate ? format(cert.issueDate, "dd MMMM yyyy") : null} />
          <Field label="Expiry Date"        value={cert.expiryDate ? format(cert.expiryDate, "dd MMMM yyyy") : "No Expiry"} />
          <Field label="Issuing Institution" value={cert.institutionName} />
          <Field label="Institution Address" value={cert.institution} mono />
          <Field label="Status"             value={cert.status} />
        </div>

        {cert.metadataURI && (
          <a href={cert.metadataURI.replace("ipfs://","https://ipfs.io/ipfs/")}
             target="_blank" rel="noreferrer"
             className="btn btn-ghost btn-sm" style={{ marginTop: 8, width: "fit-content" }}>
            <ExternalLink size={13} /> View Full Document
          </a>
        )}
      </div>

      {/* Certificate ID */}
      <div className="card" style={{ marginTop: 16 }}>
        <div className="hash-label">CERTIFICATE ID (certId)</div>
        <div className="copy-wrap" style={{ marginTop: 6 }}>
          <div className="hash-box">{id}</div>
          <button className="copy-btn" onClick={() => copy(id)}>
            {copied ? "✓" : <Copy size={11}/>}
          </button>
        </div>
        <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 8 }}>
          Share this ID with employers or institutions to verify authenticity.
        </p>
      </div>

      {/* Verify link */}
      <div style={{ marginTop: 12, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <Link to={`/verify/${id}`} className="btn btn-outline btn-sm">
          <ShieldCheck size={13}/> Re-verify on Chain
        </Link>
        {(isInstitution || isOwner) && isActive && (
          <button className="btn btn-danger btn-sm" onClick={handleRevoke}>
            <ShieldX size={13}/> Revoke Certificate
          </button>
        )}
      </div>
    </div>
  );
}
