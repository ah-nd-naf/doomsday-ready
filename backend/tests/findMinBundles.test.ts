import { describe, it, expect } from "vitest";
import { findMinBundles, BundleCount } from "../src/algorithms/findMinBundles";

describe("findMinBundles algorithm", () => {
  /**
   * Helper that verifies the reconstructed bundle configuration
   * exactly sums up to the requested group size.
   */
  function assertValidSum(
    bundles: BundleCount[] | null,
    expectedGroupSize: number
  ): void {
    expect(bundles).not.toBeNull();
    const sum = bundles!.reduce((acc, b) => acc + b.size * b.count, 0);
    expect(sum).toBe(expectedGroupSize);
  }

  it("(a) finds 2 bundles for sizes [1, 3, 4] and group 6: exactly [{ size: 3, count: 2 }]", () => {
    const result = findMinBundles([1, 3, 4], 6);

    expect(result).toEqual([{ size: 3, count: 2 }]);
    assertValidSum(result, 6);

    const totalBundles = result!.reduce((acc, b) => acc + b.count, 0);
    expect(totalBundles).toBe(2);
  });

  it("(b) finds min bundles for sizes [2, 5] and group 11: exactly [{ size: 5, count: 1 }, { size: 2, count: 3 }]", () => {
    const result = findMinBundles([2, 5], 11);

    expect(result).toEqual([
      { size: 5, count: 1 },
      { size: 2, count: 3 },
    ]);
    assertValidSum(result, 11);

    const totalBundles = result!.reduce((acc, b) => acc + b.count, 0);
    expect(totalBundles).toBe(4);
  });

  it("(c) finds min bundles for sizes [6, 9, 20] and group 44: exactly [{ size: 20, count: 1 }, { size: 9, count: 2 }, { size: 6, count: 1 }]", () => {
    const result = findMinBundles([6, 9, 20], 44);

    expect(result).toEqual([
      { size: 20, count: 1 },
      { size: 9, count: 2 },
      { size: 6, count: 1 },
    ]);
    assertValidSum(result, 44);

    const totalBundles = result!.reduce((acc, b) => acc + b.count, 0);
    expect(totalBundles).toBe(4);
  });

  it("(d) returns null for sizes [4, 6] and unreachable group 7", () => {
    const result = findMinBundles([4, 6], 7);
    expect(result).toBeNull();
  });

  it("(e) avoids greedy trap: sizes [1, 3, 4] with group 6 must NOT choose greedy 4 + 1 + 1 (3 bundles)", () => {
    const result = findMinBundles([1, 3, 4], 6);

    expect(result).not.toBeNull();
    // Greedy would pick 4x1 + 1x2 (3 bundles total).
    // Optimal DP must pick 3x2 (2 bundles total).
    const totalBundles = result!.reduce((acc, b) => acc + b.count, 0);
    expect(totalBundles).toBe(2);
    expect(result).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ size: 4 }),
        expect.objectContaining({ size: 1 }),
      ])
    );
  });

  it("(f) handles group size 1 with sizes [1], and group equal to a single bundle size", () => {
    const res1 = findMinBundles([1], 1);
    expect(res1).toEqual([{ size: 1, count: 1 }]);
    assertValidSum(res1, 1);

    const resSingle = findMinBundles([2, 5], 5);
    expect(resSingle).toEqual([{ size: 5, count: 1 }]);
    assertValidSum(resSingle, 5);
  });

  it("(g) efficiently solves large inputs: sizes [7, 13, 29, 100, 499] and group 10000", () => {
    const startTime = performance.now();
    const result = findMinBundles([7, 13, 29, 100, 499], 10000);
    const duration = performance.now() - startTime;

    expect(result).not.toBeNull();
    assertValidSum(result, 10000);
    // Algorithm must run well within interactive limits (typically < 30ms)
    expect(duration).toBeLessThan(100);
  });

  it("(h) generic helper confirms valid exact sum for various group configurations", () => {
    const testCases: [number[], number][] = [
      [[3, 5], 14], // 5x1 + 3x3 = 14
      [[5, 10, 25], 65], // 25x2 + 10x1 + 5x1 = 65
      [[2, 4, 8], 18], // 8x2 + 2x1 = 18
    ];

    for (const [sizes, group] of testCases) {
      const res = findMinBundles(sizes, group);
      assertValidSum(res, group);
    }
  });

  it("(i) does not mutate the input bundleSizes array", () => {
    const original = [20, 6, 9];
    const copy = [...original];

    findMinBundles(original, 44);

    expect(original).toEqual(copy);
  });
});
