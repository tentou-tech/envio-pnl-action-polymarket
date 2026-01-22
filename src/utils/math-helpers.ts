import { COLLATERAL_SCALE } from "./constants";

export const computeFpmmPrice = (amounts: bigint[], outcomeIndex: number): bigint => {
    // amounts[1 - outcomeIndex] * COLLATERAL_SCALE / (amounts[0] + amounts[1])
    return (amounts[1 - outcomeIndex] * COLLATERAL_SCALE) / (amounts[0] + amounts[1]);
}

export const computeNegRiskYesPrice = (
    noPrice: bigint,
    noCount: number,
    questionCount: number
): bigint => {
    // noPrice * noCount - COLLATERAL_SCALE * (noCount - 1) / (questionCount - noCount)
    const num = (noPrice * BigInt(noCount)) - (COLLATERAL_SCALE * BigInt(noCount - 1));
    const den = BigInt(questionCount - noCount);
    // avoid division by zero if questionCount == noCount (should be handled by caller)
    if (den === 0n) return 0n; 
    return num / den;
}

export const parseFundingAddedSendback = (amountsAdded: bigint[]) => {
    // refunded index is the _smaller_ value
    const outcomeIndex = amountsAdded[0] > amountsAdded[1] ? 1 : 0;
  
    // amount is larger - smaller
    const amount = amountsAdded[1 - outcomeIndex] - amountsAdded[outcomeIndex];
  
    const price = computeFpmmPrice(amountsAdded, outcomeIndex);
  
    return {
      outcomeIndex,
      price,
      amount,
    };
};
