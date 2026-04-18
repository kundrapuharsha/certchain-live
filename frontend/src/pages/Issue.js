/* eslint-disable react-hooks/exhaustive-deps, no-unused-vars */
import { useState } from "react";
import { Link } from "react-router-dom";
import { useWeb3 }        from "../hooks/useWeb3";
import { useCertificate } from "../hooks/useCertificate";
import { usePDF, buildMetadataURI } from "../hooks/usePDF";
import { usePinata }      from "../hooks/usePinata";
import { useNotify }      from "../hooks/useNotify";
import PDFUploader        from "../components/PDFUploader";
import { PlusCircle, Copy, CheckCircle2, ExternalLink, Mail, Cloud } from "lucide-react";
import "./Issue.css";

const GRADES = ["A+","A","A-","B+","B","B-","C+","C","Pass","Distinction","First Class","Second Class","Fail"];
const BLANK  = { studentName:"", studentId:"", studentEmail:"", courseName:"", courseId:"", grade:"A", expiryDate:"" };

export default function Issue() {
  const { account, isInstitution, isOwner, institutionInfo } = useWeb3();
  const { issueCertificate } = useCertificate();
  const pdfHook   = usePDF();
  const pinata    = usePinata();
  const notify    = useNotify();

  const [form,    setForm]    = useState(BLANK);
  const [loading, setLoading] = useState(false);
  const [issued,  setIssued]  = useState(null);
  const [copied,  setCopied]  = useState("");
  const [phase,   setPhase]   = useState(""); // "ipfs" | "chain" | "email"

  if (!isInstitution && !isOwner) return (
    <div className="page-sm">
      <div className="alert alert-danger">Your wallet is not a registered institution. Ask the admin to register you.</div>
    </div>
  );

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  function copy(text, key) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(""), 2000);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!pdfHook.hash) { alert("Upload the certificate PDF first."); return; }
    setLoading(true);

    try {
      // ── Phase 1: Upload PDF to IPFS ───────────────────────
      setPhase("ipfs");
      let ipfsResult = null;
      if (pdfHook.file) {
        ipfsResult = await pinata.upload(pdfHook.file, {
          studentId:       form.studentId,
          studentName:     form.studentName,
          courseName:      form.courseName,
          institutionName: institutionInfo?.name || "",
        });
      }

      const metadataURI = buildMetadataURI(
        pdfHook.hash,
        ipfsResult?.ipfsUri || "",
        ""
      );

      // ── Phase 2: Issue on blockchain ──────────────────────
      setPhase("chain");
      const res = await issueCertificate({
        studentName:  form.studentName,
        studentId:    form.studentId,
        studentEmail: form.studentEmail,
        courseName:   form.courseName,
        courseId:     form.courseId,
        grade:        form.grade,
        expiryDate:   form.expiryDate,
        metadataURI,
      });

      if (!res) { setPhase(""); return; }

      // ── Phase 3: Send email notification ─────────────────
      setPhase("email");
      if (form.studentEmail) {
        await notify.sendNotification({
          studentName:     form.studentName,
          studentEmail:    form.studentEmail,
          studentId:       form.studentId,
          courseName:      form.courseName,
          grade:           form.grade,
          certId:          res.certId,
          institutionName: institutionInfo?.name || account,
          issueDate:       Math.floor(Date.now() / 1000),
          ipfsUrl:         ipfsResult?.url || null,
        });
      }

      setIssued({
        ...res,
        pdfHash:   pdfHook.hash,
        fileName:  pdfHook.file?.name,
        ipfsUrl:   ipfsResult?.url    || null,
        ipfsUri:   ipfsResult?.ipfsUri || null,
        emailSent: !!form.studentEmail,
      });
      setForm(BLANK);
      pdfHook.reset();
      pinata.reset();

    } finally {
      setLoading(false);
      setPhase("");
    }
  }

  // ── Phase status label ────────────────────────────────────
  const phaseLabel = {
    ipfs:  "Uploading PDF to IPFS…",
    chain: "Recording on blockchain…",
    email: "Sending email to student…",
  }[phase] || "Issuing…";

  // ── Success screen ────────────────────────────────────────
  if (issued) return (
    <div className="page-sm">
      <div className="issue-success card">
        <div className="issue-success-icon"><CheckCircle2 size={44}/></div>
        <h2>Certificate Issued!</h2>
        <p>Recorded on the Ethereum Sepolia blockchain. Publicly verifiable by anyone.</p>

        <div className="issue-tags">
          {issued.ipfsUrl  && <span className="issue-tag green"><Cloud size={12}/> IPFS Stored</span>}
          {issued.emailSent && <span className="issue-tag blue"><Mail  size={12}/> Email Sent</span>}
          <span className="issue-tag gray">⛓ On-Chain</span>
        </div>

        <div className="issue-result-grid">
          <div className="issue-result-block">
            <div className="hash-label">Certificate ID</div>
            <div className="copy-wrap">
              <div className="hash-box">{issued.certId}</div>
              <button className="copy-btn" onClick={() => copy(issued.certId,"id")}>
                {copied==="id" ? "✓" : <Copy size={11}/>}
              </button>
            </div>
          </div>

          <div className="issue-result-block">
            <div className="hash-label">PDF SHA-256 Hash</div>
            <div className="copy-wrap">
              <div className="hash-box" style={{color:"var(--green)",fontSize:11}}>{issued.pdfHash}</div>
              <button className="copy-btn" onClick={() => copy(issued.pdfHash,"hash")}>
                {copied==="hash" ? "✓" : <Copy size={11}/>}
              </button>
            </div>
          </div>

          {issued.ipfsUrl && (
            <div className="issue-result-block">
              <div className="hash-label">IPFS Link</div>
              <a href={issued.ipfsUrl} target="_blank" rel="noreferrer"
                className="btn btn-ghost btn-sm" style={{width:"fit-content"}}>
                <ExternalLink size={13}/> View on IPFS
              </a>
            </div>
          )}

          <div className="issue-result-block">
            <div className="hash-label">Transaction Hash</div>
            <div className="hash-box" style={{color:"var(--muted2)",fontSize:11}}>{issued.txHash}</div>
          </div>
        </div>

        <div className="alert alert-info" style={{textAlign:"left",fontSize:13}}>
          {issued.emailSent
            ? <span>✅ Email sent to the student. They can verify at <code>/verify/{issued.certId.slice(0,12)}…</code></span>
            : <span>Share the Certificate ID with the student so they can verify their certificate.</span>
          }
        </div>

        <div className="btn-row" style={{justifyContent:"center"}}>
          <Link to={`/verify/${issued.certId}`} className="btn btn-primary btn-md">
            <ExternalLink size={14}/> Verify Now
          </Link>
          <button className="btn btn-outline btn-md" onClick={() => setIssued(null)}>
            Issue Another
          </button>
        </div>
      </div>
    </div>
  );

  // ── Form ──────────────────────────────────────────────────
  return (
    <div className="page-sm">
      <div style={{marginBottom:28}}>
        <h1 style={{marginBottom:6}}>Issue Certificate</h1>
        <p style={{color:"var(--muted2)"}}>
          Issuing as <strong style={{color:"var(--accent)"}}>
            {institutionInfo?.name || `${account?.slice(0,6)}…${account?.slice(-4)}`}
          </strong>
        </p>
      </div>

      <form className="issue-form card card-accent" onSubmit={handleSubmit}>

        {/* Step 1 — PDF */}
        <div className="issue-step-header">
          <span className="issue-step-num">1</span>
          <span className="issue-step-label">Upload Certificate PDF</span>
        </div>
        <div className="alert alert-info" style={{fontSize:13,marginBottom:16}}>
          The PDF is <strong>hashed locally</strong> then <strong>uploaded to IPFS</strong> via Pinata — permanently stored and publicly accessible via a decentralised network.
        </div>
        <PDFUploader hook={pdfHook} required/>

        {/* IPFS upload progress (after PDF hash is ready) */}
        {pinata.uploading && (
          <div className="pdf-progress-wrap" style={{marginTop:8}}>
            <div className="pdf-progress-row">
              <span className="pdf-progress-label"><span className="spinner sm-blue"/> Uploading to IPFS…</span>
              <span className="pdf-progress-pct">{pinata.progress}%</span>
            </div>
            <div className="pdf-progress-track">
              <div className="pdf-progress-bar" style={{width:`${pinata.progress}%`}}/>
            </div>
          </div>
        )}
        {pinata.uploaded && (
          <div className="ipfs-success">
            <Cloud size={14}/> Stored on IPFS:
            <a href={pinata.uploaded.url} target="_blank" rel="noreferrer" style={{color:"var(--green)",marginLeft:6}}>
              {pinata.uploaded.cid.slice(0,20)}…
            </a>
          </div>
        )}

        <div className="divider"/>

        {/* Step 2 — Student */}
        <div className="issue-step-header">
          <span className="issue-step-num">2</span>
          <span className="issue-step-label">Student Information</span>
        </div>
        <div className="grid-2" style={{gap:16}}>
          <div className="form-group">
            <label className="form-label">Student Full Name *</label>
            <input className="form-input" required value={form.studentName}
              onChange={set("studentName")} placeholder="e.g. Aisha Patel"/>
          </div>
          <div className="form-group">
            <label className="form-label">Student ID / Roll No *</label>
            <input className="form-input" required value={form.studentId}
              onChange={set("studentId")} placeholder="e.g. IITH-2024-001"/>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Student Email (for notification)</label>
          <input className="form-input" type="email" value={form.studentEmail}
            onChange={set("studentEmail")} placeholder="student@university.edu"/>
          <p className="form-hint">A certificate-issued email with verification link will be sent automatically.</p>
        </div>

        <div className="divider"/>

        {/* Step 3 — Course */}
        <div className="issue-step-header">
          <span className="issue-step-num">3</span>
          <span className="issue-step-label">Course Details</span>
        </div>
        <div className="grid-2" style={{gap:16}}>
          <div className="form-group">
            <label className="form-label">Course / Programme Name *</label>
            <input className="form-input" required value={form.courseName}
              onChange={set("courseName")} placeholder="e.g. B.Tech. Computer Science"/>
          </div>
          <div className="form-group">
            <label className="form-label">Course ID / Code</label>
            <input className="form-input" value={form.courseId}
              onChange={set("courseId")} placeholder="e.g. CS-BTECH-101"/>
          </div>
        </div>
        <div className="grid-2" style={{gap:16}}>
          <div className="form-group">
            <label className="form-label">Grade / Result *</label>
            <select className="form-select" required value={form.grade} onChange={set("grade")}>
              {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Expiry Date (optional)</label>
            <input className="form-input" type="date" value={form.expiryDate}
              onChange={set("expiryDate")} min={new Date().toISOString().slice(0,10)}/>
            <p className="form-hint">Leave blank for permanent</p>
          </div>
        </div>

        <div className="divider"/>

        <button className="btn btn-primary btn-lg" type="submit"
          disabled={loading || !pdfHook.hash}
          style={{width:"100%",justifyContent:"center"}}>
          {loading
            ? <><span className="spinner"/> {phaseLabel}</>
            : !pdfHook.hash
              ? "Upload PDF to Continue"
              : <><PlusCircle size={16}/> Issue Certificate on Blockchain</>
          }
        </button>

        {loading && (
          <div className="issue-phases">
            <span className={`issue-phase ${phase==="ipfs"  ? "active":""}  ${["chain","email"].includes(phase)?"done":""}`}>① IPFS Upload</span>
            <span className="issue-phase-arrow">→</span>
            <span className={`issue-phase ${phase==="chain" ? "active":""}  ${phase==="email"?"done":""}`}>② Blockchain</span>
            <span className="issue-phase-arrow">→</span>
            <span className={`issue-phase ${phase==="email" ? "active":""}`}>③ Email</span>
          </div>
        )}
      </form>
    </div>
  );
}
