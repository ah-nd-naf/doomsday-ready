/**
 * Topological sort for MCU rewatch order.
 *
 * @param targetId - The ID of the target movie to plan a rewatch for
 * @param prereqMap - Map of movieId -> array of its prerequisite movie IDs
 * @returns Array of movie IDs in valid rewatch order (post-order DFS, target excluded)
 */
export function getRewatchOrder(
  targetId: number,
  prereqMap: Map<number, number[]>
): number[] {
  // TODO(author): Implement rewatch order topological sort logic.
  throw new Error("Not implemented: author writes this");
}
