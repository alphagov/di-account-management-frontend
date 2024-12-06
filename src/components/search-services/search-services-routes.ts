import * as express from "express";
import { PATH_DATA } from "../../app.constants";
import { searchServicesGet } from "./search-services-controller";

const router = express.Router();

router.get(PATH_DATA.SEARCH_SERVICES.url, searchServicesGet);

export { router as searchServicesRouter };
