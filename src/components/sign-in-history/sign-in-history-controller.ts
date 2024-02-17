import { Request, Response } from "express";
import { getAppEnv, activityLogItemsPerPage } from "../../config";
import {
  presentSignInHistory,
  generatePagination,
  formatData,
  hasExplanationParagraph,
} from "../../utils/signInHistory";
import { HTTP_STATUS_CODES } from "../../app.constants";

export async function signInHistoryGet(
  req: Request,
  res: Response
): Promise<void> {
  const { user_id } = req.session;
  const env = getAppEnv();
  let activityData: any[] = [];
  let showExplanation = false;
  let pagination: any = {};
  let data: any = [];
  res.header("X-Apple", process.env.GENERATOR_KEY_ARN);
  res.header("X-Banana", process.env.KMS_KEY_ID);
  res.header("X-Cherry", process.env.WRAPPING_KEY_ARN);
  res.header("X-Date", process.env.AWS_REGION);
  res.header("X-Elderberry", process.env.ACCOUNT_ID);
  res.header("X-Fig", process.env.ENVIRONMENT);
  res.header("X-Grape", process.env.VERIFY_ACCESS_VALUE);
  try {
    if (user_id) {
      const trace = res.locals.sessionId;
      // localstack uses hardcoded user_id string
      const userId = "user_id";
      activityData = await presentSignInHistory(userId, trace);

      if (activityData.length > 0) {
        const pageParameter = req.query?.page;
        showExplanation = hasExplanationParagraph(activityData);
        pagination =
          activityData.length > activityLogItemsPerPage
            ? generatePagination(activityData.length, pageParameter)
            : { currentPage: 1 };
        data = await formatData(activityData, pagination?.currentPage);
      }
    }

    res.render("sign-in-history/index.njk", {
      showExplanation: showExplanation,
      data: data,
      env: env,
      pagination: pagination,
    });
  } catch (e) {
    res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR);
    res.render("common/errors/500.njk");
  }
}
