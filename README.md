# Blockchain Voting DApp

This repository contains a complete local voting demo based on the specification in `huong-dan-he-thong-bau-cu-blockchain.md`.

## Quick start

```bash
npm install
npm run compile
npm run test
```

## Local deployment

In terminal 1:

```bash
npm run node
```

In terminal 2:

```bash
npm run deploy:localhost
npm run demo:localhost
npm run serve:frontend
```

Open `http://127.0.0.1:8081` after the frontend server starts.

## Test accounts for voting (MetaMask)

After running `npm run deploy:localhost`, the script now auto-generates `tai-khoan-test-local.md` at repository root.

Security improvement: test private keys are no longer exposed in frontend assets.

Use that markdown file to copy one local account private key and import it into MetaMask.

## Core governance upgrades

- Snapshot voter list when owner starts election (`startElection`)
- Freeze election parameters after start (cannot add candidate or whitelist voter)
- Standardized on-chain audit trail with query APIs (`getAuditTrailCount`, `getAuditRecord`, `getElectionSummary`)

## Manual self-test flow

1. Start local chain: `npm run node`
2. Deploy + sync frontend config: `npm run deploy:localhost`
3. Start frontend: `npm run serve:frontend`
4. Open `http://127.0.0.1:8081`
5. In MetaMask, switch to Hardhat and import one voter account from `tai-khoan-test-local.md`
6. Use owner account to whitelist voter addresses
7. Owner starts election (this snapshots voters and freezes parameters)
8. Voter casts one vote and verify second vote is blocked
9. Owner ends election and verify voting is blocked afterward