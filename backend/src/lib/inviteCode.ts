import { customAlphabet } from "nanoid";

const alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const gen = customAlphabet(alphabet, 8);

export function generateInviteCode(): string {
  return gen();
}

export function isInviteExpired(expiresAt: number | null): boolean {
  if (expiresAt === null) return false;
  return Math.floor(Date.now() / 1000) > expiresAt;
}

export function isInviteExhausted(useCount: number, maxUses: number | null): boolean {
  if (maxUses === null) return false;
  return useCount >= maxUses;
}
