import { afterEach, beforeEach, describe } from "mocha";
import { expect, sinon } from "../utils/test-utils";
import { startServer } from "../../src/app";
import express from "express";
import decache from "decache";

describe("app", () => {
  describe("startServer", () => {
    beforeEach(() => {
      process.env.PORT = "3060";
    });

    it("should start server on expected port", async () => {
      const app = express();
      const listenSpy = sinon.spy(app, "listen");
      const server = await startServer(app);
      expect(listenSpy).to.be.calledOnceWith(process.env.PORT);
      server.close();
    });

    it("should start server with expected timeouts", async () => {
      const app = express();
      const server = await startServer(app);
      expect(server.keepAliveTimeout).to.be.eq(61 * 1000);
      expect(server.headersTimeout).to.be.eq(91 * 1000);
      server.close();
    });

    it("should start server with vital-signs package", async () => {
      decache("../../src/app");
      decache("@govuk-one-login/frontend-vital-signs");
      const frontendVitalSigns = require("@govuk-one-login/frontend-vital-signs");
      sinon
        .stub(frontendVitalSigns, "frontendVitalSignsInit")
        .callsFake(() => {});
      const { startServer } = require("../../src/app");
      const app = express();
      const server = await startServer(app);
      expect(frontendVitalSigns.frontendVitalSignsInit).to.be.calledOnceWith(
        server,
        { staticPaths: [/^\/assets\/.*/, /^\/public\/.*/] }
      );
      server.close();
    });
  });

  describe("applyOverloadProtection", () => {
    beforeEach(() => {
      decache("../../src/app");
      sinon.stub(require("../../src/utils/redis"), "getRedisConfig").returns({
        host: "redis-host",
        port: Number("1234"),
        password: "redis-password",
        tls: true,
      });
      process.env.REDIS_KEY = "redis-key";
    });

    afterEach(() => {
      sinon.restore();
      delete process.env.REDIS_KEY;
      delete process.env.APP_ENV;
    });

    it("should not call applyOverloadProtection when the environment isn't staging", async () => {
      process.env.APP_ENV = "production";

      const app = await require("../../src/app").createApp();

      const hasOverloadProtection = app._router.stack.some(
        (layer: { name: string }) => layer.name === "overloadProtection"
      );
      expect(hasOverloadProtection).to.eq(false);
    });

    it("should applyOverloadProtection when the environment is staging", async () => {
      process.env.APP_ENV = "staging";

      const app = await require("../../src/app").createApp();

      const hasOverloadProtection = app._router.stack.some(
        (layer: { name: string }) => layer.name === "overloadProtection"
      );
      expect(hasOverloadProtection).to.eq(true);
    });
  });
});
