import { keccak256, getBytes, hexlify } from "ethers";
import { NEG_RISK_ADAPTER, USDC, NEG_RISK_WRAPPED_COLLATERAL } from "./constants";
import { computePositionId } from "./ctf-utils";

export const getConditionId = (
  oracle: string,
  questionId: string
): string => {
  // 20 + 32 + 32 = 84 bytes
  const hashPayload = new Uint8Array(84);
  hashPayload.fill(0);
  
  hashPayload.set(getBytes(oracle), 0);
  hashPayload.set(getBytes(questionId), 20);
  hashPayload[83] = 0x02; // outcomeSlotCount = 2

  return keccak256(hashPayload);
};

export const getNegRiskQuestionId = (
  marketId: string,
  questionIndex: number
): string => {
  const marketIdBytes = getBytes(marketId);
  const questionIdBytes = new Uint8Array(marketIdBytes);
  // Replaces last byte with questionIndex
  questionIdBytes[31] = questionIndex;
  return hexlify(questionIdBytes);
};

export const getNegRiskConditionId = (
  negRiskMarketId: string,
  questionIndex: number
): string => {
  const questionId = getNegRiskQuestionId(negRiskMarketId, questionIndex);
  return getConditionId(NEG_RISK_ADAPTER, questionId);
};

export const getNegRiskPositionId = (
  negRiskMarketId: string,
  questionIndex: number,
  outcomeIndex: number
): bigint => {
  const conditionId = getNegRiskConditionId(negRiskMarketId, questionIndex);
  return computePositionId(NEG_RISK_WRAPPED_COLLATERAL, conditionId, outcomeIndex);
};

export const getPositionId = (
    conditionId: string,
    outcomeIndex: number,
    negRisk: boolean
): bigint => {
    const collateral = negRisk ? NEG_RISK_WRAPPED_COLLATERAL : USDC;
    return computePositionId(collateral, conditionId, outcomeIndex);
}
