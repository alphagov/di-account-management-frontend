import * as express from "express";
import { EVENT_NAME, PATH_DATA } from "../../app.constants";

import { eventService } from "../../services/event-service";
import { buildContactEmailServiceUrl } from "./track-and-redirect-controller";

const router = express.Router();
router.get(PATH_DATA.TRACK_AND_REDIRECT.url, (req, res) => {
  const emailServiceUrl = buildContactEmailServiceUrl(req);
  const service = eventService();
  const audit_event = service.buildAuditEvent(
    req,
    res,
    EVENT_NAME.HOME_TRIAGE_PAGE_EMAIL
  );
  service.send(audit_event);
  res.redirect(emailServiceUrl.toString());
});

export { router as trackAndRedirectRouter };