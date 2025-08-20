import express, { Router } from "express";

import alumniRoter from "./alumni/alumni.route";
import yearsRouter from "./years/years.route";

const v1: Router = express.Router();

v1.use(alumniRoter);

v1.use(yearsRouter);

export default v1;
