export interface EnterPasswordServiceInterface {
  authenticated: (
    token: string,
    email: string,
    password: string,
    sourceIp: string,
    sessionId: string,
    persistentSessionId: string,
    clientSessionId: string
  ) => Promise<boolean>;
}
