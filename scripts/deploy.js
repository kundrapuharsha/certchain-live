const { ethers, network, run } = require("hardhat");
const fs   = require("fs");
const path = require("path");

async function main() {
  console.log(`\n🚀  Deploying CertChain to ${network.name}...\n`);

  const [deployer] = await ethers.getSigners();
  const balance    = await ethers.provider.getBalance(deployer.address);

  console.log(`Deployer : ${deployer.address}`);
  console.log(`Balance  : ${ethers.formatEther(balance)} ETH\n`);

  if (balance === 0n && network.name !== "hardhat") {
    console.error("❌  Deployer has no ETH. Get Sepolia ETH from https://sepoliafaucet.com");
    process.exit(1);
  }

  const CertChain = await ethers.getContractFactory("CertChain");
  console.log("Deploying contract...");
  const certChain = await CertChain.deploy();
  await certChain.waitForDeployment();

  const address = await certChain.getAddress();
  const txHash  = certChain.deploymentTransaction()?.hash || "";
  const chainId = (await ethers.provider.getNetwork()).chainId.toString();

  console.log(`\n✅  CertChain deployed!`);
  console.log(`   Address : ${address}`);
  console.log(`   Chain   : ${network.name} (${chainId})`);
  console.log(`   Tx      : ${txHash}`);

  if (network.name === "sepolia") {
    console.log(`   Etherscan: https://sepolia.etherscan.io/address/${address}`);
  }

  // ── Save deployment record ──────────────────────────────
  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) fs.mkdirSync(deploymentsDir);
  const record = { network: network.name, chainId, address, deployer: deployer.address,
    deployedAt: new Date().toISOString(), transactionHash: txHash };
  fs.writeFileSync(
    path.join(deploymentsDir, `${network.name}.json`),
    JSON.stringify(record, null, 2)
  );
  console.log(`\n📋  Saved to deployments/${network.name}.json`);

  // ── Write ABI + address to frontend ───────────────────
  const artifact = JSON.parse(fs.readFileSync(
    path.join(__dirname, "../artifacts/contracts/CertChain.sol/CertChain.json")
  ));

  const utilsDir = path.join(__dirname, "../frontend/src/utils");
  if (!fs.existsSync(utilsDir)) fs.mkdirSync(utilsDir, { recursive: true });

  fs.writeFileSync(path.join(utilsDir, "contractABI.json"), JSON.stringify(artifact.abi, null, 2));

  const addrFile = path.join(utilsDir, "contractAddress.json");
  const existing = fs.existsSync(addrFile) ? JSON.parse(fs.readFileSync(addrFile)) : {};
  const networkKey = { "31337": "localhost", "11155111": "sepolia", "137": "polygon" }[chainId] || network.name;
  existing[networkKey] = { address, chainId };
  fs.writeFileSync(addrFile, JSON.stringify(existing, null, 2));
  console.log(`📁  ABI + address written to frontend/src/utils/`);

  // ── Auto-verify on Sepolia ─────────────────────────────
  if (network.name === "sepolia" && process.env.ETHERSCAN_API_KEY) {
    console.log("\n⏳  Waiting 30s for Etherscan to index...");
    await new Promise(r => setTimeout(r, 30000));
    try {
      await run("verify:verify", { address, constructorArguments: [] });
      console.log("✅  Contract verified on Etherscan!");
    } catch (e) {
      console.log("⚠️  Verification failed (you can retry manually):", e.message);
    }
  }

  console.log("\n🎉  Deployment complete!\n");
  if (network.name === "sepolia") {
    console.log("Next steps:");
    console.log("  1. cd frontend && npm start");
    console.log("  2. Switch MetaMask to Sepolia network");
    console.log("  3. Register your first institution in the Admin panel");
    console.log("  4. Deploy frontend to Vercel for public access\n");
  }
}

main().catch(e => { console.error(e); process.exitCode = 1; });
