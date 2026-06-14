export interface MutationLinkGroup {
  id: string;
  mutationIds: string[];
}

export const LINK_GROUP_COLORS = [
  "#6366f1",
  "#0ea5e9",
  "#d946ef",
  "#f59e0b",
  "#14b8a6",
  "#f43f5e",
] as const;

export function getLinkedMutationIds(
  groups: MutationLinkGroup[],
  mutationId: string,
): string[] {
  const group = groups.find((g) => g.mutationIds.includes(mutationId));
  return group?.mutationIds ?? [mutationId];
}

export function getLinkGroupForMutation(
  groups: MutationLinkGroup[],
  mutationId: string,
): MutationLinkGroup | null {
  return groups.find((g) => g.mutationIds.includes(mutationId)) ?? null;
}

export function getLinkGroupColor(
  groupId: string,
  groups: MutationLinkGroup[],
): string {
  const index = groups.findIndex((g) => g.id === groupId);
  return LINK_GROUP_COLORS[
    (index >= 0 ? index : 0) % LINK_GROUP_COLORS.length
  ];
}

export function createLinkGroup(
  groups: MutationLinkGroup[],
  mutationIds: string[],
): MutationLinkGroup[] {
  const uniqueIds = [...new Set(mutationIds)];
  if (uniqueIds.length < 2) return groups;

  const affectedGroups = groups.filter((g) =>
    g.mutationIds.some((id) => uniqueIds.includes(id)),
  );
  const unaffected = groups.filter(
    (g) => !g.mutationIds.some((id) => uniqueIds.includes(id)),
  );

  const mergedIds = new Set(uniqueIds);
  for (const group of affectedGroups) {
    for (const id of group.mutationIds) {
      mergedIds.add(id);
    }
  }

  return [
    ...unaffected,
    { id: crypto.randomUUID(), mutationIds: [...mergedIds] },
  ];
}

export function removeLinkGroup(
  groups: MutationLinkGroup[],
  groupId: string,
): MutationLinkGroup[] {
  return groups.filter((g) => g.id !== groupId);
}

export function removeMutationFromLinkGroups(
  groups: MutationLinkGroup[],
  mutationId: string,
): MutationLinkGroup[] {
  return groups
    .map((group) => ({
      ...group,
      mutationIds: group.mutationIds.filter((id) => id !== mutationId),
    }))
    .filter((group) => group.mutationIds.length >= 2);
}

function isMutationLinkGroup(value: unknown): value is MutationLinkGroup {
  if (!value || typeof value !== "object") return false;
  const group = value as MutationLinkGroup;
  return (
    typeof group.id === "string" &&
    Array.isArray(group.mutationIds) &&
    group.mutationIds.every((id) => typeof id === "string")
  );
}

export function sanitizeLinkGroups(
  groups: unknown,
  validMutationIds: Set<string>,
): MutationLinkGroup[] {
  if (!Array.isArray(groups)) return [];

  return groups
    .filter(isMutationLinkGroup)
    .map((group) => ({
      id: group.id,
      mutationIds: [
        ...new Set(
          group.mutationIds.filter((id) => validMutationIds.has(id)),
        ),
      ],
    }))
    .filter((group) => group.mutationIds.length >= 2);
}
