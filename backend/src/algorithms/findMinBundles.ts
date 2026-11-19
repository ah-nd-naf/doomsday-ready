export interface BundleCount {
  size: number;
  count: number;
}

/**
 * Finds the minimum bundle combination that sums exactly to groupSize using bottom-up DP.
 *
 * @param bundleSizes - Available ticket bundle sizes
 * @param groupSize - Target group size
 * @returns Array of bundle size and count, or null if impossible
 */
export function findMinBundles(
  bundleSizes: number[],
  groupSize: number
): { size: number; count: number }[] | null {
  // TODO(author): Implement bottom-up DP for minimum bundle calculation.
  throw new Error("Not implemented: author writes this");
}
