import express from "express";
import cookieParser from "cookie-parser";
import csurf from "csurf";
import { loggerMiddleware } from "./utils/logger";
import { sanitizeRequestMiddleware } from "./middleware/sanitize-request-middleware";
import i18nextMiddleware from "i18next-http-middleware";
import * as path from "path";
import bodyParser from "body-parser";
import { configureNunjucks } from "./config/nunchucks";
import { i18nextConfigurationOptions } from "./config/i18next";
import { helmetConfiguration } from "./config/helmet";
import helmet from "helmet";
import session from "express-session";
import { setHtmlLangMiddleware } from "./middleware/html-lang-middleware";
import i18next from "i18next";
import Backend from "i18next-fs-backend";
import { getNodeEnv, getSessionExpiry, getSessionSecret } from "./config";
import { logErrorMiddleware } from "./middleware/log-error-middleware";

import { pageNotFoundHandler } from "./handlers/page-not-found-handler";
import { serverErrorHandler } from "./handlers/internal-server-error-handler";
import { csrfMiddleware } from "./middleware/csrf-middleware";
import { manageYourAccountRouter } from "./components/manage-your-account/manage-your-account-routes";
import { getCSRFCookieOptions } from "./config/cookie";
import { ENVIRONMENT_NAME } from "./app.constants";
import { startRouter } from "./components/start/start-routes";
import { oidcAuthCallbackRouter } from "./components/oidc-callback/call-back-routes";
import { authMiddleware } from "./middleware/auth-middleware";
import { logoutRouter } from "./components/logout/logout-routes";
import { getSessionCookieOptions, getSessionStore } from "./config/session";
import { getOIDCConfig } from "./config/oidc";
import { enterPasswordRouter } from "./components/enter-password/enter-password-routes";
import { changeEmailRouter } from "./components/change-email/change-email-routes";
import { updateConfirmationRouter } from "./components/update-confirmation/update-confirmation-routes";
import { changePasswordRouter } from "./components/change-password/change-password-routes";
import { checkYourEmailRouter } from "./components/check-your-email/check-your-email-routes";
import { changePhoneNumberRouter } from "./components/change-phone-number/change-phone-number-routes";
import { deleteAccountRouter } from "./components/delete-account/delete-account-routes";
import { checkYourPhoneRouter } from "./components/check-your-phone/check-your-phone-routes";
import { noCacheMiddleware } from "./middleware/no-cache-middleware";
import { sessionExpiredRouter } from "./components/session-expired/session-expired-routes";

const APP_VIEWS = [
  path.join(__dirname, "components"),
  path.resolve("node_modules/govuk-frontend/"),
];

function registerRoutes(app: express.Application) {
  app.use(manageYourAccountRouter);
  app.use(oidcAuthCallbackRouter);
  app.use(startRouter);
  app.use(logoutRouter);
  app.use(enterPasswordRouter);
  app.use(changeEmailRouter);
  app.use(updateConfirmationRouter);
  app.use(changePasswordRouter);
  app.use(checkYourEmailRouter);
  app.use(changePhoneNumberRouter);
  app.use(deleteAccountRouter);
  app.use(checkYourPhoneRouter);
  app.use(sessionExpiredRouter);
}

function createApp(): express.Application {
  const app: express.Application = express();
  const isProduction = getNodeEnv() === ENVIRONMENT_NAME.PROD;

  app.enable("trust proxy");

  app.use(loggerMiddleware);

  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: false }));

  app.use(
    "/assets",
    express.static(path.resolve("node_modules/govuk-frontend/govuk/assets"))
  );

  app.use("/public", express.static(path.join(__dirname, "public")));
  app.set("view engine", configureNunjucks(app, APP_VIEWS));

  app.use(noCacheMiddleware);

  i18next
    .use(Backend)
    .use(i18nextMiddleware.LanguageDetector)
    .init(
      i18nextConfigurationOptions(
        path.join(__dirname, "locales/{{lng}}/{{ns}}.json")
      )
    );

  app.use(i18nextMiddleware.handle(i18next));
  app.use(helmet(helmetConfiguration));

  app.use(
    session({
      name: "am",
      store: getSessionStore(),
      saveUninitialized: false,
      secret: getSessionSecret(),
      resave: false,
      cookie: getSessionCookieOptions(isProduction, getSessionExpiry()),
    })
  );

  app.use(authMiddleware(getOIDCConfig()));

  app.use(cookieParser());
  app.use(csurf({ cookie: getCSRFCookieOptions(isProduction) }));

  app.post("*", sanitizeRequestMiddleware);
  app.use(csrfMiddleware);
  app.use(setHtmlLangMiddleware);

  registerRoutes(app);

  app.use(logErrorMiddleware);
  app.use(serverErrorHandler);
  app.use(pageNotFoundHandler);

  return app;
}

export { createApp };
