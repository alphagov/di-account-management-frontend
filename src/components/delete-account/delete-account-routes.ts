import { PATH_DATA } from "../../app.constants.js";

import * as express from "express";
import {
  deleteAccountGet,
  deleteAccountPost,
} from "./delete-account-controller.js";
import { asyncHandler } from "../../utils/async.js";
import { validateStateMiddleware } from "../../middleware/validate-state-middleware.js";
import { requiresAuthMiddleware } from "../../middleware/requires-auth-middleware.js";
import { refreshTokenMiddleware } from "../../middleware/refresh-token-middleware.js";

const router = express.Router();

router.get(
  PATH_DATA.DELETE_ACCOUNT.url,
  requiresAuthMiddleware,
  validateStateMiddleware,
  deleteAccountGet
);

router.post(
  PATH_DATA.DELETE_ACCOUNT.url,
  requiresAuthMiddleware,
  refreshTokenMiddleware(),
  asyncHandler(deleteAccountPost())
);

export { router as deleteAccountRouter };
