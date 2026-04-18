import { Link } from "react-router-dom";
import { ShieldCheck, PlusCircle, Search, Lock, Globe, Zap } from "lucide-react";
import { useWeb3 } from "../hooks/useWeb3";
import "./Home.css";

const FEATURES = [
  { icon: <ShieldCheck size={22} />, title: "Tamper-Proof",     desc: "Every certificate is stored on-chain. Once issued, it cannot be altered." },
  { icon: <Globe size={22} />,       title: "Publicly Verifiable", desc: "Anyone can verify a certificate's authenticity without a central authority." },
  { icon: <Lock size={22} />,        title: "Role-Based Access",desc: "Only authorised institutions can issue. Only issuers or admin can revoke." },
  { icon: <Zap size={22} />,         title: "Instant Lookup",   desc: "Verification is a gas-free on-chain read — results in under a second." },
];

const HOW = [
  { step: "01", title: "Admin Authorises Institution", body: "The contract owner adds a university or school as a trusted issuer." },
  { step: "02", title: "Institution Issues Certificate", body: "The institution submits student details. A unique certId is generated on-chain." },
  { step: "03", title: "Student / Employer Verifies",   body: "Anyone can paste the certId to instantly verify authenticity and status." },
];

export default function Home() {
  const { account, isInstitution, isOwner, connect, connecting } = useWeb3();

  return (
    <div className="home">
      {/* Hero */}
      <section className="hero">
        <div className="hero-badge">
          <ShieldCheck size={14} /> Blockchain-Verified Credentials
        </div>
        <h1 className="hero-title">
          Student Certificates<br />
          <span className="gradient-text">On the Blockchain</span>
        </h1>
        <p className="hero-sub">
          Issue, store, and instantly verify academic certificates with cryptographic guarantees.
          No central authority. No forgery. No middlemen.
        </p>
        <div className="hero-btns">
          <Link to="/verify" className="btn btn-primary btn-xl">
            <Search size={18} /> Verify a Certificate
          </Link>
          {!account && (
            <button className="btn btn-ghost btn-xl" onClick={connect} disabled={connecting}>
              <span>{connecting ? "Connecting…" : "Connect Wallet"}</span>
            </button>
          )}
          {(isInstitution || isOwner) && (
            <Link to="/issue" className="btn btn-success btn-xl">
              <PlusCircle size={18} /> Issue Certificate
            </Link>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="features container">
        <div className="section-label">Why CertChain</div>
        <div className="grid-2" style={{ gap: "16px" }}>
          {FEATURES.map(f => (
            <div key={f.title} className="feat-card card">
              <div className="feat-icon">{f.icon}</div>
              <h3 className="feat-title">{f.title}</h3>
              <p className="feat-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="how container">
        <div className="section-label">How It Works</div>
        <div className="how-steps">
          {HOW.map((h, i) => (
            <div key={h.step} className="how-step">
              <div className="how-num">{h.step}</div>
              <div>
                <h3 className="how-title">{h.title}</h3>
                <p className="how-body">{h.body}</p>
              </div>
              {i < HOW.length - 1 && <div className="how-arrow">→</div>}
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section container">
        <div className="cta-card card card-accent">
          <h2>Start Verifying Certificates</h2>
          <p>Paste a certificate ID to instantly validate its authenticity on-chain.</p>
          <Link to="/verify" className="btn btn-primary btn-lg">
            <ShieldCheck size={16} /> Go to Verifier
          </Link>
        </div>
      </section>
    </div>
  );
}
