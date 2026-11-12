# RAVOXA — Celo MiniPay Prototype

RAVOXA is a mobile-first financial planning and testnet wallet prototype for MiniPay on Celo.

## Current features

- Connect a MiniPay-injected wallet and inspect its public address and chain.
- Celo Sepolia CELO, USDm, and Circle USDC balances. Testnet assets have no monetary value.
- CELO and USDm Send interfaces with review, validation and transaction receipt monitoring. **Live MiniPay authorization is not yet verified.**
- Receive via QR or copied wallet address, plus a shareable testnet payment request.
- USDC → USDm **read-only** quote from the Mento SDK. No approval or swap controls are enabled.
- Simple savings-goal planner (data is stored only in this browser; no funds are deposited or locked).
- Wallet Profile page and explorer link.
- Navigation state persisted in the same browser tab across page reloads when session storage is available.

## Develop and build

Node.js 24 is recommended.

~~~bash
npm ci
npm run build
npm run lint
npm run dev -- --host 0.0.0.0
~~~

For embedded MiniPay testing, use a forwarded **HTTPS** Codespaces port. To avoid development hot reloads, the Vite dev server disables HMR. After editing, refresh manually. For stable testing of a built version use:

~~~bash
npm run build
npm run preview -- --host 0.0.0.0 --port 4173
~~~

Forward port 4173. Keep source-control and preview URLs private unless a public test is intended.

## Development safety

- Transactions in the Send pages are restricted to **Celo Sepolia (chain ID 11142220)**.
- Never use real funds in this testnet prototype.
- MiniPay must explicitly approve every transaction. No private keys or recovery phrases should be entered into RAVOXA.
- The swap screen is preview-only, so it cannot request token allowances or spend tokens.
- No backend account ledger, real-money custody, KYC, real budgets, fiat conversions, or persistent cross-device financial records are implemented.
- A refreshed screen can preserve its route, but restoring a route **does not** restore or automatically retry a pending transaction.
- This is not a production-ready financial service.

## Next validation steps

1. Merge or check out this work without losing any uncommitted changes in Codespaces (the Swap and USDC hook were previously created locally).
2. Confirm the app stays on Services/Swap after a manual reload and that unexpected full reloads stop on port 4173.
3. Test Home → Send, Receive, Request, and Swap plus Plan and Profile on Android.
4. Exercise the Send forms with read-only values, then separately validate MiniPay authorization using small amounts of test tokens.
5. Design and audit an explicit ERC-20 approval and swap workflow with allowance checks, fresh quote, slippage, expiry, fee estimation and deduplication before enabling swaps.
6. Add backend persistence, authenticated sync, transaction activity indexing, accounting, and security review if the project is to hold real funds.

Repository: https://github.com/osherworkspace/ravoxa
