import {
  pgTable,
  serial,
  text,
  integer,
  bigserial,
  bigint,
  timestamp,
  inet,
} from "drizzle-orm/pg-core";

/**
 * NAS (Network Access Server) table - FreeRADIUS clients (routers/APs).
 * Used by FreeRADIUS for authorization and by the API to add new routers.
 */
export const nas = pgTable("nas", {
  id: serial("id").primaryKey(),
  nasname: text("nasname").notNull(),
  shortname: text("shortname").notNull(),
  type: text("type").notNull().default("other"),
  ports: integer("ports"),
  secret: text("secret").notNull(),
  server: text("server"),
  community: text("community"),
  description: text("description"),
  requireMa: text("require_ma").notNull().default("auto"),
  limitProxyState: text("limit_proxy_state").notNull().default("auto"),
});

/**
 * RADIUS accounting table - session records written by FreeRADIUS.
 */
export const radacct = pgTable("radacct", {
  radacctid: bigserial("radacctid", { mode: "number" }).primaryKey(),
  acctsessionid: text("acctsessionid").notNull(),
  acctuniqueid: text("acctuniqueid").notNull().unique(),
  username: text("username"),
  groupname: text("groupname"),
  realm: text("realm"),
  nasipaddress: inet("nasipaddress").notNull(),
  nasportid: text("nasportid"),
  nasporttype: text("nasporttype"),
  acctstarttime: timestamp("acctstarttime", { withTimezone: true }),
  acctupdatetime: timestamp("acctupdatetime", { withTimezone: true }),
  acctstoptime: timestamp("acctstoptime", { withTimezone: true }),
  acctinterval: bigint("acctinterval", { mode: "number" }),
  acctsessiontime: bigint("acctsessiontime", { mode: "number" }),
  acctauthentic: text("acctauthentic"),
  connectinfoStart: text("connectinfo_start"),
  connectinfoStop: text("connectinfo_stop"),
  acctinputoctets: bigint("acctinputoctets", { mode: "number" }),
  acctoutputoctets: bigint("acctoutputoctets", { mode: "number" }),
  calledstationid: text("calledstationid"),
  callingstationid: text("callingstationid"),
  acctterminatecause: text("acctterminatecause"),
  servicetype: text("servicetype"),
  framedprotocol: text("framedprotocol"),
  framedipaddress: inet("framedipaddress"),
  framedipv6address: inet("framedipv6address"),
  framedipv6prefix: inet("framedipv6prefix"),
  framedinterfaceid: text("framedinterfaceid"),
  delegatedipv6prefix: inet("delegatedipv6prefix"),
  class: text("class"),
});

export type Nas = typeof nas.$inferSelect;
export type NewNas = typeof nas.$inferInsert;
export type Radacct = typeof radacct.$inferSelect;
