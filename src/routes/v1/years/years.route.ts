import express, { Router } from "express";

import getPassoutYears from "@/controllers/years/get-passout-years.controller";

const yearsRouter: Router = express.Router();

yearsRouter.route("/years/passout").get(getPassoutYears);

export default yearsRouter;
