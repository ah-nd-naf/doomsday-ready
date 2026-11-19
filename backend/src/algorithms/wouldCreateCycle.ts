/**
 * Cycle detection for movie prerequisites.
 *
 * @param movieId - The ID of the movie being updated
 * @param newPrereqIds - The array of candidate prerequisite movie IDs
 * @param prereqMap - Map of movieId -> array of its prerequisite movie IDs
 * @returns true if adding the prerequisites creates a cycle, false otherwise
 */
export function wouldCreateCycle(
  movieId: number,
  newPrereqIds: number[],
  prereqMap: Map<number, number[]>
): boolean {
  if (newPrereqIds.includes(movieId)) {
    return true;
  }

  const visited = new Set<number>();
  const stack: number[] = [...newPrereqIds];

  while (stack.length > 0) {
    const current = stack.pop()!;

    if (current === movieId) {
      return true;
    }

    if (visited.has(current)) {
      continue;
    }

    visited.add(current);

    const prereqs = prereqMap.get(current) ?? [];
    for (const prereqId of prereqs) {
      stack.push(prereqId);
    }
  }

  return false;
}