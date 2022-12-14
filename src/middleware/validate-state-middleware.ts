import { NextFunction, Request, Response } from "express";
import { PATH_DATA } from "../app.constants";

export function validateStateMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const pageState = Object.values(PATH_DATA).find((key) => key.url === req.url);

  if (
    !Object.prototype.hasOwnProperty.call(
      req.session.user.state,
      pageState.type
    )
  ) {
    req.log.warn(`state exists but no value for ${pageState.type}`);
    return res.redirect(PATH_DATA.SETTINGS.url);
  }

  if (
    req.session.user.state[pageState.type].events.length > 0 &&
    !req.session.user.state[pageState.type].events.includes(pageState.event)
  ) {
    delete req.session.user.state[pageState.type];
    return res.redirect(PATH_DATA.SETTINGS.url);
  }

  next();
}
