import { expect } from "chai";
import { describe } from "mocha";
import { NextFunction } from "express";
import { sinon } from "../../utils/test-utils.js";
import { refreshTokenMiddleware } from "../../../src/middleware/refresh-token-middleware.js";
import { UnsecuredJWT } from "jose";
import { ClientAssertionServiceInterface } from "../../../src/utils/types.js";
import { ClientMetadata, Issuer } from "openid-client";

function createAccessToken(expiry = 1600711538) {
  return new UnsecuredJWT({ exp: expiry })
    .setIssuedAt()
    .setSubject("12345")
    .setIssuer("urn:example:issuer")
    .setAudience("urn:example:audience")
    .encode();
}
describe("Refresh token middleware", () => {
  it("should call next when token not expired", async () => {
    const req: any = {
      session: {
        user: {
          email: "test@test.com",
          tokens: {
            accessToken: createAccessToken(1758477938),
          },
        },
      },
    };

    const res: any = { locals: {}, redirect: sinon.fake() };
    const nextFunction: NextFunction = sinon.fake(() => {});

    const fakeService: ClientAssertionServiceInterface = {
      generateAssertionJwt: sinon.fake(),
    };

    await refreshTokenMiddleware(fakeService)(req, res, nextFunction);

    expect(nextFunction).to.have.been.called;
    expect(fakeService.generateAssertionJwt).to.have.not.been.called;
  });

  it("should refresh token when token expired", async () => {
    const req: any = {
      session: {
        user: {
          email: "test@test.com",
          tokens: {
            accessToken: createAccessToken(),
            refreshToken: "refresh",
          },
        },
      },
      oidc: {
        metadata: {} as Partial<ClientMetadata>,
        issuer: { metadata: { token_endpoint: "" } } as Partial<Issuer<any>>,
        refresh: sinon.fake.returns({ access_token: "", refresh_token: "" }),
      },
    };

    const fakeService: ClientAssertionServiceInterface = {
      generateAssertionJwt: sinon.fake(),
    };

    const res: any = { locals: {}, redirect: sinon.fake() };
    const nextFunction: NextFunction = sinon.fake(() => {});

    await refreshTokenMiddleware(fakeService)(req, res, nextFunction);

    expect(fakeService.generateAssertionJwt).to.have.been.calledOnce;
    expect(req.oidc.refresh).to.have.been.calledOnce;
    expect(nextFunction).to.have.called.calledOnce;
  });
});
