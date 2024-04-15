import { expect } from "chai";
import { describe } from "mocha";

import { sinon } from "../../../../test/utils/test-utils";
import { Request, Response } from "express";
import { ChangePhoneNumberServiceInterface } from "../../change-phone-number/types";
import { getInitialState } from "../../../utils/state-machine";

import {
  resendPhoneCodeGet,
  resendPhoneCodePost,
} from "../resend-phone-code-controller";

describe("resend phone code controller", () => {
  let sandbox: sinon.SinonSandbox;
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    sandbox = sinon.createSandbox();

    req = {
      body: {},
      session: { user: {} } as any,
      cookies: { lng: "en" },
      i18n: { language: "en" },
    };
    res = {
      render: sandbox.fake(),
      redirect: sandbox.fake(() => {}),
      status: sandbox.fake(),
      locals: {},
    };
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe("resendPhoneCodeGet", () => {
    it("should render resend phone code view", () => {
      req = {
        session: {
          user: {
            newPhoneNumber: "07111111111",
          },
        },
        language: "en",
        originalUrl: "https://www.gov.uk",
        protocol: "https",
        hostname: "www.gov.uk",
      } as any;

      resendPhoneCodeGet(req as Request, res as Response);

      expect(res.render).to.have.calledWith("resend-phone-code/index.njk", {
        phoneNumberRedacted: "*******1111",
        phoneNumber: "07111111111",
        language: "en",
        currentUrl: "https://www.gov.uk",
        baseUrl: "https://www.gov.uk",
      });
    });
  });

  describe("resendPhoneCodePost", () => {
    it("should redirect to /check-your-phone when Get security code is clicked", async () => {
      const fakeService: ChangePhoneNumberServiceInterface = {
        sendPhoneVerificationNotification: sandbox.fake.resolves({
          success: true,
        }),
      };

      res.locals.sessionId = "123456-djjad";
      req.session.user.tokens = { accessToken: "token" } as any;
      req.body.phoneNumber = "+33645453322";
      req.session.user.email = "test@test.com";
      req.session.user.state = { changePhoneNumber: getInitialState() };

      await resendPhoneCodePost(fakeService)(req as Request, res as Response);

      expect(fakeService.sendPhoneVerificationNotification).to.have.been
        .calledOnce;
      expect(res.redirect).to.have.calledWith("/check-your-phone");
    });
  });
});
