import type { RealtimeGateway } from "./gateway-types.js";

let gateway: RealtimeGateway | null = null;

export function setRealtimeGateway(instance: RealtimeGateway): void {
  gateway = instance;
}

export function getRealtimeGateway(): RealtimeGateway {
  if (!gateway) {
    throw new Error("Realtime gateway not initialized — call setRealtimeGateway() during API bootstrap");
  }
  return gateway;
}

export function tryGetRealtimeGateway(): RealtimeGateway | null {
  return gateway;
}
