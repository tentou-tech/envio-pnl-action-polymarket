## Envio Polymarket PnL Action

*Migrated from the [Polymarket Subgraph (pnl-raw-subgraph branch)](https://github.com/tentou-tech/polymarket-subgraph/tree/feat/pnl-raw-subgraph)*

### Position Actions

The indexer tracks user positions by listening to various events across different contracts. The logic is primarily handled by two helper functions: `updateUserPositionWithBuy` and `updateUserPositionWithSell`.

#### `updateUserPositionWithBuy` is called when:
- **Position Split**: User splits collateral into outcome tokens (e.g., in `ConditionalTokens` or `NegRiskAdapter`).
- **FPMM Buy**: User buys outcome tokens from a Fixed Product Market Maker.
- **Funding Added**: User adds liquidity and receives "sendback" tokens or LP shares.
- **Funding Removed**: User removes liquidity and receives back the underlying outcome tokens.
- **Positions Converted**: User converts positions within a Negative Risk market.
- **Order Filled**: User's buy order is filled on the Central Limit Order Book (CLOB) exchange.

#### `updateUserPositionWithSell` is called when:
- **Positions Merge**: User merges outcome tokens back into collateral.
- **Payout Redemption**: User redeems winning outcome tokens for collateral.
- **FPMM Sell**: User sells outcome tokens to a Fixed Product Market Maker.
- **Funding Removed**: User burns LP shares when removing liquidity.
- **Positions Converted**: User sells old positions during a conversion in a Negative Risk market.
- **Order Filled**: User's sell order is filled on the CLOB exchange.

### Run

```bash
pnpm dev
```

Visit http://localhost:8080 to see the GraphQL Playground, local password is `testing`.

### Generate files from `config.yaml` or `schema.graphql`

```bash
pnpm codegen
```

### Pre-requisites

- [Node.js (use v18 or newer)](https://nodejs.org/en/download/current)
- [pnpm (use v8 or newer)](https://pnpm.io/installation)
- [Docker desktop](https://www.docker.com/products/docker-desktop/)
