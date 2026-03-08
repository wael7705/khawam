import { customAlphabet } from 'nanoid';

const ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const ID_LENGTH = 12;

const generate = customAlphabet(ALPHABET, ID_LENGTH);

export function createId(): string {
  return generate();
}

export function createShortId(): string {
  return customAlphabet(ALPHABET, 8)();
}
