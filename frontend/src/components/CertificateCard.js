import { Link } from "react-router-dom";
import { format } from "date-fns";
import { ShieldCheck, ShieldX, Clock, ExternalLink, Building2, GraduationCap } from "lucide-react";

export default function CertificateCard({ cert, certId, onRevoke, canRevoke }) {
  if (!cert) return null;

  const isActive  = cert.status === "Active";
  const isRevoked = cert.status === "Revoked";
  const expired   = cert.expiryDate && new Date() > cert.expiryDate;

  const statusBadge = () => {
    if (isRevoked) return <span className="badge badge-revoked"><ShieldX size={11} /> Revoked</span>;
    if (expired)   return <span className="badge badge-expired"><Clock size={11} /> Expired</span>;
    if (isActive)  return <span className="badge badge-active"><ShieldCheck size={11} /> Valid</span>;
    return <span className="badge badge-gray">Unknown</span>;
  };

  const shortId = certId ? `${certId.slice(0,10)}…${certId.slice(-8)}` : "";

  return (
    <div className={`cert-card card card-accent ${isRevoked ? "card-red" : isActive && !expired ? "card-green" : ""}`}>
      <div className="cert-card-header">
        <div>
          {statusBadge()}
          {cert.grade && <span className="cert-grade">Grade: <strong>{cert.grade}</strong></span>}
        </div>
        <Link to={`/cert/${certId}`} className="cert-link-btn">
          <ExternalLink size={14} /> View
        </Link>
      </div>

      <div className="cert-main">
        <div className="cert-name">
          <GraduationCap size={18} style={{ color: "var(--accent)", flexShrink: 0 }} />
          <div>
            <div className="cert-student">{cert.studentName}</div>
            <div className="cert-sid">ID: {cert.studentId}</div>
          </div>
        </div>
        <div className="cert-course">
          <strong>{cert.courseName}</strong>
          {cert.courseId && <span className="cert-code"> · {cert.courseId}</span>}
        </div>
      </div>

      <div className="cert-meta">
        <div className="cert-inst">
          <Building2 size={13} />
          <span>{cert.institutionName || cert.institution?.slice(0,16) + "…"}</span>
        </div>
        <div className="cert-dates">
          <span>Issued: {cert.issueDate ? format(cert.issueDate, "dd MMM yyyy") : "—"}</span>
          {cert.expiryDate && <span> · Expires: {format(cert.expiryDate, "dd MMM yyyy")}</span>}
        </div>
      </div>

      {certId && (
        <div className="cert-id">
          <span className="hash-label">CERT ID</span>
          <div className="hash-box" style={{ fontSize: "11px", padding: "8px 12px" }}>{shortId}</div>
        </div>
      )}

      {canRevoke && isActive && !isRevoked && (
        <div style={{ marginTop: "14px" }}>
          <button className="btn btn-sm btn-danger" onClick={() => onRevoke?.(certId)}>
            <ShieldX size={13} /> Revoke Certificate
          </button>
        </div>
      )}
    </div>
  );
}
