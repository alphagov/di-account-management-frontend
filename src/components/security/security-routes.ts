import * as express from "express";
import { securityGet } from "./security-controller.js";
import { PATH_DATA } from "../../app.constants.js";
import { requiresAuthMiddleware } from "../../middleware/requires-auth-middleware.js";
import { selectMfaMiddleware } from "../../middleware/mfa-method-middleware.js";

const router = express.Router();

router.get(
  PATH_DATA.SECURITY.url,
  requiresAuthMiddleware,
  selectMfaMiddleware(),
  securityGet
);

export { router as securityRouter };
