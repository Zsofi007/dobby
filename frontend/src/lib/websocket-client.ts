import type { WsClientEvent, WsServerEvent } from "@dobby/shared";

export type WsEventHandler = (event: WsServerEvent) => void;

const MAX_RECONNECT_DELAY_MS = 30_000;
const BASE_RECONNECT_DELAY_MS = 1_000;

export class DobbyWebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private onEvent: WsEventHandler;
  private onConnectionChange?: (connected: boolean) => void;
  private reconnectAttempt = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private intentionalClose = false;

  constructor(
    url: string,
    onEvent: WsEventHandler,
    onConnectionChange?: (connected: boolean) => void
  ) {
    this.url = url;
    this.onEvent = onEvent;
    this.onConnectionChange = onConnectionChange;
  }

  connect(): void {
    this.intentionalClose = false;
    this.openSocket();
  }

  disconnect(): void {
    this.intentionalClose = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.ws?.close();
    this.ws = null;
    this.onConnectionChange?.(false);
  }

  private openSocket(): void {
    if (this.ws?.readyState === WebSocket.OPEN) return;

    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      this.reconnectAttempt = 0;
      this.onConnectionChange?.(true);
    };

    this.ws.onclose = () => {
      this.onConnectionChange?.(false);
      this.ws = null;
      if (!this.intentionalClose) {
        this.scheduleReconnect();
      }
    };

    this.ws.onerror = () => {
      this.onEvent({ type: "error", message: "WebSocket connection error" });
    };

    this.ws.onmessage = (msg) => {
      try {
        const event = JSON.parse(msg.data as string) as WsServerEvent;
        this.onEvent(event);
      } catch {
        this.onEvent({ type: "error", message: "Invalid server message" });
      }
    };
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;
    const delay = Math.min(
      BASE_RECONNECT_DELAY_MS * 2 ** this.reconnectAttempt,
      MAX_RECONNECT_DELAY_MS
    );
    this.reconnectAttempt += 1;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.openSocket();
    }, delay);
  }

  send(event: WsClientEvent): void {
    const payload = JSON.stringify(event);

    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(payload);
      return;
    }

    this.connect();
    const waitOpen = () => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(payload);
      } else if (!this.intentionalClose) {
        setTimeout(waitOpen, 50);
      }
    };
    waitOpen();
  }

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}
