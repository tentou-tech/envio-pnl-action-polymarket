import { keccak256, getBytes, hexlify, toBigInt } from "ethers";

const P = 21888242871839275222246405745257275088696311157297823662689037894645226208583n;
const B = 3n;

const addModP = (a: bigint, b: bigint): bigint => (a + b) % P;
const mulModP = (a: bigint, b: bigint): bigint => (a * b) % P;

const powModP = (a: bigint, b: bigint): bigint => {
  let at = a;
  let bt = b;
  let result = 1n;

  while (bt > 0n) {
    if ((bt & 1n) !== 0n) {
      result = mulModP(result, at);
    }
    at = mulModP(at, at);
    bt = bt >> 1n;
  }
  return result;
};

const legendreSymbol = (a: bigint): bigint =>
  powModP(a, (P - 1n) >> 1n);

export const computeCollectionId = (
  conditionId: string,
  outcomeIndex: number
): string => {
  const hashPayload = new Uint8Array(64);
  hashPayload.fill(0x00);

  // conditionId is hex string, convert to bytes
  const conditionIdBytes = getBytes(conditionId);
  hashPayload.set(conditionIdBytes, 0); // first 32 bytes

  // second 32 bytes is index set (1 << outcomeIndex)
  // construct 32 byte array for index set
  const indexSetVal = 1 << outcomeIndex;
  hashPayload[63] = indexSetVal;

  const hashResultHex = keccak256(hashPayload);
  const hashResultBytes = getBytes(hashResultHex);

  // reverse
  hashResultBytes.reverse();
  const hashBigInt = toBigInt(hexlify(hashResultBytes));

  const odd = (hashBigInt >> 255n) !== 0n;

  let x1 = hashBigInt;
  let yy = 0n;

  do {
    x1 = addModP(x1, 1n);
    yy = addModP(mulModP(x1, mulModP(x1, x1)), B);
  } while (legendreSymbol(yy) !== 1n);

  const oddToggle = 1n << 254n;
  if (odd) {
    if ((x1 & oddToggle) === 0n) {
      x1 = x1 + oddToggle;
    } else {
      x1 = x1 - oddToggle;
    }
  }

  let x1Hex = x1.toString(16);
  // pad
  while (x1Hex.length < 64) {
    x1Hex = "0" + x1Hex;
  }
  return "0x" + x1Hex;
};

export const computePositionId = (
  collateral: string,
  conditionId: string,
  outcomeIndex: number
): bigint => {
  const collectionId = computeCollectionId(conditionId, outcomeIndex);

  // computePositionIdFromCollectionId
  // keccak256(collateral + collectionId)
  const collateralBytes = getBytes(collateral); // 20 bytes
  const collectionIdBytes = getBytes(collectionId); // 32 bytes

  const hashPayload = new Uint8Array(52);
  hashPayload.set(collateralBytes, 0);
  hashPayload.set(collectionIdBytes, 20);

  const hashHex = keccak256(hashPayload);
  const hashBytes = getBytes(hashHex);
  hashBytes.reverse();

  return toBigInt(hexlify(hashBytes));
};
