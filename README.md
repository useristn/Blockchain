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

`npm run demo:localhost` now prepares the frontend demo state by whitelisting two test voters and starting the election without consuming their votes.

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
5. Run `npm run demo:localhost` once to whitelist `Voter 1` and `Voter 2`, then start the election
6. In MetaMask, switch to Hardhat and import one voter account from `tai-khoan-test-local.md`
7. Connect `Voter 1` or `Voter 2` in the frontend and cast one vote
8. Verify the same wallet cannot vote a second time
9. Connect the owner account if you want to close the election from the admin panel