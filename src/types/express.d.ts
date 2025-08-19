import type { MySql2Database } from "drizzle-orm/mysql2";

import type { ConfigurationType } from "../configurations.js";

declare global {
  namespace Express {
    interface Request {
      config: ConfigurationType;
      db: MySql2Database;
    }
  }
}

export {};
