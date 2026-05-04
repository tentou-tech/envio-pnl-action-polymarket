import { Exchange, ExchangeV2, NegRiskExchange, NegRiskExchangeV2 } from 'generated';

import { COLLATERAL_SCALE } from './utils/constants';

import * as MappingHelpers from './utils/mapping-helpers';

// --- Exchange ---

const handleOrderFilled = async (event: any, context: any) => {
  // V1 OrderFilled: BUY/SELL inferred from makerAssetId/takerAssetId.
  // V2 OrderFilled: explicit `side` (0=BUY, 1=SELL) and a single `tokenId`.
  const isV2 = event.params.side !== undefined;

  const isBuy = isV2
    ? event.params.side === 0n
    : event.params.makerAssetId === 0n;

  const account = event.params.maker;
  const baseAmount = isBuy
    ? event.params.takerAmountFilled
    : event.params.makerAmountFilled;
  const quoteAmount = isBuy
    ? event.params.makerAmountFilled
    : event.params.takerAmountFilled;
  const positionId = isV2
    ? event.params.tokenId
    : isBuy
      ? event.params.takerAssetId
      : event.params.makerAssetId;

  const price = (quoteAmount * COLLATERAL_SCALE) / baseAmount;

  // Need to load Position to get ConditionId
  const position = await context.Position.get(positionId.toString());
  const conditionId = position ? position.conditionId : '';

  if (isBuy) {
    await MappingHelpers.updateUserPositionWithBuy(
      context,
      account,
      positionId,
      price,
      baseAmount,
      conditionId,
      BigInt(event.block.timestamp),
      event.transaction.hash,
      BigInt(event.block.number),
      BigInt(event.logIndex),
      'Buy',
      'handleOrderFilled-Buy',
      0n,
    );
  } else {
    await MappingHelpers.updateUserPositionWithSell(
      context,
      account,
      positionId,
      price,
      baseAmount,
      conditionId,
      BigInt(event.block.timestamp),
      event.transaction.hash,
      BigInt(event.block.number),
      BigInt(event.logIndex),
      'Sell',
      'handleOrderFilled-Sell',
      0n,
    );
  }
};

Exchange.OrderFilled.handler(async ({ event, context }) => {
  await handleOrderFilled(event, context);
});

NegRiskExchange.OrderFilled.handler(async ({ event, context }) => {
  await handleOrderFilled(event, context);
});

ExchangeV2.OrderFilled.handler(async ({ event, context }) => {
  await handleOrderFilled(event, context);
});

NegRiskExchangeV2.OrderFilled.handler(async ({ event, context }) => {
  await handleOrderFilled(event, context);
});
