import { Request, Response } from "express";
import { presentYourServices } from "../../utils/yourServices";

export async function yourServicesGet(
  req: Request,
  res: Response
): Promise<void> {
  const { user } = req.session;
  if (user && user.subjectId) {
    req.log.info("subject id " + user.subjectId);
    const serviceData = await presentYourServices(user.subjectId);
    req.log.info("serviceData " + serviceData);
    const data = {
      email: req.session.user.email,
      accountsList: serviceData.accountsList,
      servicesList: serviceData.servicesList,
    };

    res.render("your-services/index.njk", data);
  } else {
    res.render("your-services/index.njk", { email: user.email });
  }
}
