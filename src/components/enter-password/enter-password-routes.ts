import * as express from "express";
import { PATH_DATA } from "../../app.constants";
import {
  enterPasswordPost,
  enterPasswordGet,
} from "./enter-password-controller";
import { validateEnterPasswordRequest } from "./enter-password-validation";
import { requiresAuthMiddleware } from "../../middleware/requires-auth-middleware";
import { refreshTokenMiddleware } from "../../middleware/refresh-token-middleware";
import {
  globalTryCatch,
  globalTryCatchAsync,
} from "../../utils/global-try-catch";
import { asyncHandler } from "../../utils/async";

const router = express.Router();

router.get(
  PATH_DATA.ENTER_PASSWORD.url,
  requiresAuthMiddleware,
  globalTryCatch(enterPasswordGet)
);

router.post(
  PATH_DATA.ENTER_PASSWORD.url,
  requiresAuthMiddleware,
  validateEnterPasswordRequest(),
  refreshTokenMiddleware(),
  globalTryCatchAsync(asyncHandler(enterPasswordPost()))
);

export { router as enterPasswordRouter };
