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
): BundleCount[] | null {
  const sizes = [...bundleSizes].sort((a, b) => a - b);

  const dp: number[] = new Array(groupSize + 1).fill(Infinity);
  const lastUsed: number[] = new Array(groupSize + 1).fill(0);
  dp[0] = 0;

  for (let n = 1; n <= groupSize; n++) {
    for (const s of sizes) {
      if (s <= n && dp[n - s] + 1 < dp[n]) {
        dp[n] = dp[n - s] + 1;
        lastUsed[n] = s;
      }
    }
  }

  if (dp[groupSize] === Infinity) {
    return null;
  }

  const counts = new Map<number, number>();
  let n = groupSize;

  while (n > 0) {
    const s = lastUsed[n];
    counts.set(s, (counts.get(s) ?? 0) + 1);
    n -= s;
  }

  return Array.from(counts.entries())
    .map(([size, count]) => ({ size, count }))
    .sort((a, b) => b.size - a.size);
}