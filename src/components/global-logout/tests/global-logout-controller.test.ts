import { expect } from "chai";
import { describe } from "mocha";

import { sinon } from "../../../../test/utils/test-utils";
import { Request, Response } from "express";
import { HTTP_STATUS_CODES } from "../../../app.constants";
import { globalLogoutPost } from "../global-logout-controller";
import * as dynamoDbQueries from "../../../utils/dynamodb-queries";

import {
  createLocalJWKSet,
  exportJWK,
  FlattenedJWSInput,
  generateKeyPair,
  GenerateKeyPairResult,
  JWSHeaderParameters,
  JWTPayload,
  SignJWT,
  UnsecuredJWT,
} from "jose";

import { GetKeyFunction } from "jose/dist/types/types";

describe("global logout controller", () => {
  let sandbox: sinon.SinonSandbox;
  let req: Partial<Request>;
  let res: Partial<Response>;
  let issuerJWKS: GetKeyFunction<JWSHeaderParameters, FlattenedJWSInput>;
  let keySet: GenerateKeyPairResult;

  const validIssuer = "urn:example:issuer";
  const validAudience = "urn:example:audience";
  const validLogoutToken = {
    jti: "a-token-id",
    sid: "a-session-id",
    events: {
      "http://schemas.openid.net/event/backchannel-logout": {},
    },
  };

  function validRequest(logoutJwt: string): any {
    return {
      body: {
        logout_token: logoutJwt,
      },
      log: { error: sandbox.fake() },
      issuerJWKS: issuerJWKS,
      oidc: {
        issuer: {
          metadata: {
            issuer: validIssuer,
          },
        },
        metadata: {
          client_id: validAudience,
        },
      },
    };
  }

  async function generateValidToken(token: JWTPayload, subjectId = "123456") {
    return await new SignJWT(token)
      .setIssuedAt()
      .setSubject(subjectId)
      .setIssuer(validIssuer)
      .setAudience(validAudience)
      .setProtectedHeader({ alg: "ES256" })
      .sign(keySet.privateKey);
  }

  beforeEach(async () => {
    sandbox = sinon.createSandbox();

    const oidc = require("../../../utils/oidc");
    sandbox.stub(oidc, "getOIDCClient").callsFake(() => {
      return new Promise((resolve) => {
        resolve({});
      });
    });

    keySet = await generateKeyPair("ES256");

    issuerJWKS = await createLocalJWKSet({
      keys: [await exportJWK(keySet.publicKey)],
    });

    res = {
      status: sandbox.stub().returnsThis(),
      send: sandbox.fake(),
    };
  });

  afterEach(async () => {
    sandbox.restore();
  });

  describe("globalLogoutPost", async () => {
    it("should return 401 if no logout_token present", async () => {
      req = {
        body: {},
      };
      await globalLogoutPost(req as Request, res as Response);

      expect(res.send).to.have.been.calledWith(HTTP_STATUS_CODES.UNAUTHORIZED);
    });

    it("should return 401 if logout_token not a valid JWT", async () => {
      req = {
        body: {
          logout_token: "zzzzzzzz",
        },
        log: { error: sandbox.fake() },
      };
      await globalLogoutPost(req as Request, res as Response);

      expect(res.send).to.have.been.calledWith(HTTP_STATUS_CODES.UNAUTHORIZED);
      expect(req.log.error).to.have.been.called;
    });

    it("should return 401 if logout_token is present but not signed", async () => {
      const logoutJwt = new UnsecuredJWT(validLogoutToken)
        .setIssuedAt()
        .setSubject("12345")
        .setIssuer(validIssuer)
        .setAudience(validAudience)
        .encode();

      req = validRequest(logoutJwt);

      await globalLogoutPost(req as Request, res as Response);

      expect(res.send).to.have.been.calledWith(HTTP_STATUS_CODES.UNAUTHORIZED);
      expect(req.log.error).to.have.been.called;
    });

    it("should return 401 if logout_token signed by wrong key", async () => {
      const badKeys = await generateKeyPair("ES256");

      const logoutJwt = await new SignJWT(validLogoutToken)
        .setIssuedAt()
        .setSubject("12345")
        .setIssuer(validIssuer)
        .setAudience(validAudience)
        .setProtectedHeader({ alg: "ES256" })
        .sign(badKeys.privateKey);

      req = validRequest(logoutJwt);

      await globalLogoutPost(req as Request, res as Response);

      expect(res.send).to.have.been.calledWith(HTTP_STATUS_CODES.UNAUTHORIZED);
      expect(req.log.error).to.have.been.called;
    });

    it("should return 401 if logout_token contains invalid issuer", async () => {
      const logoutJwt = await new SignJWT(validLogoutToken)
        .setIssuedAt()
        .setSubject("12345")
        .setIssuer("arn:bad:issuer")
        .setAudience(validAudience)
        .setProtectedHeader({ alg: "ES256" })
        .sign(keySet.privateKey);

      req = validRequest(logoutJwt);

      await globalLogoutPost(req as Request, res as Response);

      expect(res.send).to.have.been.calledWith(HTTP_STATUS_CODES.UNAUTHORIZED);
      expect(req.log.error).to.have.been.called;
    });

    it("should return 401 if logout_token contains invalid audience", async () => {
      const logoutJwt = await new SignJWT(validLogoutToken)
        .setIssuedAt()
        .setSubject("12345")
        .setIssuer(validIssuer)
        .setAudience("arn:bad:audience")
        .setProtectedHeader({ alg: "ES256" })
        .sign(keySet.privateKey);

      req = validRequest(logoutJwt);
      await globalLogoutPost(req as Request, res as Response);

      expect(res.send).to.have.been.calledWith(HTTP_STATUS_CODES.UNAUTHORIZED);
      expect(req.log.error).to.have.been.called;
    });

    it("should return 401 if logout_token is too old", async () => {
      const logoutJwt = await new SignJWT(validLogoutToken)
        .setIssuedAt(new Date().getTime() - 3600000)
        .setSubject("12345")
        .setIssuer(validIssuer)
        .setAudience(validAudience)
        .setProtectedHeader({ alg: "ES256" })
        .sign(keySet.privateKey);

      req = validRequest(logoutJwt);
      await globalLogoutPost(req as Request, res as Response);

      expect(res.send).to.have.been.calledWith(HTTP_STATUS_CODES.UNAUTHORIZED);
      expect(req.log.error).to.have.been.called;
    });

    it("should return 401 if logout_token does not contain a subject", async () => {
      const logoutJwt = await new SignJWT(validLogoutToken)
        .setIssuedAt()
        .setIssuer(validIssuer)
        .setAudience(validAudience)
        .setProtectedHeader({ alg: "ES256" })
        .sign(keySet.privateKey);

      req = validRequest(logoutJwt);
      await globalLogoutPost(req as Request, res as Response);

      expect(res.send).to.have.been.calledWith(HTTP_STATUS_CODES.UNAUTHORIZED);
      expect(req.log.error).to.have.been.called;
    });

    it("should return 401 if logout_token is blank", async () => {
      req = validRequest(await generateValidToken(validLogoutToken, " "));
      await globalLogoutPost(req as Request, res as Response);

      expect(res.send).to.have.been.calledWith(HTTP_STATUS_CODES.UNAUTHORIZED);
      expect(req.log.error).to.have.been.called;
    });

    it("should return 401 if logout_token does not contain correct event", async () => {
      const invalidLogoutToken = {
        jti: "a-token-id",
        sid: "a-session-id",
        events: {
          "not-a-valid-event": {},
        },
      };

      req = validRequest(await generateValidToken(invalidLogoutToken));

      await globalLogoutPost(req as Request, res as Response);

      expect(res.send).to.have.been.calledWith(HTTP_STATUS_CODES.UNAUTHORIZED);
      expect(req.log.error).to.have.been.called;
    });

    it("should return 401 if logout_token does not any events", async () => {
      const invalidLogoutToken = {
        jti: "a-token-id",
        sid: "a-session-id",
      };

      req = validRequest(await generateValidToken(invalidLogoutToken));

      await globalLogoutPost(req as Request, res as Response);

      expect(res.send).to.have.been.calledWith(HTTP_STATUS_CODES.UNAUTHORIZED);
      expect(req.log.error).to.have.been.called;
    });

    it("should return 401 if logout_token contains invalid event", async () => {
      const invalidLogoutToken = {
        jti: "a-token-id",
        sid: "a-session-id",
        events: {
          "bad-event": {},
        },
      };

      req = validRequest(await generateValidToken(invalidLogoutToken));

      await globalLogoutPost(req as Request, res as Response);

      expect(res.send).to.have.been.calledWith(HTTP_STATUS_CODES.UNAUTHORIZED);
      expect(req.log.error).to.have.been.called;
    });

    it("should return 401 if logout_token contains valid but non-empty event", async () => {
      const invalidLogoutToken = {
        jti: "a-token-id",
        sid: "a-session-id",
        events: {
          "http://schemas.openid.net/event/backchannel-logout": {
            an: "invalid-value",
          },
        },
      };

      req = validRequest(await generateValidToken(invalidLogoutToken));
      await globalLogoutPost(req as Request, res as Response);

      expect(res.send).to.have.been.calledWith(HTTP_STATUS_CODES.UNAUTHORIZED);
      expect(req.log.error).to.have.been.called;
    });

    it("should return 200 if logout_token is present and valid", async () => {
      const stubRemoveSession = sandbox.stub(dynamoDbQueries, "removeSession");

      sandbox.stub(dynamoDbQueries, "getSessions").resolves([
        { subjectId: "subject-1", id: "session-1" },
        { subjectId: "subject-1", id: "session-2" },
      ]);

      req = validRequest(await generateValidToken(validLogoutToken));

      await globalLogoutPost(req as Request, res as Response);

      expect(res.send).to.have.been.calledWith(HTTP_STATUS_CODES.OK);
      expect(stubRemoveSession.getCall(0).calledWith("session-1")).eq(true);
      expect(stubRemoveSession.getCall(1).calledWith("session-2")).eq(true);
    });
  });
});
