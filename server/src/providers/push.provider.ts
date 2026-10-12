export interface PushProvider {
  send(input: { token: string; title: string; body: string; data?: Record<string, string> }): Promise<{ messageId: string }>;
}
