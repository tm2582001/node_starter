import express, { Router } from "express";

import alumniRoter from "./alumni/alumni.route";

const v1: Router = express.Router();

v1.use(alumniRoter);

export default v1;
