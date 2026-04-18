# CertChain Live — Blockchain Certificate Registry

[![CI](https://github.com/YOUR_USERNAME/certchain-live/actions/workflows/ci.yml/badge.svg)](https://github.com/YOUR_USERNAME/certchain-live/actions)
[![Sepolia](https://img.shields.io/badge/Network-Sepolia-blue)](https://sepolia.etherscan.io)
[![License: MIT](https://img.shields.io/badge/License-MIT-green)](LICENSE)

> **Live production-ready** blockchain certificate issuance and verification platform.
> Multi-institution support · IPFS PDF storage · Email notifications · Public registry

---

## Live Features

| Feature | Description |
|---|---|
| **Multi-Institution** | Multiple universities can register and issue independently |
| **IPFS Storage** | PDFs uploaded to Pinata IPFS — permanent, decentralised |
| **Email Notifications** | Students receive email with certId + verification link on issue |
| **Public Registry** | Browse all institutions and their certificates without a wallet |
| **PDF Integrity** | SHA-256 hash stored on-chain — upload PDF to verify it's unaltered |
| **Sepolia Testnet** | Publicly accessible — anyone can verify from anywhere |
| **Etherscan Verified** | Contract source code publicly auditable |

---

## Quick Start

### Prerequisites
- Node.js 18+ · MetaMask · Git

### Install
```bash
git clone https://github.com/YOUR_USERNAME/certchain-live.git
cd certchain-live
npm run setup
```

### Configure
```bash
cp .env.example .env
# Fill in: SEPOLIA_RPC_URL, PRIVATE_KEY, ETHERSCAN_API_KEY,
#          PINATA_JWT, SENDGRID_API_KEY
```

### Deploy to Sepolia
```bash
npm run deploy:sepolia
```
This compiles the contract, deploys to Sepolia, auto-verifies on Etherscan,
and writes the ABI + address to `frontend/src/utils/`.

### Run Frontend
```bash
npm run frontend
# Open http://localhost:3000
# Switch MetaMask to Sepolia network
```

---

## Deploy to Vercel (Public URL)

```bash
npm install -g vercel
vercel
```

Set these environment variables in the Vercel dashboard:
```
SENDGRID_API_KEY        = SG.your_key
EMAIL_FROM              = certificates@youruniversity.edu
EMAIL_FROM_NAME         = University Certificate Registry
REACT_APP_PINATA_JWT    = your_pinata_jwt
REACT_APP_PINATA_GATEWAY= https://gateway.pinata.cloud
REACT_APP_SITE_URL      = https://your-app.vercel.app
REACT_APP_NETWORK       = sepolia
```

---

## Services Setup

### 1. Alchemy (Sepolia RPC)
1. Sign up at [alchemy.com](https://alchemy.com)
2. Create App → Network: Ethereum Sepolia
3. Copy HTTPS URL → `SEPOLIA_RPC_URL`

### 2. Etherscan (Contract Verification)
1. Sign up at [etherscan.io](https://etherscan.io)
2. Account → API Keys → Add → Copy → `ETHERSCAN_API_KEY`

### 3. Pinata (IPFS PDF Storage)
1. Sign up at [pinata.cloud](https://pinata.cloud) — 1GB free
2. Developers → API Keys → New Key → Admin → JWT
3. Copy JWT → `PINATA_JWT` and `REACT_APP_PINATA_JWT`

### 4. SendGrid (Email Notifications)
1. Sign up at [sendgrid.com](https://sendgrid.com) — 100 emails/day free
2. Settings → API Keys → Create → Full Access
3. Copy key → `SENDGRID_API_KEY`
4. Verify your sender email address in SendGrid

### 5. Sepolia ETH (Free)
Get free Sepolia ETH from:
- [sepoliafaucet.com](https://sepoliafaucet.com)
- [faucets.chain.link/sepolia](https://faucets.chain.link/sepolia)

---

## Project Structure

```
certchain-live/
├── contracts/
│   └── CertChain.sol              # Production smart contract
├── scripts/
│   └── deploy.js                  # Deploy + auto-verify on Etherscan
├── test/
│   └── CertChain.test.js
├── api/
│   └── notify.js                  # Vercel serverless email function
├── frontend/src/
│   ├── hooks/
│   │   ├── useWeb3.js             # Wallet + contract connection
│   │   ├── useCertificate.js      # All contract calls
│   │   ├── usePDF.js              # PDF hashing (browser)
│   │   ├── usePinata.js           # IPFS upload via Pinata
│   │   └── useNotify.js           # Email notification
│   ├── pages/
│   │   ├── Home.js
│   │   ├── Verify.js              # certId + PDF integrity check
│   │   ├── Issue.js               # PDF → IPFS → chain → email
│   │   ├── Registry.js            # Public institution browser
│   │   ├── Dashboard.js           # Search by student/institution
│   │   ├── Admin.js               # Register/update/revoke institutions
│   │   └── CertDetail.js
│   └── components/
│       ├── Navbar.js
│       ├── CertificateCard.js
│       └── PDFUploader.js
├── .env.example
├── hardhat.config.js
├── vercel.json
└── .github/workflows/ci.yml
```

---

## Certificate Issuance Flow

```
Institution uploads PDF
        ↓
Browser computes SHA-256 hash locally (never leaves device)
        ↓
PDF uploaded to Pinata IPFS → CID returned
        ↓
issueCertificate() called on Sepolia
metadataURI = "sha256:<hash> | ipfs://<CID>"
        ↓
CertificateIssued event emitted — certId generated
        ↓
Email sent to student via SendGrid /api/notify
        ↓
Student receives certId + verification link + IPFS PDF link
```

---

## Verification Flow

```
Anyone pastes certId
        ↓
verifyCertificate() called — FREE, no gas, no wallet
        ↓
Returns: valid (bool) + full Certificate struct
        ↓
Optional: upload PDF → hash compared to on-chain record
        ↓
Result: Authentic ✅ | Mismatch ❌ | No hash on record ⚠️
```

---

## Smart Contract — New Fields vs POC

| Field | POC | Live |
|---|---|---|
| Institution struct | name only | name + website + emailDomain + totalIssued |
| Certificate struct | no email | + studentEmail |
| Institution lookup | mapping only | + getAllInstitutions() array |
| Institution update | not supported | updateInstitution() |
| Registration event | InstitutionAuthorised | InstitutionRegistered + emailDomain |

---

## Gas Estimates (Sepolia)

| Operation | Gas | Cost at 10 Gwei |
|---|---|---|
| Deploy contract | ~850,000 | ~0.0085 ETH |
| Register institution | ~55,000 | ~0.00055 ETH |
| Issue certificate | ~210,000 | ~0.0021 ETH |
| Revoke certificate | ~32,000 | ~0.00032 ETH |
| Verify (read) | 0 | Free |

---

## License
MIT
