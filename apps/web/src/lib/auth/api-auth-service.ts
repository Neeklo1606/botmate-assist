import { ApiClientError } from "@botmate/shared";
import { apiClient } from "@/lib/api/client";
import { mapAuthUserToEntity } from "./map-user";
import type { User } from "@/types/entities";

/**
 * Ошибка, означающая «не можем сейчас определить, залогинен ли пользователь»
 * — сеть/сервер недоступны. Router (`beforeLoad`) НЕ должен по ней редиректить
 * на `/login`, иначе при перезапуске API возникает редирект-петля.
 */
export class AuthTransientError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message);
    this.name = "AuthTransientError";
  }
}

export function isAuthTransientError(err: unknown): err is AuthTransientError {
  return err instanceof AuthTransientError;
}

export async function apiGetCurrentUser(): Promise<User | null> {
  try {
    const { user } = await apiClient.me();
    return mapAuthUserToEntity(user);
  } catch (err) {
    // Только 401 / AUTH_* — действительно «не залогинен».
    if (err instanceof ApiClientError && (err.status === 401 || err.code.startsWith("AUTH_"))) {
      return null;
    }
    // Сетевые сбои / 5xx — это «временно не можем ответить». Выбрасываем
    // отдельный класс ошибки, чтобы router не выкидывал на /login.
    if (
      import.meta.env.DEV &&
      typeof window !== "undefined" &&
      /[?&]debug=auth/.test(window.location.search)
    ) {
      // eslint-disable-next-line no-console
      console.warn("[auth] /me transient", err);
    }
    throw new AuthTransientError("auth/me transient failure", err);
  }
}

export async function apiLoginWithEmail(payload: {
  email: string;
  password: string;
}): Promise<User> {
  const { user } = await apiClient.login({
    email: payload.email,
    password: payload.password,
  });
  return mapAuthUserToEntity(user);
}

export async function apiSignupWithEmail(payload: {
  name: string;
  email: string;
  password: string;
}): Promise<User> {
  const { user } = await apiClient.register({
    email: payload.email,
    password: payload.password,
    fullName: payload.name,
  });
  return mapAuthUserToEntity(user);
}

export async function apiLogout(): Promise<void> {
  try {
    await apiClient.logout();
  } catch (err) {
    if (err instanceof ApiClientError && err.status === 401) {
      return;
    }
    throw err;
  }
}

/** Brief onboarding with real API when contact is email. */
export async function apiBriefLogin(input: {
  name: string;
  contact: string;
}): Promise<{ user: User; isNew: boolean }> {
  const contact = input.contact.trim();
  const isEmail = /.+@.+\..+/.test(contact);
  if (!isEmail) {
    throw new Error("BRIEF_TELEGRAM_UNSUPPORTED");
  }

  const password = crypto.randomUUID() + crypto.randomUUID();
  try {
    const { user } = await apiClient.register({
      email: contact,
      password,
      fullName: input.name || "User",
    });
    return { user: mapAuthUserToEntity(user), isNew: true };
  } catch (err) {
    if (err instanceof ApiClientError && err.code === "AUTH_003") {
      const { user } = await apiClient.login({ email: contact, password });
      void user;
      throw new Error("BRIEF_EXISTING_EMAIL");
    }
    throw err;
  }
}
