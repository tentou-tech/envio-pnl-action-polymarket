import { FixedProductMarketMaker } from 'generated';

import { COLLATERAL_SCALE } from './utils/constants';

import * as MappingHelpers from './utils/mapping-helpers';
import * as MathHelpers from './utils/math-helpers';

// --- FixedProductMarketMaker ---

FixedProductMarketMaker.FPMMBuy.handler(async ({ event, context }) => {
  if (event.params.outcomeTokensBought === 0n) return;

  const price =
    (event.params.investmentAmount * COLLATERAL_SCALE) /
    event.params.outcomeTokensBought;
  const outcomeIndex = Number(event.params.outcomeIndex);

  const fpmm = await context.FPMM.get(event.srcAddress.toLowerCase());
  if (!fpmm) return;

  const condition = await context.Condition.get(fpmm.conditionId);
  if (!condition) return;

  const positionId = condition.positionIds[outcomeIndex];

  await MappingHelpers.updateUserPositionWithBuy(
    context,
    event.params.buyer,
    positionId,
    price,
    event.params.outcomeTokensBought,
    fpmm.conditionId,
    BigInt(event.block.timestamp),
    event.transaction.hash,
    BigInt(event.block.number),
    BigInt(event.logIndex),
    'Buy',
    'handleBuy-Buy',
    0n,
  );
});

FixedProductMarketMaker.FPMMSell.handler(async ({ event, context }) => {
  if (event.params.outcomeTokensSold === 0n) return;

  const price =
    (event.params.returnAmount * COLLATERAL_SCALE) /
    event.params.outcomeTokensSold;
  const outcomeIndex = Number(event.params.outcomeIndex);

  const fpmm = await context.FPMM.get(event.srcAddress.toLowerCase());
  if (!fpmm) return;

  const condition = await context.Condition.get(fpmm.conditionId);
  if (!condition) return;

  const positionId = condition.positionIds[outcomeIndex];

  await MappingHelpers.updateUserPositionWithSell(
    context,
    event.params.seller,
    positionId,
    price,
    event.params.outcomeTokensSold,
    fpmm.conditionId,
    BigInt(event.block.timestamp),
    event.transaction.hash,
    BigInt(event.block.number),
    BigInt(event.logIndex),
    'Sell',
    'handleSell-Sell',
    0n,
  );
});

FixedProductMarketMaker.FPMMFundingAdded.handler(async ({ event, context }) => {
  const fpmm = await context.FPMM.get(event.srcAddress.toLowerCase());
  if (!fpmm) return;

  const condition = await context.Condition.get(fpmm.conditionId);
  if (!condition) return;

  if (event.params.amountsAdded[0] + event.params.amountsAdded[1] === 0n)
    return;

  const sendbackDetails = MathHelpers.parseFundingAddedSendback(
    event.params.amountsAdded,
  );
  const positionId = condition.positionIds[sendbackDetails.outcomeIndex];

  await MappingHelpers.updateUserPositionWithBuy(
    context,
    event.params.funder,
    positionId,
    sendbackDetails.price,
    sendbackDetails.amount,
    fpmm.conditionId,
    BigInt(event.block.timestamp),
    event.transaction.hash,
    BigInt(event.block.number),
    BigInt(event.logIndex),
    'Buy',
    'handleFundingAdded-Buy',
    0n,
  );

  if (event.params.sharesMinted === 0n) return;

  const totalUSDCSpend =
    event.params.amountsAdded[0] > event.params.amountsAdded[1]
      ? event.params.amountsAdded[0]
      : event.params.amountsAdded[1];

  const tokenCost =
    (sendbackDetails.amount * sendbackDetails.price) / COLLATERAL_SCALE;
  const LpShareCost = totalUSDCSpend - tokenCost;
  const LpSharePrice =
    (LpShareCost * COLLATERAL_SCALE) / event.params.sharesMinted;

  const lpPositionId = BigInt(event.srcAddress.toLowerCase());

  await MappingHelpers.updateUserPositionWithBuy(
    context,
    event.params.funder,
    lpPositionId,
    LpSharePrice,
    event.params.sharesMinted,
    event.srcAddress.toLowerCase(), // Use FPMM as conditionId
    BigInt(event.block.timestamp),
    event.transaction.hash,
    BigInt(event.block.number),
    BigInt(event.logIndex),
    'Buy',
    'handleFundingAdded-Buy',
    1n,
  );
});

FixedProductMarketMaker.FPMMFundingRemoved.handler(
  async ({ event, context }) => {
    const fpmm = await context.FPMM.get(event.srcAddress.toLowerCase());
    if (!fpmm) return;

    const condition = await context.Condition.get(fpmm.conditionId);
    if (!condition) return;

    if (event.params.amountsRemoved[0] + event.params.amountsRemoved[1] === 0n)
      return;

    let tokensCost = 0n;
    for (let i = 0; i < 2; i++) {
      const positionId = condition.positionIds[i];
      const tokenPrice = MathHelpers.computeFpmmPrice(
        event.params.amountsRemoved,
        i,
      );
      const tokenAmount = event.params.amountsRemoved[i];
      const tokenCost = (tokenPrice * tokenAmount) / COLLATERAL_SCALE;
      tokensCost += tokenCost;

      await MappingHelpers.updateUserPositionWithBuy(
        context,
        event.params.funder,
        positionId,
        tokenPrice,
        tokenAmount,
        fpmm.conditionId,
        BigInt(event.block.timestamp),
        event.transaction.hash,
        BigInt(event.block.number),
        BigInt(event.logIndex),
        'Buy', // Buying the tokens back? Original code says 'Buy'
        'handleFundingRemoved-Buy',
        BigInt(i),
      );
    }

    if (event.params.sharesBurnt === 0n) return;

    const LpSalePrice =
      ((event.params.collateralRemovedFromFeePool - tokensCost) *
        COLLATERAL_SCALE) /
      event.params.sharesBurnt;
    const lpPositionId = BigInt(event.srcAddress.toLowerCase());

    await MappingHelpers.updateUserPositionWithSell(
      context,
      event.params.funder,
      lpPositionId,
      LpSalePrice,
      event.params.sharesBurnt,
      event.srcAddress.toLowerCase(),
      BigInt(event.block.timestamp),
      event.transaction.hash,
      BigInt(event.block.number),
      BigInt(event.logIndex),
      'Sell',
      'handleFundingRemoved-Sell',
      2n,
    );
  },
);
