import { expect } from "chai";
import { describe, it } from "mocha";
import { Request, Response } from "express";
import sinon, { SinonSandbox } from "sinon";
import { addMfaMethodPost } from "./add-mfa-methods-controller";
import { PATH_DATA } from "../../app.constants";

describe("addMfaMethodPost", () => {
  let sandbox: SinonSandbox;
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: sinon.SinonSpy;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    req = { body: {} };
    res = {
      status: sandbox.fake(),
      end: sandbox.fake(),
      redirect: sandbox.fake(),
    };
    next = sinon.spy();
  });

  afterEach(() => {
    sandbox.restore();
  });

  it("should return 400 status code when addMfaMethod is 'sms'", () => {
    req.body.addMfaMethod = "sms";

    addMfaMethodPost(req as Request, res as Response, next);

    expect(res.status).to.have.been.calledWith(400);
    expect(res.end).to.have.been.called;
    expect(res.redirect).to.not.have.been.called;
    expect(next).to.not.have.been.called;
  });

  it("should redirect to the app MFA method page when addMfaMethod is 'app'", () => {
    req.body.addMfaMethod = "app";

    addMfaMethodPost(req as Request, res as Response, next);

    expect(res.redirect).to.have.been.calledWith(
      PATH_DATA.ADD_MFA_METHOD_APP.url
    );
    expect(res.status).to.not.have.been.called;
    expect(res.end).to.not.have.been.called;
    expect(next).to.not.have.been.called;
  });

  it("should call next with an error when addMfaMethod is unknown", () => {
    req.body.addMfaMethod = "unknown";

    addMfaMethodPost(req as Request, res as Response, next);

    expect(next).to.have.been.calledWithMatch(
      Error,
      "Unknown addMfaMethod: unknown"
    );
    expect(res.status).to.not.have.been.called;
    expect(res.end).to.not.have.been.called;
    expect(res.redirect).to.not.have.been.called;
  });
});
