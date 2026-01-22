import { PositionAction } from "generated";

export const savePositionAction = async (
  context: any,
  user: string,
  positionId: bigint,
  price: bigint,
  amount: bigint,
  timestamp: bigint,
  transactionHash: string,
  blockNumber: bigint,
  logIndex: bigint,
  actionType: string,
  source: string,
  index: bigint
) => {
  const actionId = `${transactionHash}-${logIndex}-${positionId}`;
  const action: PositionAction = {
    id: actionId,
    user,
    tokenId: positionId,
    actionType,
    amount,
    price,
    timestamp,
    block: blockNumber,
    transactionHash,
    logIndex,
    source,
    index,
  };
  context.PositionAction.set(action);
};

export const updateUserPositionWithBuy = async (
  context: any,
  user: string,
  positionId: bigint,
  price: bigint,
  amount: bigint,
  conditionId: string,
  timestamp: bigint,
  transactionHash: string,
  blockNumber: bigint,
  logIndex: bigint,
  actionType: string,
  source: string,
  index: bigint
) => {
  savePositionAction(
    context,
    user,
    positionId,
    price,
    amount,
    timestamp,
    transactionHash,
    blockNumber,
    logIndex,
    actionType,
    source,
    index
  );
};

export const updateUserPositionWithSell = async (
  context: any,
  user: string,
  positionId: bigint,
  price: bigint,
  amount: bigint,
  conditionId: string,
  timestamp: bigint,
  transactionHash: string,
  blockNumber: bigint,
  logIndex: bigint,
  actionType: string,
  source: string,
  index: bigint
) => {
    savePositionAction(
    context,
    user,
    positionId,
    price,
    amount,
    timestamp,
    transactionHash,
    blockNumber,
    logIndex,
    actionType,
    source,
    index
  );
};
