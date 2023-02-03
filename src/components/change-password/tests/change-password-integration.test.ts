import request from "supertest";
import { describe } from "mocha";
import { expect, sinon } from "../../../../test/utils/test-utils";
import nock = require("nock");
import { load } from "cheerio";
import decache from "decache";
import { API_ENDPOINTS, PATH_DATA } from "../../../app.constants";
import { UnsecuredJWT } from "jose";

describe("Integration:: change password", () => {
  let sandbox: sinon.SinonSandbox;
  let token: string | string[];
  let cookies: string;
  let app: any;
  let baseApi: string;

  before(async () => {
    decache("../../../app");
    decache("../../../middleware/requires-auth-middleware");
    const sessionMiddleware = require("../../../middleware/requires-auth-middleware");
    sandbox = sinon.createSandbox();
    sandbox
      .stub(sessionMiddleware, "requiresAuthMiddleware")
      .callsFake(function (req: any, res: any, next: any): void {
        req.session.user = {
          email: "test@test.com",
          phoneNumber: "07839490040",
          isAuthenticated: true,
          state: {
            changePassword: {
              value: "CHANGE_VALUE",
              events: ["VALUE_UPDATED", "VERIFY_CODE_SENT"],
            },
          },
          tokens: {
            accessToken: new UnsecuredJWT({})
              .setIssuedAt()
              .setSubject("12345")
              .setIssuer("urn:example:issuer")
              .setAudience("urn:example:audience")
              .setExpirationTime("2h")
              .encode(),
            idToken: "Idtoken",
            refreshToken: "token",
          },
        };
        next();
      });

    const oidc = require("../../../utils/oidc");
    sandbox.stub(oidc, "getOIDCClient").callsFake(() => {
      return new Promise((resolve) => {
        resolve({});
      });
    });

    sandbox.stub(oidc, "getJWKS").callsFake(() => {
      return new Promise((resolve) => {
        resolve({});
      });
    });

    app = await require("../../../app").createApp();
      baseApi = "https://oidc.build.account.gov.uk";

    request(app)
      .get(PATH_DATA.CHANGE_PASSWORD.url)
      .end((err, res) => {
        const $ = load(res.text);
        token = $("[name=_csrf]").val();
        cookies = res.headers["set-cookie"];
      });
  });

  beforeEach(() => {
    nock.cleanAll();
  });

  after(() => {
    sandbox.restore();
    app = undefined;
  });

  it("should return change password page", (done) => {
    request(app).get(PATH_DATA.CHANGE_PASSWORD.url).expect(200, done);
  });

  it("should return error when csrf not present", (done) => {
    request(app)
      .post(PATH_DATA.CHANGE_PASSWORD.url)
      .type("form")
      .send({
        password: "test@test.com",
      })
      .expect(500, done);
  });

  it("should return validation error when password not entered", (done) => {
    request(app)
      .post(PATH_DATA.CHANGE_PASSWORD.url)
      .type("form")
      .set("Cookie", cookies)
      .send({
        _csrf: token,
        password: "",
        "confirm-password": "",
      })
      .expect(function (res) {
        const $ = load(res.text);
        expect($("#password-error").text()).to.contains(
          "Enter your new password"
        );
        expect($("#confirm-password-error").text()).to.contains(
          "Re-type your new password"
        );
      })
      .expect(400, done);
  });

  it("should return validation error when passwords don't match", (done) => {
    request(app)
      .post(PATH_DATA.CHANGE_PASSWORD.url)
      .type("form")
      .set("Cookie", cookies)
      .send({
        _csrf: token,
        password: "sadsadasd33da",
        "confirm-password": "sdnnsad99d",
      })
      .expect(function (res) {
        const $ = load(res.text);
        expect($("#confirm-password-error").text()).to.contains(
          "Enter the same password in both fields"
        );
      })
      .expect(400, done);
  });

  it("should return validation error when password less than 8 characters", (done) => {
    request(app)
      .post(PATH_DATA.CHANGE_PASSWORD.url)
      .type("form")
      .set("Cookie", cookies)
      .send({
        _csrf: token,
        password: "address",
        "confirm-password": "address",
      })
      .expect(function (res) {
        const $ = load(res.text);
        expect($("#password-error").text()).to.contains(
          "Your password must be at least 8 characters long and must include letters and numbers"
        );
      })
      .expect(400, done);
  });

  it("should return validation error when password is all numeric", (done) => {
    request(app)
      .post(PATH_DATA.CHANGE_PASSWORD.url)
      .type("form")
      .set("Cookie", cookies)
      .send({
        _csrf: token,
        password: "123456789",
        "confirm-password": "123456789",
      })
      .expect(function (res) {
        const $ = load(res.text);
        expect($("#password-error").text()).to.contains(
          "Your password must be at least 8 characters long and must include letters and numbers"
        );
      })
      .expect(400, done);
  });

  it("should return validation error when password is amongst most common passwords", (done) => {
    nock(baseApi)
      .post(API_ENDPOINTS.UPDATE_PASSWORD)
      .once()
      .reply(400, { code: 1040 });

    request(app)
      .post(PATH_DATA.CHANGE_PASSWORD.url)
      .type("form")
      .set("Cookie", cookies)
      .send({
        _csrf: token,
        password: "password123",
        "confirm-password": "password123",
      })
      .expect(function (res) {
        const $ = load(res.text);
        expect($("#password-error").text()).to.contains(
          "Enter a stronger password. Do not use very common passwords, such as ‘password’ or a sequence of numbers"
        );
      })
      .expect(400, done);
  });

  it("should return validation error when password is all letters", (done) => {
    request(app)
      .post(PATH_DATA.CHANGE_PASSWORD.url)
      .type("form")
      .set("Cookie", cookies)
      .send({
        _csrf: token,
        password: "testpassword",
        "confirm-password": "testpassword",
      })
      .expect(function (res) {
        const $ = load(res.text);
        expect($("#password-error").text()).to.contains(
          "Your password must be at least 8 characters long and must include letters and numbers"
        );
      })
      .expect(400, done);
  });

  it("should return error when new password is the same as existing password", (done) => {
    nock(baseApi)
      .post(API_ENDPOINTS.UPDATE_PASSWORD)
      .once()
      .reply(400, { code: 1024 });

    request(app)
      .post(PATH_DATA.CHANGE_PASSWORD.url)
      .type("form")
      .set("Cookie", cookies)
      .send({
        _csrf: token,
        password: "p@ssw0rd-123",
        "confirm-password": "p@ssw0rd-123",
      })
      .expect(function (res) {
        const $ = load(res.text);
        expect($("#password-error").text()).to.contains(
          "Your account is already using that password. Enter a different password"
        );
      })
      .expect(400, done);
  });

  it("should throw error when 400 is returned from API", (done) => {
    nock(baseApi)
      .post(API_ENDPOINTS.UPDATE_PASSWORD)
      .once()
      .reply(400, { code: 1000 });

    request(app)
      .post(PATH_DATA.CHANGE_PASSWORD.url)
      .type("form")
      .set("Cookie", cookies)
      .send({
        _csrf: token,
        password: "p@ssw0rd-123",
        "confirm-password": "p@ssw0rd-123",
      })
      .expect(function (res) {
        const $ = load(res.text);
        expect($(".govuk-heading-l").text()).to.contains(
          "Sorry, there is a problem with the service"
        );
      })
      .expect(500, done);
  });

  it("should redirect to enter phone number when valid password entered", (done) => {
    nock(baseApi).post(API_ENDPOINTS.UPDATE_PASSWORD).once().reply(204);

    request(app)
      .post(PATH_DATA.CHANGE_PASSWORD.url)
      .type("form")
      .set("Cookie", cookies)
      .send({
        _csrf: token,
        password: "action-1",
        "confirm-password": "action-1",
      })
      .expect("Location", PATH_DATA.PASSWORD_UPDATED_CONFIRMATION.url)
      .expect(302, done);
  });
});
