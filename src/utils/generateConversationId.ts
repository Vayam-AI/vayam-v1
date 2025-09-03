import { randomFillSync } from "crypto";

export const generateConversationId = async (length = 10) => {
  const charset = "abcdefghijklmnopqrstuvwxyz0123456789";
  const values = new Uint32Array(length);

  // Use Node.js crypto API for secure random values
  randomFillSync(values);

  let result = "";
  for (let i = 0; i < length; i++) {
    result += charset[values[i] % charset.length];
  }

  return result;
};
