import express, { Router } from "express";

import saveAlumni from "@/controllers/alumni/save-alumni.controller";

const alumniRoter: Router = express.Router();

alumniRoter.route("/alumni").post(saveAlumni);

export default alumniRoter;
