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
  const visited = new Set<number>();
  const result: number[] = [];

  function visit(id: number): void {
    if (visited.has(id)) {
      return;
    }

    visited.add(id);

    const prereqs = prereqMap.get(id) ?? [];
    for (const prereqId of prereqs) {
      visit(prereqId);
    }

    result.push(id);
  }

  const targetPrereqs = prereqMap.get(targetId) ?? [];
  for (const prereqId of targetPrereqs) {
    visit(prereqId);
  }

  return result;
}