import { describe, it, expect, beforeEach } from "vitest";
import { getRewatchOrder } from "../src/algorithms/getRewatchOrder";

describe("getRewatchOrder algorithm", () => {
  let prereqMap: Map<number, number[]>;

  /**
   * Helper that checks whether an ordering satisfies topological constraints:
   * For every movie in the returned list, all of its prerequisites must appear earlier.
   */
  function isValidTopologicalOrder(
    order: number[],
    graph: Map<number, number[]>
  ): boolean {
    const seen = new Set<number>();
    for (const movieId of order) {
      const prereqs = graph.get(movieId) ?? [];
      for (const prereqId of prereqs) {
        if (!seen.has(prereqId)) {
          return false;
        }
      }
      seen.add(movieId);
    }
    return true;
  }

  beforeEach(() => {
    // MCU sample graph:
    // 1: Iron Man []
    // 2: Captain America: The First Avenger []
    // 3: The Avengers [1, 2]
    // 4: Captain America: Civil War [3]
    // 5: Thor: Ragnarok []
    // 6: Avengers: Infinity War [4, 5]
    // 7: Avengers: Endgame [6]
    // 8: Avengers: Doomsday [7]
    prereqMap = new Map<number, number[]>([
      [1, []],
      [2, []],
      [3, [1, 2]],
      [4, [3]],
      [5, []],
      [6, [4, 5]],
      [7, [6]],
      [8, [7]],
    ]);
  });

  it("(a) returns exactly 7 ids (1..7 without duplicates) for target 8, excluding target 8", () => {
    const order = getRewatchOrder(8, prereqMap);

    expect(order).toHaveLength(7);
    expect(new Set(order).size).toBe(7);
    expect(order).not.toContain(8);

    const sorted = [...order].sort((a, b) => a - b);
    expect(sorted).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it("(b) returns exactly 1, 2, 3 for target 4, with 3 coming after both 1 and 2", () => {
    const order = getRewatchOrder(4, prereqMap);

    expect(order).toHaveLength(3);
    expect(new Set(order).size).toBe(3);

    const sorted = [...order].sort((a, b) => a - b);
    expect(sorted).toEqual([1, 2, 3]);

    const idx1 = order.indexOf(1);
    const idx2 = order.indexOf(2);
    const idx3 = order.indexOf(3);

    expect(idx3).toBeGreaterThan(idx1);
    expect(idx3).toBeGreaterThan(idx2);
  });

  it("(c) returns [] for target 5 (movie with no prerequisites)", () => {
    const order = getRewatchOrder(5, prereqMap);
    expect(order).toEqual([]);
  });

  it("(d) validates that for target 8, every movie has all of its prerequisites appear earlier", () => {
    const order = getRewatchOrder(8, prereqMap);
    expect(isValidTopologicalOrder(order, prereqMap)).toBe(true);
  });

  it("(e) handles diamond dependency without duplicate entries (movie 9 with prereqs [3, 4])", () => {
    prereqMap.set(9, [3, 4]);

    const order = getRewatchOrder(9, prereqMap);

    expect(order).toHaveLength(4);
    expect(new Set(order).size).toBe(order.length);

    const sorted = [...order].sort((a, b) => a - b);
    expect(sorted).toEqual([1, 2, 3, 4]);

    expect(isValidTopologicalOrder(order, prereqMap)).toBe(true);
  });

  it("(f) returns [] for a target missing from the map", () => {
    const order = getRewatchOrder(999, prereqMap);
    expect(order).toEqual([]);
  });
});
