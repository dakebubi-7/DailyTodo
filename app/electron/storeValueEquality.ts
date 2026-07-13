export function areStoreValuesEqual(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) return true;

  if (
    left === null ||
    right === null ||
    typeof left !== 'object' ||
    typeof right !== 'object'
  ) {
    return false;
  }

  if (Array.isArray(left) || Array.isArray(right)) {
    if (!Array.isArray(left) || !Array.isArray(right) || left.length !== right.length) {
      return false;
    }

    return left.every((value, index) => areStoreValuesEqual(value, right[index]));
  }

  const leftEntries = Object.entries(left);
  const rightEntries = Object.entries(right);
  if (leftEntries.length !== rightEntries.length) return false;

  return leftEntries.every(([key, value]) =>
    Object.prototype.hasOwnProperty.call(right, key)
      && areStoreValuesEqual(value, (right as Record<string, unknown>)[key]),
  );
}
