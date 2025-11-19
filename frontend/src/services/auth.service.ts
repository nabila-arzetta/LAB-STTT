import { api } from "@/lib/api";

export type Role = "admin" | "user" | (string & {});
export interface UserDTO {
  id: number;
  name: string;
  email: string;
  role: string;
  kode_bagian?: string;
  lab_id?: number | null;
}

type LoginShapeA = { token: string; user: UserDTO };
type LoginShapeB = { access_token: string; user: UserDTO };
type LoginShapeC = { data: { token?: string; access_token?: string; user?: UserDTO }; message?: string };
type LoginShapeD = { token?: string; access_token?: string; user?: UserDTO; message?: string };
type LoginResponseLike = LoginShapeA | LoginShapeB | LoginShapeC | LoginShapeD;

export interface LoginResponse {
  token: string;
  user: UserDTO;
}

function isUserDTO(value: unknown): value is UserDTO {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === "number" &&
    typeof v.name === "string" &&
    typeof v.email === "string" &&
    typeof v.role === "string"
  );
}

function normalizeLoginResponse(raw: unknown): LoginResponse {
  const root = (raw as { data?: unknown })?.data ?? raw;

  const tokenDirect =
    (root as { token?: unknown })?.token ??
    (root as { access_token?: unknown })?.access_token;

  const userDirect = (root as { user?: unknown })?.user;

  const dataObj = (root as { data?: unknown })?.data as
    | { token?: unknown; access_token?: unknown; user?: unknown }
    | undefined;

  const token =
    (typeof tokenDirect === "string" && tokenDirect) ||
    (dataObj && typeof dataObj.token === "string" && dataObj.token) ||
    (dataObj && typeof dataObj.access_token === "string" && dataObj.access_token) ||
    "";

  const user =
    (isUserDTO(userDirect) && userDirect) ||
    (dataObj && isUserDTO(dataObj.user) && dataObj.user) ||
    null;

  if (!token || !user) {
    const messageTop = (root as { message?: unknown })?.message;
    const messageData = (dataObj as { message?: unknown } | undefined)?.message;
    const msg =
      (typeof messageTop === "string" && messageTop) ||
      (typeof messageData === "string" && messageData) ||
      "Bad login response";
    throw new Error(msg);
  }

  return { token, user };
}

export async function loginApi(email: string, password: string) {
  const { data } = await api.post("/login", { email, password });
  console.log("[loginApi] response:", data);
  // … normalizer kamu di sini …
  return normalizeLoginResponse(data);
}

export async function fetchMe(): Promise<UserDTO> {
  const { data } = await api.get<unknown>("/me");
  if (isUserDTO(data)) return data;
  const user1 = (data as { user?: unknown })?.user;
  if (isUserDTO(user1)) return user1;
  const user2 = (data as { data?: unknown })?.data;
  if (isUserDTO(user2)) return user2 as UserDTO;
  throw new Error("Bad /me response");
}

export async function logoutApi(): Promise<void> {
  try { await api.post("/logout"); } catch { /* ignore errors */ }
}
