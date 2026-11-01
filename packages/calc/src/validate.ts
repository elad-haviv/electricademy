export function assertFinite(value: number, name: string): void {
  if (!Number.isFinite(value)) throw new Error(`${name} must be a finite number`);
}

export function assertPositive(value: number, name: string): void {
  assertFinite(value, name);
  if (value <= 0) throw new Error(`${name} must be greater than zero`);
}
