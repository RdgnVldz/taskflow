export type Role = "owner" | "admin" | "member";

const rank: Record<Role, number> = { member: 0, admin: 1, owner: 2 };

export function hasRole(role: Role, min: Role) {
  return rank[role] >= rank[min];
}

// Which roles can this person hand out in an invite?
export function invitableRoles(actor: Role): ("admin" | "member")[] {
  if (actor === "owner") return ["admin", "member"];
  if (actor === "admin") return ["member"];
  return [];
}

// Can `actor` remove somebody else who has the role `target`?
export function canRemoveMember(actor: Role, target: Role) {
  if (target === "owner") return false;
  if (actor === "owner") return true;
  if (actor === "admin") return target === "member";
  return false;
}