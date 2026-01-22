import { Exchange, NegRiskExchange } from 'generated';

import { COLLATERAL_SCALE } from './utils/constants';

import * as MappingHelpers from './utils/mapping-helpers';

// --- Exchange ---

const handleOrderFilled = async (event: any, context: any) => {
  // makerAssetId = 0 -> BUY (takerAssetId is Position)
  // makerAssetId != 0 -> SELL (makerAssetId is Position)

  const makerAssetId = event.params.makerAssetId;
  const isBuy = makerAssetId === 0n;

  // parseOrderFilled logic
  const account = event.params.maker;
  const baseAmount = isBuy
    ? event.params.takerAmountFilled
    : event.params.makerAmountFilled;
  const quoteAmount = isBuy
    ? event.params.makerAmountFilled
    : event.params.takerAmountFilled;
  const positionId = isBuy
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
