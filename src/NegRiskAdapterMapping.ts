import { NegRiskAdapter, NegRiskEvent } from 'generated';

import {
  COLLATERAL_SCALE,
  FIFTY_CENTS,
  NEG_RISK_EXCHANGE,
} from './utils/constants';

import * as IdHelpers from './utils/id-helpers';
import * as MappingHelpers from './utils/mapping-helpers';
import * as MathHelpers from './utils/math-helpers';

// --- NegRiskAdapter ---

NegRiskAdapter.MarketPrepared.handler(async ({ event, context }) => {
  const negRiskEvent: NegRiskEvent = {
    id: event.params.marketId,
    questionCount: 0,
  };
  context.NegRiskEvent.set(negRiskEvent);
});

NegRiskAdapter.QuestionPrepared.handler(async ({ event, context }) => {
  const marketId = event.params.marketId;
  let negRiskEvent = await context.NegRiskEvent.get(marketId);
  if (!negRiskEvent) return;

  negRiskEvent = {
    ...negRiskEvent,
    questionCount: negRiskEvent.questionCount + 1,
  };
  context.NegRiskEvent.set(negRiskEvent);
});

NegRiskAdapter.PositionSplit.handler(async ({ event, context }) => {
  const conditionId = event.params.conditionId;
  const condition = await context.Condition.get(conditionId);
  if (!condition) return;

  const stakeholder = event.params.stakeholder.toLowerCase();
  if (stakeholder === NEG_RISK_EXCHANGE) return;

  for (let i = 0; i < 2; i++) {
    const positionId = condition.positionIds[i];
    await MappingHelpers.updateUserPositionWithBuy(
      context,
      event.params.stakeholder,
      positionId,
      FIFTY_CENTS,
      event.params.amount,
      conditionId,
      BigInt(event.block.timestamp),
      event.transaction.hash,
      BigInt(event.block.number),
      BigInt(event.logIndex),
      'Split',
      'handlePositionSplit-Buy',
      BigInt(i),
    );
  }
});

NegRiskAdapter.PositionsMerge.handler(async ({ event, context }) => {
  const conditionId = event.params.conditionId;
  const condition = await context.Condition.get(conditionId);
  if (!condition) return;

  const stakeholder = event.params.stakeholder.toLowerCase();
  if (stakeholder === NEG_RISK_EXCHANGE) return;

  for (let i = 0; i < 2; i++) {
    const positionId = condition.positionIds[i];
    await MappingHelpers.updateUserPositionWithSell(
      context,
      event.params.stakeholder,
      positionId,
      FIFTY_CENTS,
      event.params.amount,
      conditionId,
      BigInt(event.block.timestamp),
      event.transaction.hash,
      BigInt(event.block.number),
      BigInt(event.logIndex),
      'Merge',
      'handlePositionsMerge-Sell',
      BigInt(i),
    );
  }
});

NegRiskAdapter.PositionsConverted.handler(async ({ event, context }) => {
  const negRiskEvent = await context.NegRiskEvent.get(event.params.marketId);
  if (!negRiskEvent) return;

  const questionCount = negRiskEvent.questionCount;
  const indexSet = event.params.indexSet; // uint256

  let actionIndex = 0n;
  let noCount = 0;

  // NO Price Loop
  for (let questionIndex = 0; questionIndex < questionCount; questionIndex++) {
    const isSet = (indexSet & (1n << BigInt(questionIndex))) !== 0n;
    if (isSet) {
      noCount++;
      const positionId = IdHelpers.getNegRiskPositionId(
        event.params.marketId,
        questionIndex,
        1,
      ); // NO_INDEX = 1
      const conditionId = IdHelpers.getNegRiskConditionId(
        event.params.marketId,
        questionIndex,
      );

      await MappingHelpers.updateUserPositionWithSell(
        context,
        event.params.stakeholder,
        positionId,
        0n, // "sell for zero price"
        event.params.amount,
        conditionId,
        BigInt(event.block.timestamp),
        event.transaction.hash,
        BigInt(event.block.number),
        BigInt(event.logIndex),
        'Convert',
        'handlePositionsConverted-Sell',
        actionIndex++,
      );
    }
  }

  // Average NO price is 0
  const noPrice = 0n;

  if (questionCount === noCount) return;

  const yesPrice = MathHelpers.computeNegRiskYesPrice(
    noPrice,
    noCount,
    questionCount,
  );

  // YES Price Loop
  for (let questionIndex = 0; questionIndex < questionCount; questionIndex++) {
    const isSet = (indexSet & (1n << BigInt(questionIndex))) !== 0n;
    if (!isSet) {
      const positionId = IdHelpers.getNegRiskPositionId(
        event.params.marketId,
        questionIndex,
        0,
      ); // YES_INDEX = 0
      const conditionId = IdHelpers.getNegRiskConditionId(
        event.params.marketId,
        questionIndex,
      );

      await MappingHelpers.updateUserPositionWithBuy(
        context,
        event.params.stakeholder,
        positionId,
        yesPrice,
        event.params.amount,
        conditionId,
        BigInt(event.block.timestamp),
        event.transaction.hash,
        BigInt(event.block.number),
        BigInt(event.logIndex),
        'Convert',
        'handlePositionsConverted-Buy',
        actionIndex++,
      );
    }
  }
});

NegRiskAdapter.PayoutRedemption.handler(async ({ event, context }) => {
  const conditionId = event.params.conditionId;
  const condition = await context.Condition.get(conditionId);
  if (!condition) return;

  if (condition.payoutDenominator === 0n) return;

  for (let i = 0; i < 2; i++) {
    const positionId = condition.positionIds[i];
    const amount = 0n;

    const price =
      (condition.payoutNumerators[i] * COLLATERAL_SCALE) /
      condition.payoutDenominator;

    await MappingHelpers.updateUserPositionWithSell(
      context,
      event.params.redeemer,
      positionId,
      price,
      amount,
      conditionId,
      BigInt(event.block.timestamp),
      event.transaction.hash,
      BigInt(event.block.number),
      BigInt(event.logIndex),
      'Redeem',
      'handlePayoutRedemption-Sell',
      BigInt(i),
    );
  }
});
