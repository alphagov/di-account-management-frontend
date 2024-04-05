import { Request, Response } from "express";
import { getInitialState } from "../../src/utils/state-machine";
import { Session, SessionData } from "express-session";

export const CURRENT_EMAIL: string = "current-email@dl.com";
export const NEW_EMAIL: string = "new-email@test.com";
export const TOKEN: string = "token";
export const SOURCE_IP: string = "sourceip";
export const ENGLISH: string = "en";

export const SESSION_ID = "sessionid";
export const PERSISTENT_SESSION_ID = "persistentsessionid";
export const CLIENT_SESSION_ID = "clientsessionid";

export class RequestBuilder {
  private body: object | null = null;
  private session: Session & Partial<SessionData> = {
    user: {
      tokens: {
        accessToken: TOKEN,
        idToken: "",
        refreshToken: "",
      },
      email: CURRENT_EMAIL,
      state: { changeEmail: getInitialState() },
      isAuthenticated: false,
    },
  } as any;
  private cookies: object = { lng: ENGLISH };
  private ip: string = SOURCE_IP;
  private i18n: object = { language: ENGLISH };
  private t: () => void;

  withBody(body: object): RequestBuilder {
    this.body = body;
    return this;
  }

  withSession(session: Session & Partial<SessionData>): RequestBuilder {
    this.session = session;
    return this;
  }

  withSessionUserState(state: object): RequestBuilder {
    this.session.user.state = state;
    return this;
  }

  withCookies(cookies: object): RequestBuilder {
    this.cookies = cookies;
    return this;
  }

  withI18n(i18n: object): RequestBuilder {
    this.i18n = i18n;
    return this;
  }

  withTimestampT(func: () => void): RequestBuilder {
    this.t = func;
    return this;
  }

  withIp(ip: string): RequestBuilder {
    this.ip = ip;
    return this;
  }

  build(): Partial<Request> {
    return {
      body: this.body,
      session: this.session,
      cookies: this.cookies,
      i18n: this.i18n,
      t: this.t as any,
      ip: this.ip,
    };
  }
}

export class ResponseBuilder {
  private render: () => void;
  private redirect: () => void;
  private locals: object = {
    clientSessionId: CLIENT_SESSION_ID,
    persistentSessionId: PERSISTENT_SESSION_ID,
    sessionId: SESSION_ID,
  };
  private status: () => number = () => {
    return 200;
  };

  withStatus(func: () => number): ResponseBuilder {
    this.status = func;
    return this;
  }
  withRender(func: () => void): ResponseBuilder {
    this.render = func;
    return this;
  }

  withRedirect(func: () => void): ResponseBuilder {
    this.redirect = func;
    return this;
  }

  withLocals(locals: object): ResponseBuilder {
    this.locals = locals;
    return this;
  }

  build(): Partial<Response> {
    return {
      render: this.render,
      redirect: this.redirect,
      locals: this.locals,
      status: this.status as any,
    };
  }
}
