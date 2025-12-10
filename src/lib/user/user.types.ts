import { UserRole } from "../auth/auth.types";

interface IUser {
    userId: string;
    role: UserRole;
}

export { IUser };