export function areSettingValuesEqual(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) return true;
  if (!left || !right || typeof left !== 'object' || typeof right !== 'object') return false;
  if (Array.isArray(left) || Array.isArray(right)) {
    return Array.isArray(left)
      && Array.isArray(right)
      && left.length === right.length
      && left.every((value, index) => areSettingValuesEqual(value, right[index]));
  }

  const leftEntries = Object.entries(left);
  const rightEntries = Object.entries(right);
  return leftEntries.length === rightEntries.length
    && leftEntries.every(([key, value]) => (
      Object.prototype.hasOwnProperty.call(right, key)
        && areSettingValuesEqual(value, Object.getOwnPropertyDescriptor(right, key)?.value)
    ));
}
