import { EVENT_NAME } from "../app.constants";
import { Request, Response } from "express";

export type EventNameType = typeof EVENT_NAME[keyof typeof EVENT_NAME];
export interface EventServiceInterface {
  buildAuditEvent: (
    req: Request,
    res: Response,
    eventName: EventNameType
  ) => AuditEvent;
  send: (event: Event) => void;
}

export interface Event {
  event_name: string;
}

export interface AuditEvent extends Event {
  timestamp: number;
  component_id: string;
  user: User;
  platform: Platform;
  extensions: Extensions;
}
export interface User {
  session_id: string;
  persistent_session_id: string;
}

export interface Platform {
  user_agent: string;
}

export interface Extensions {
  from_url: string;
  app_session_id: string;
  app_error_code: string;
  reference_code: string;
}