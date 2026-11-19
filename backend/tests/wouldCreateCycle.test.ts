import { describe, it, expect, beforeEach } from "vitest";
import { wouldCreateCycle } from "../src/algorithms/wouldCreateCycle";

describe("wouldCreateCycle algorithm", () => {
  let prereqMap: Map<number, number[]>;

  beforeEach(() => {
    // Graph based on MCU sample data:
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

  it("(a) returns true when making Endgame (7) a prerequisite of Iron Man (1)", () => {
    expect(wouldCreateCycle(1, [7], prereqMap)).toBe(true);
  });

  it("(b) returns true when a movie depends directly on itself (movie 3 with [3])", () => {
    expect(wouldCreateCycle(3, [3], prereqMap)).toBe(true);
  });

  it("(c) returns false when movie 5 adds prerequisites [1, 2]", () => {
    expect(wouldCreateCycle(5, [1, 2], prereqMap)).toBe(false);
  });

  it("(d) returns false when movie 8 adds prerequisite [1]", () => {
    expect(wouldCreateCycle(8, [1], prereqMap)).toBe(false);
  });

  it("(e) returns false when movie 1 sets empty prerequisites []", () => {
    expect(wouldCreateCycle(1, [], prereqMap)).toBe(false);
  });

  it("(f) returns false for a diamond shape where two paths reach the same movie (movie 9 with [3, 4])", () => {
    expect(wouldCreateCycle(9, [3, 4], prereqMap)).toBe(false);
  });

  it("(g) returns true for movie 3 with prerequisite [8] (indirect cycle through long chain)", () => {
    expect(wouldCreateCycle(3, [8], prereqMap)).toBe(true);
  });

  it("(h) does not crash when prereqMap is missing some movie IDs", () => {
    const incompleteMap = new Map<number, number[]>([
      [1, [99]], // 99 is not a key in the map
      [2, [100, 101]],
    ]);

    expect(() => wouldCreateCycle(1, [99], incompleteMap)).not.toThrow();
    expect(wouldCreateCycle(1, [99], incompleteMap)).toBe(false);

    expect(() => wouldCreateCycle(50, [1], incompleteMap)).not.toThrow();
    expect(wouldCreateCycle(50, [1], incompleteMap)).toBe(false);
  });
});
