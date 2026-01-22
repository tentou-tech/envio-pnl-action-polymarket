import { ConditionalTokens, Condition, Position } from 'generated';

import {
  COLLATERAL_SCALE,
  FIFTY_CENTS,
  NEG_RISK_ADAPTER,
  EXCHANGE,
} from './utils/constants';

import * as IdHelpers from './utils/id-helpers';
import * as MappingHelpers from './utils/mapping-helpers';

// --- ConditionalTokens ---

ConditionalTokens.ConditionPreparation.handler(async ({ event, context }) => {
  if (event.params.outcomeSlotCount !== 2n) {
    return;
  }

  const conditionId = event.params.conditionId;
  const negRisk = event.params.oracle.toLowerCase() === NEG_RISK_ADAPTER;

  // Create Positions first
  const positionIds: bigint[] = [];
  for (let i = 0; i < 2; i++) {
    const positionId = IdHelpers.getPositionId(conditionId, i, negRisk);
    positionIds.push(positionId);

    const position: Position = {
      id: positionId.toString(),
      conditionId: conditionId,
    };
    context.Position.set(position);
  }

  // Create Condition
  const condition: Condition = {
    id: conditionId,
    positionIds: positionIds,
    payoutNumerators: [],
    payoutDenominator: 0n,
    negRisk: negRisk,
  };

  context.Condition.set(condition);
});

ConditionalTokens.ConditionResolution.handler(async ({ event, context }) => {
  const conditionId = event.params.conditionId;
  let condition = await context.Condition.get(conditionId);

  if (!condition) return;

  condition = {
    ...condition,
    payoutNumerators: event.params.payoutNumerators,
    payoutDenominator: event.params.payoutNumerators.reduce(
      (a, b) => a + b,
      0n,
    ),
  };
  context.Condition.set(condition);
});

ConditionalTokens.PositionSplit.handler(async ({ event, context }) => {
  const conditionId = event.params.conditionId;
  const condition = await context.Condition.get(conditionId);

  if (!condition) return;

  const stakeholder = event.params.stakeholder.toLowerCase();
  if (stakeholder === NEG_RISK_ADAPTER || stakeholder === EXCHANGE) {
    return;
  }

  for (let i = 0; i < 2; i++) {
    const positionId = condition.positionIds[i]; // BigInt
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

ConditionalTokens.PositionsMerge.handler(async ({ event, context }) => {
  const conditionId = event.params.conditionId;
  const condition = await context.Condition.get(conditionId);

  if (!condition) return;

  const stakeholder = event.params.stakeholder.toLowerCase();
  if (stakeholder === NEG_RISK_ADAPTER || stakeholder === EXCHANGE) {
    return;
  }

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

ConditionalTokens.PayoutRedemption.handler(async ({ event, context }) => {
  const conditionId = event.params.conditionId;
  const condition = await context.Condition.get(conditionId);

  if (!condition) return;

  if (event.params.redeemer.toLowerCase() === NEG_RISK_ADAPTER) {
    return;
  }

  if (condition.payoutDenominator === 0n) {
    // log error?
    return;
  }

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
