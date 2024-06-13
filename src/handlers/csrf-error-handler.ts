import { NextFunction, Request, Response } from "express";
import { PATH_DATA } from "../app.constants.js";

export function csrfErrorHandler(
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (res.headersSent) {
    return next();
  }

  if (error.code === "EBADCSRFTOKEN") {
    req.log.error({
      msg: `Failed CSRF validation, redirecting to your services page.  Original error: ${error.message}`,
    });
    return res.redirect(PATH_DATA.YOUR_SERVICES.url);
  } else {
    return next(error);
  }
}
