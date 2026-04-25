import { ChatSession, Lead, Message } from "./types";

export const state = {
  sessions: [] as ChatSession[],
  messages: [] as Message[],
  leads: [] as Lead[],
};
