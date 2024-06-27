import { Request, Response } from "express";
import {
  supportActivityLog,
  supportChangeMfa,
  supportAddBackupMfa,
} from "../../config";
import { PATH_DATA } from "../../app.constants";
import { hasAllowedRSAServices } from "../../middleware/check-allowed-services-list";
import { getLastNDigits } from "../../utils/phone-number";

export async function securityGet(req: Request, res: Response): Promise<void> {
  const { email } = req.session.user;

  const supportActivityLogFlag = supportActivityLog();

  const hasHmrc = await hasAllowedRSAServices(req, res);

  const activityLogUrl = PATH_DATA.SIGN_IN_HISTORY.url;

  let mfaMethods = [];

  if (supportChangeMfa()) {
    mfaMethods = Array.isArray(req.session.mfaMethods)
      ? req.session.mfaMethods.map((mfaMethod) => {
          let text: string, linkText: string, linkHref: string;

          if (mfaMethod.method.mfaMethodType === "SMS") {
            const phoneNumber = getLastNDigits(mfaMethod.method.endPoint, 4);
            text = req
              .t(
                "pages.security.mfaSection.supportChangeMfa.defaultMethod.phoneNumber.title"
              )
              .replace("[phoneNumber]", phoneNumber);
            linkText = req.t(
              "pages.security.mfaSection.supportChangeMfa.defaultMethod.phoneNumber.change"
            );
            linkHref = `${PATH_DATA.ENTER_PASSWORD.url}?type=changePhoneNumber`;
          } else if (mfaMethod.method.mfaMethodType === "AUTH_APP") {
            text = req.t(
              "pages.security.mfaSection.supportChangeMfa.defaultMethod.app.title"
            );
            linkText = req.t(
              "pages.security.mfaSection.supportChangeMfa.defaultMethod.app.change"
            );
            linkHref = `${PATH_DATA.ENTER_PASSWORD.url}?type=changeAuthenticatorApp`;
          } else {
            throw new Error(
              `Unexpected mfaMethodType: ${mfaMethod.method.mfaMethodType}`
            );
          }

          return {
            text,
            linkHref,
            linkText,
            priorityIdentifier: mfaMethod.priorityIdentifier,
          };
        })
      : [];
  } else {
    mfaMethods = Array.isArray(req.session.mfaMethods)
      ? req.session.mfaMethods.map((method) => {
          let key: string,
            value: string,
            actions = {};

          if (method.method.mfaMethodType === "SMS") {
            const phoneNumber = getLastNDigits(method.method.endPoint, 4);
            key = req.t(
              "pages.security.mfaSection.summaryList.phoneNumber.title"
            );
            value = req
              .t("pages.security.mfaSection.summaryList.phoneNumber.value")
              .replace("[phoneNumber]", phoneNumber);
            actions = {
              items: [
                {
                  attributes: { "data-test-id": "change-phone-number" },
                  href: `${PATH_DATA.ENTER_PASSWORD.url}?type=changePhoneNumber`,
                  text: req.t("general.change"),
                  visuallyHiddenText: req.t(
                    "pages.security.mfaSection.summaryList.app.hiddenText"
                  ),
                },
              ],
            };
          } else if (method.method.mfaMethodType === "AUTH_APP") {
            key = req.t("pages.security.mfaSection.summaryList.app.title");
            value = req.t("pages.security.mfaSection.summaryList.app.value");

            actions = {
              items: [
                {
                  attributes: { "data-test-id": "change-authenticator-app" },
                  href: `${PATH_DATA.ENTER_PASSWORD.url}?type=changeAuthenticatorApp`,
                  text: req.t("general.change"),
                  visuallyHiddenText: req.t(
                    "pages.security.mfaSection.summaryList.app.hiddenText"
                  ),
                },
              ],
            };
          } else {
            throw new Error(
              `Unexpected mfaMethodType: ${method.method.mfaMethodType}`
            );
          }

          return {
            classes: "govuk-summary-list__row--no-border",
            key: {
              text: key,
            },
            value: {
              text: value,
            },
            actions: actions,
          };
        })
      : [];
  }

  // if primary method is SMS and secondary is app, the primary method cannot be changed to app
  const denyChangeTypeofPrimary = Array.isArray(req.session.mfaMethods)
    ? supportChangeMfa() &&
      req.session.mfaMethods.length > 1 &&
      req.session.mfaMethods.find(
        (m) =>
          m.method.mfaMethodType === "SMS" && m.priorityIdentifier === "DEFAULT"
      ) &&
      req.session.mfaMethods.find(
        (m) =>
          m.method.mfaMethodType === "AUTH_APP" &&
          m.priorityIdentifier === "BACKUP"
      )
    : false;

  const data = {
    email,
    supportActivityLog: supportActivityLogFlag && hasHmrc,
    activityLogUrl,
    mfaMethods,
    supportChangeMfa: supportChangeMfa(),
    supportAddBackupMfa: supportAddBackupMfa(),
    canChangeTypeofPrimary: !denyChangeTypeofPrimary,
  };

  res.render("security/index.njk", data);
}
