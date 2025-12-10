export type TokenType = "access" | "refresh";
export type UserRole = "user" | "admin";

export interface TokenPayload {
  userId: string;       // UUID as string
  tokenKey: string;
  type: TokenType;
  role: UserRole;
  iat: number;
  exp: number;
}