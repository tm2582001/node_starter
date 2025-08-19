import {
  mysqlTable,
  int,
  varchar,
  text,
  primaryKey,
} from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm/relations";

import { passoutYearMaster } from "./passout-year-master.schema";

// Main alumni_record table
export const alumniRecord = mysqlTable(
  "alumni_record",
  {
    id: int("Id").autoincrement().notNull(),
    name: varchar("Name", { length: 255 }),
    studentCode: varchar("StudentCode", { length: 255 }),
    enrollmentId: int("EnrollmentId"),
    fatherName: varchar("FatherName", { length: 255 }),
    motherName: varchar("MotherName", { length: 255 }),
    address: text("Address"),
    contactNumber: varchar("ContactNumber", { length: 255 }),
    emailId: varchar("EmailId", { length: 255 }),
    userName: varchar("UserName", { length: 255 }),
    password: varchar("Password", { length: 255 }),
    programId: int("ProgramId"),
    passOutYearId: int("PassOutYearId").references(() => passoutYearMaster.id, {
      onDelete: "restrict",
      onUpdate: "restrict",
    }),
    passOutRank: varchar("PassOutRank", { length: 255 }),
    sortOrder: int("SortOrder"),
    photoFile: text("PhotoFile"),
    remarks: text("Remarks"),
    city: varchar("City", { length: 30 }),
    state: varchar("State", { length: 30 }),
    pincode: varchar("Pincode", { length: 15 }),
    country: varchar("Country", { length: 50 }),
    tempProgram: varchar("Temp_Program", { length: 255 }),
    tempDepartment: varchar("Temp_Department", { length: 255 }),
    tempPD: varchar("Temp_P_D", { length: 255 }),
  },
  (table) => [primaryKey({ columns: [table.id], name: "alumni_record_Id" })],
);

// Relations definition
export const alumniRecordRelations = relations(
  alumniRecord,

  ({ one, many: _many }) => ({
    // Many-to-one relationship with passout year
    passoutYearMaster: one(passoutYearMaster, {
      fields: [alumniRecord.passOutYearId],
      references: [passoutYearMaster.id],
    }),
    // Note: One-to-many relationships with other tables would be defined here
    // when those schema files are available:
    // alumniPersonEducationQualifications: many(alumniPersonEducationQualification),
    // alumniRankMappings: many(alumniRankMapping),
    // studentWorkExperiences: many(studentWorkExperience),
  }),
);

// TypeScript types
export type AlumniRecord = typeof alumniRecord.$inferSelect;
export type NewAlumniRecord = typeof alumniRecord.$inferInsert;
