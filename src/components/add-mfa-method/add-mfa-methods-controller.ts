import { Request, Response, NextFunction } from "express";
import { PATH_DATA, MFA_METHODS } from "../../app.constants";
import { mfaMethodMiddleware } from "src/middleware/mfa-method-middleware";

export function addMfaMethodGet(req: Request, res: Response): void {
  const helpText = `<p>${req.t("pages.addMfaMethod.app.help.text1")}</p><p>${req.t("pages.addMfaMethod.app.help.text2")}</p>`;
  res.render(`add-mfa-method/index.njk`, { helpText });
}

type MfaMethods = keyof typeof MFA_METHODS;

export function addMfaMethodPost(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const { addMfaMethod } = req.body;

  const method = Object.keys(MFA_METHODS).find((key: MfaMethods) => {
    return MFA_METHODS[key].type === addMfaMethod;
  });

  if (!method) {
    req.log.error(`unknown addMfaMethod: ${addMfaMethod}`);
    return next(new Error(`Unknown addMfaMethod: ${addMfaMethod}`));
  }

  res.redirect(MFA_METHODS[method as MfaMethods].path.url);
  res.end();
}
