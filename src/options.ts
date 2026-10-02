import { InvalidArgumentError } from 'commander'

export function parsePage(value: string): string {
  if (!/^[1-9]\d*$/.test(value) || !Number.isSafeInteger(Number(value))) {
    throw new InvalidArgumentError('Page must be a positive integer.')
  }
  return value
}
