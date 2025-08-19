import { mysqlTable, int, varchar, primaryKey } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm/relations";

import { alumniRecord } from "./alumni-record.schema";

// Passout year master table
export const passoutYearMaster = mysqlTable(
  "passout_year_master",
  {
    id: int("Id").autoincrement().notNull(),
    name: varchar("Name", { length: 255 }),
    enableStatus: int("EnableStatus"),
    sortOrder: int("SortOrder"),
  },
  (table) => [
    primaryKey({ columns: [table.id], name: "passout_year_master_Id" }),
  ],
);

export const passoutYearMasterRelations = relations(
  passoutYearMaster,
  ({ many }) => ({
    alumniRecords: many(alumniRecord),
  }),
);

// TypeScript types
export type PassoutYearMaster = typeof passoutYearMaster.$inferSelect;
export type NewPassoutYearMaster = typeof passoutYearMaster.$inferInsert;
