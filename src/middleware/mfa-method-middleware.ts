import { NextFunction, Request, RequestHandler, Response } from "express";
import { ERROR_MESSAGES } from "../app.constants";
import retrieveMfaMethods from "../utils/mfa";
import { getMfaServiceUrl, supportMfaPage } from "../config";
import { logger } from "../utils/logger";
import { legacyMfaMethodsMiddleware } from "./mfa-methods-legacy";

const mfaServiceUrl = new URL(getMfaServiceUrl());

export async function mfaMethodMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { email } = req.session.user;
    const { accessToken } = req.session.user.tokens;
    const response = await retrieveMfaMethods(
      accessToken,
      email,
      req.ip,
      res.locals.sessionId,
      res.locals.persistentSessionId
    );
    req.session.mfaMethods = [...response];
    next();
  } catch (e) {
    req.log.info(
      { trace: res.locals.trace },
      ERROR_MESSAGES.FAILED_MFA_RETRIEVE_CALL
    );
    next();
  }
}

const selectMfaMiddleware = (): RequestHandler => {
  try {
    if (supportMfaPage() && mfaServiceUrl) {
      return mfaMethodMiddleware;
    }
  } catch (e) {
    logger.error(`selectMfaMiddleware ${e.message}`);
  }
  return legacyMfaMethodsMiddleware;
};

export { selectMfaMiddleware };
