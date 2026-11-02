export type Role = "owner" | "admin" | "member";

const rank: Record<Role, number> = {member: 0, admin: 1, owner: 2};

export function hasRole(role: Role, min: Role){
    return rank[role] >= rank[min];

}