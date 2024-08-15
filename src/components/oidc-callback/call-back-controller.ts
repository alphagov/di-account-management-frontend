import { Request, Response } from "express";
import { CallbackParamsType, TokenSet, UserinfoResponse } from "openid-client";
import {
  HTTP_STATUS_CODES,
  OIDC_ERRORS,
  PATH_DATA,
  VECTORS_OF_TRUST,
} from "../../app.constants";
import { ExpressRouteFunc } from "../../types";
import { ClientAssertionServiceInterface } from "../../utils/types";
import { clientAssertionGenerator } from "../../utils/oidc";

const COOKIES_PREFERENCES_SET = "cookies_preferences_set";

export const COOKIE_CONSENT = {
  ACCEPT: "accept",
  REJECT: "reject",
  NOT_ENGAGED: "not-engaged",
};

function setPreferencesCookie(
  cookieConsent: string,
  res: Response,
  gaId: string
) {
  let cookieValue: any = {};
  const cookieExpires = new Date();

  if ([COOKIE_CONSENT.ACCEPT, COOKIE_CONSENT.REJECT].includes(cookieConsent)) {
    cookieExpires.setFullYear(cookieExpires.getFullYear() + 1);

    cookieValue = {
      analytics: cookieConsent === COOKIE_CONSENT.ACCEPT,
    };

    if (cookieConsent === COOKIE_CONSENT.ACCEPT && gaId) {
      cookieValue.gaId = gaId;
    }
  } else {
    cookieExpires.setFullYear(cookieExpires.getFullYear() - 1);
  }

  res.cookie(COOKIES_PREFERENCES_SET, JSON.stringify(cookieValue), {
    expires: cookieExpires,
    secure: true,
    domain: res.locals.analyticsCookieDomain,
  });
}

export function oidcAuthCallbackGet(
  service: ClientAssertionServiceInterface = clientAssertionGenerator()
): ExpressRouteFunc {
  return async function (req: Request, res: Response) {
    const queryParams: CallbackParamsType = req.oidc.callbackParams(req);
    if (queryParams?.error === OIDC_ERRORS.ACCESS_DENIED) {
      res.status(HTTP_STATUS_CODES.FORBIDDEN);
    }
    const clientAssertion = await service.generateAssertionJwt(
      req.oidc.metadata.client_id,
      req.oidc.issuer.metadata.token_endpoint
    );
    let redirectUri;
    const crossDomainGaIdParam = req.query._ga as string;

    if (req.session.currentURL) {
      redirectUri = req.session.currentURL;
    } else {
      redirectUri = PATH_DATA.YOUR_SERVICES.url;
    }
    const tokenResponse: TokenSet = await req.oidc.callback(
      req.oidc.metadata.redirect_uris[0],
      queryParams,
      { nonce: req.session.nonce, state: req.session.state },
      {
        exchangeBody: {
          client_assertion_type:
            "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
          client_assertion: clientAssertion,
        },
      }
    );

    const vot = tokenResponse.claims().vot;

    if (vot !== VECTORS_OF_TRUST.MEDIUM) {
      return res.redirect(PATH_DATA.START.url);
    }

    const userInfoResponse = await req.oidc.userinfo<UserinfoResponse>(
      tokenResponse.access_token,
      { method: "GET", via: "header" }
    );

    req.session.user = {
      email: userInfoResponse.email,
      phoneNumber: userInfoResponse.phone_number,
      isPhoneNumberVerified: userInfoResponse.phone_number_verified as boolean,
      subjectId: userInfoResponse.sub,
      legacySubjectId: userInfoResponse.legacy_subject_id as string,
      publicSubjectId: userInfoResponse.public_subject_id as string,
      tokens: {
        idToken: tokenResponse.id_token,
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token,
      },
      isAuthenticated: true,
      state: {},
    };

    // saved to session where `user_id` attribute is stored as a db item's root-level attribute that is used in indexing
    req.session.user_id = userInfoResponse.sub;
    res.locals.isUserLoggedIn = true;

    if (req.query.cookie_consent) {
      setPreferencesCookie(
        req.query.cookie_consent as string,
        res,
        crossDomainGaIdParam
      );

      if (
        crossDomainGaIdParam &&
        req.query.cookie_consent === COOKIE_CONSENT.ACCEPT
      ) {
        const searchParams = new URLSearchParams({ _ga: crossDomainGaIdParam });
        redirectUri = redirectUri + "?" + searchParams.toString();
      }
    }

    return res.redirect(redirectUri);
  };
}
