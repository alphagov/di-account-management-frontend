import { expect } from "chai";
import { describe } from "mocha";
import { NextFunction } from "express";
import { sinon } from "../../utils/test-utils";
import { isUserLoggedInMiddleware } from "../../../src/middleware/is-user-logged-in-middleware";

describe("isUserLoggedInMiddleware", () => {
  let req: any;
  const res: any = { locals: {}, redirect: sinon.fake() };
  const nextFunction: NextFunction = sinon.fake(() => {});

  beforeEach(() => {
    req = {
      session: {
        user: {
          isAuthenticated: false,
        } as any,
      },
      cookies: {
        lo: "true",
      },
    };
  });

  it("should set isUserLoggedIn in res.locals", () => {
    isUserLoggedInMiddleware(req, res, nextFunction);
    expect(res.locals).to.have.property("isUserLoggedIn");
  });

  it("should call next function", () => {
    isUserLoggedInMiddleware(req, res, nextFunction);
    expect(nextFunction).to.have.been.called;
  });
});
