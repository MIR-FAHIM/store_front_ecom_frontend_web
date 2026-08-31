const VERSION = 4;
const SIZE = 33;
const DATA_CODEWORDS = 80;
const ECC_CODEWORDS = 20;

const getUtf8Bytes = (text) => Array.from(new TextEncoder().encode(String(text || "")));

const makeMatrix = (fill = null) => Array.from({ length: SIZE }, () => Array(SIZE).fill(fill));

const setModule = (matrix, reserved, x, y, value, reserve = true) => {
  if (x < 0 || y < 0 || x >= SIZE || y >= SIZE) return;
  matrix[y][x] = Boolean(value);
  if (reserve) reserved[y][x] = true;
};

const drawFinder = (matrix, reserved, x, y) => {
  for (let dy = -1; dy <= 7; dy += 1) {
    for (let dx = -1; dx <= 7; dx += 1) {
      const xx = x + dx;
      const yy = y + dy;
      const on = dx >= 0 && dx <= 6 && dy >= 0 && dy <= 6 && (dx === 0 || dx === 6 || dy === 0 || dy === 6 || (dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4));
      setModule(matrix, reserved, xx, yy, on);
    }
  }
};

const drawAlignment = (matrix, reserved, cx, cy) => {
  for (let dy = -2; dy <= 2; dy += 1) {
    for (let dx = -2; dx <= 2; dx += 1) {
      const dist = Math.max(Math.abs(dx), Math.abs(dy));
      setModule(matrix, reserved, cx + dx, cy + dy, dist !== 1);
    }
  }
};

const setupFunctionPatterns = () => {
  const matrix = makeMatrix(false);
  const reserved = makeMatrix(false);

  drawFinder(matrix, reserved, 0, 0);
  drawFinder(matrix, reserved, SIZE - 7, 0);
  drawFinder(matrix, reserved, 0, SIZE - 7);

  for (let i = 8; i < SIZE - 8; i += 1) {
    setModule(matrix, reserved, i, 6, i % 2 === 0);
    setModule(matrix, reserved, 6, i, i % 2 === 0);
  }

  drawAlignment(matrix, reserved, 26, 26);
  setModule(matrix, reserved, 8, 4 * VERSION + 9, true);

  reserveFormatAreas(reserved);
  return { matrix, reserved };
};

const reserveFormatAreas = (reserved) => {
  for (let i = 0; i <= 8; i += 1) {
    if (i !== 6) {
      reserved[8][i] = true;
      reserved[i][8] = true;
    }
  }
  for (let i = 0; i < 8; i += 1) {
    reserved[8][SIZE - 1 - i] = true;
    reserved[SIZE - 1 - i][8] = true;
  }
};

const appendBits = (bits, value, length) => {
  for (let i = length - 1; i >= 0; i -= 1) bits.push(((value >>> i) & 1) === 1);
};

const makeDataCodewords = (text) => {
  const bytes = getUtf8Bytes(text);
  if (bytes.length > 78) {
    throw new Error("Store URL is too long for this QR frame. Please use a shorter store slug/domain.");
  }

  const bits = [];
  appendBits(bits, 0x4, 4);
  appendBits(bits, bytes.length, 8);
  bytes.forEach((byte) => appendBits(bits, byte, 8));

  const maxBits = DATA_CODEWORDS * 8;
  appendBits(bits, 0, Math.min(4, maxBits - bits.length));
  while (bits.length % 8 !== 0) bits.push(false);

  const data = [];
  for (let i = 0; i < bits.length; i += 8) {
    let value = 0;
    for (let j = 0; j < 8; j += 1) value = (value << 1) | (bits[i + j] ? 1 : 0);
    data.push(value);
  }

  for (let pad = 0; data.length < DATA_CODEWORDS; pad += 1) data.push(pad % 2 === 0 ? 0xec : 0x11);
  return data;
};

const gfMultiply = (x, y) => {
  let z = 0;
  let multiplicand = x;
  let multiplier = y;

  // Multiply in GF(256) for Reed-Solomon error correction.
  for (let i = 0; i < 8; i += 1) {
    if ((multiplier & 1) !== 0) z ^= multiplicand;
    const carry = multiplicand & 0x80;
    multiplicand = (multiplicand << 1) & 0xff;
    if (carry !== 0) multiplicand ^= 0x1d;
    multiplier >>>= 1;
  }
  return z;
};

const gfPow = (x, power) => {
  let result = 1;
  for (let i = 0; i < power; i += 1) result = gfMultiply(result, x);
  return result;
};

const reedSolomonGenerator = (degree) => {
  const result = Array(degree).fill(0);
  result[degree - 1] = 1;
  for (let i = 0; i < degree; i += 1) {
    const root = gfPow(2, i);
    for (let j = 0; j < degree; j += 1) {
      result[j] = gfMultiply(result[j], root);
      if (j + 1 < degree) result[j] ^= result[j + 1];
    }
  }
  return result;
};

const reedSolomonRemainder = (data, degree) => {
  const generator = reedSolomonGenerator(degree);
  const result = Array(degree).fill(0);
  data.forEach((byte) => {
    const factor = byte ^ result.shift();
    result.push(0);
    generator.forEach((coefficient, i) => {
      result[i] ^= gfMultiply(coefficient, factor);
    });
  });
  return result;
};

const placeData = (matrix, reserved, codewords) => {
  const bits = [];
  codewords.forEach((byte) => appendBits(bits, byte, 8));

  let bitIndex = 0;
  let upward = true;
  for (let right = SIZE - 1; right >= 1; right -= 2) {
    if (right === 6) right -= 1;
    for (let vert = 0; vert < SIZE; vert += 1) {
      const y = upward ? SIZE - 1 - vert : vert;
      for (let dx = 0; dx < 2; dx += 1) {
        const x = right - dx;
        if (!reserved[y][x] && bitIndex < bits.length) {
          matrix[y][x] = bits[bitIndex];
          bitIndex += 1;
        }
      }
    }
    upward = !upward;
  }
};

const maskCondition = (mask, x, y) => {
  switch (mask) {
    case 0: return (x + y) % 2 === 0;
    case 1: return y % 2 === 0;
    case 2: return x % 3 === 0;
    case 3: return (x + y) % 3 === 0;
    case 4: return (Math.floor(y / 2) + Math.floor(x / 3)) % 2 === 0;
    case 5: return ((x * y) % 2) + ((x * y) % 3) === 0;
    case 6: return (((x * y) % 2) + ((x * y) % 3)) % 2 === 0;
    case 7: return (((x + y) % 2) + ((x * y) % 3)) % 2 === 0;
    default: return false;
  }
};

const applyMask = (matrix, reserved, mask) => {
  const out = matrix.map((row) => row.slice());
  for (let y = 0; y < SIZE; y += 1) {
    for (let x = 0; x < SIZE; x += 1) {
      if (!reserved[y][x] && maskCondition(mask, x, y)) out[y][x] = !out[y][x];
    }
  }
  return out;
};

const getPenalty = (matrix) => {
  let penalty = 0;
  const scoreRuns = (line) => {
    let score = 0;
    let runColor = line[0];
    let runLength = 1;
    for (let i = 1; i < line.length; i += 1) {
      if (line[i] === runColor) runLength += 1;
      else {
        if (runLength >= 5) score += 3 + runLength - 5;
        runColor = line[i];
        runLength = 1;
      }
    }
    if (runLength >= 5) score += 3 + runLength - 5;
    return score;
  };

  for (let i = 0; i < SIZE; i += 1) {
    penalty += scoreRuns(matrix[i]);
    penalty += scoreRuns(matrix.map((row) => row[i]));
  }

  for (let y = 0; y < SIZE - 1; y += 1) {
    for (let x = 0; x < SIZE - 1; x += 1) {
      const color = matrix[y][x];
      if (matrix[y][x + 1] === color && matrix[y + 1][x] === color && matrix[y + 1][x + 1] === color) penalty += 3;
    }
  }

  const finderPattern = "10111010000";
  const reverseFinderPattern = "00001011101";
  for (let i = 0; i < SIZE; i += 1) {
    const row = matrix[i].map((v) => (v ? "1" : "0")).join("");
    const col = matrix.map((r) => (r[i] ? "1" : "0")).join("");
    for (let j = 0; j <= SIZE - 11; j += 1) {
      if (row.slice(j, j + 11) === finderPattern || row.slice(j, j + 11) === reverseFinderPattern) penalty += 40;
      if (col.slice(j, j + 11) === finderPattern || col.slice(j, j + 11) === reverseFinderPattern) penalty += 40;
    }
  }

  const dark = matrix.flat().filter(Boolean).length;
  const percent = (dark * 100) / (SIZE * SIZE);
  penalty += Math.floor(Math.abs(percent - 50) / 5) * 10;
  return penalty;
};

const formatBits = (mask) => {
  let data = (1 << 3) | mask;
  let bits = data << 10;
  for (let i = 14; i >= 10; i -= 1) {
    if (((bits >>> i) & 1) !== 0) bits ^= 0x537 << (i - 10);
  }
  return ((data << 10) | bits) ^ 0x5412;
};

const drawFormatBits = (matrix, mask) => {
  const bits = formatBits(mask);
  const bit = (i) => ((bits >>> i) & 1) !== 0;

  for (let i = 0; i <= 5; i += 1) matrix[8][i] = bit(i);
  matrix[8][7] = bit(6);
  matrix[8][8] = bit(7);
  matrix[7][8] = bit(8);
  for (let i = 9; i < 15; i += 1) matrix[14 - i][8] = bit(i);

  for (let i = 0; i < 8; i += 1) matrix[SIZE - 1 - i][8] = bit(i);
  for (let i = 8; i < 15; i += 1) matrix[8][SIZE - 15 + i] = bit(i);
  matrix[8][SIZE - 8] = true;
};

export const createQrMatrix = (text) => {
  const { matrix, reserved } = setupFunctionPatterns();
  const data = makeDataCodewords(text);
  const ecc = reedSolomonRemainder(data, ECC_CODEWORDS);
  placeData(matrix, reserved, [...data, ...ecc]);

  let bestMask = 0;
  let bestMatrix = null;
  let bestPenalty = Infinity;
  for (let mask = 0; mask < 8; mask += 1) {
    const candidate = applyMask(matrix, reserved, mask);
    drawFormatBits(candidate, mask);
    const penalty = getPenalty(candidate);
    if (penalty < bestPenalty) {
      bestMask = mask;
      bestMatrix = candidate;
      bestPenalty = penalty;
    }
  }

  drawFormatBits(bestMatrix, bestMask);
  return bestMatrix;
};
