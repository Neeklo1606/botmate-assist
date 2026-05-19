import { isRealAuthEnabled } from "./config";
import {
  apiBriefLogin,
  apiGetCurrentUser,
  apiLoginWithEmail,
  apiLogout,
  apiSignupWithEmail,
} from "./api-auth-service";
import {
  mockBriefLogin,
  mockGetCurrentUser,
  mockLoginWithEmail,
  mockLoginWithTelegram,
  mockLogout,
  mockSignupWithEmail,
} from "./mock-auth-service";
import type { BriefLoginInput, BriefLoginResult } from "./mock-auth-service";
import type { User } from "@/types/entities";

export type { BriefLoginInput, BriefLoginResult };

export async function fetchCurrentUser(): Promise<User | null> {
  if (isRealAuthEnabled()) {
    return apiGetCurrentUser();
  }
  return mockGetCurrentUser();
}

export async function loginWithEmail(payload: {
  email: string;
  password: string;
}): Promise<User> {
  if (isRealAuthEnabled()) {
    return apiLoginWithEmail(payload);
  }
  return mockLoginWithEmail(payload);
}

export async function signupWithEmail(payload: {
  name: string;
  email: string;
  password: string;
}): Promise<User> {
  if (isRealAuthEnabled()) {
    return apiSignupWithEmail(payload);
  }
  return mockSignupWithEmail(payload);
}

export async function loginWithTelegram(): Promise<User> {
  if (isRealAuthEnabled()) {
    throw new Error("TELEGRAM_AUTH_NOT_IMPLEMENTED");
  }
  return mockLoginWithTelegram();
}

export async function logout(): Promise<void> {
  if (isRealAuthEnabled()) {
    return apiLogout();
  }
  return mockLogout();
}

export async function completeBriefOnboarding(
  input: BriefLoginInput,
): Promise<BriefLoginResult> {
  if (isRealAuthEnabled()) {
    const contact = input.contact.trim();
    const isEmail = /.+@.+\..+/.test(contact);
    if (isEmail) {
      return apiBriefLogin(input);
    }
    // Telegram brief: temporary mock path until OAuth (Phase 2).
    return mockBriefLogin(input);
  }
  return mockBriefLogin(input);
}
