-- FreeRADIUS PostgreSQL schema (source: freeradius-server raddb/mods-config/sql/main/postgresql/schema.sql)
-- This file is mounted into the Postgres container at /docker-entrypoint-initdb.d/init.sql

CREATE TABLE IF NOT EXISTS radacct (
  radacctid bigserial PRIMARY KEY,
  acctsessionid text NOT NULL,
  acctuniqueid text NOT NULL UNIQUE,
  username text,
  groupname text,
  realm text,
  nasipaddress inet NOT NULL,
  nasportid text,
  nasporttype text,
  acctstarttime timestamp with time zone,
  acctupdatetime timestamp with time zone,
  acctstoptime timestamp with time zone,
  acctinterval bigint,
  acctsessiontime bigint,
  acctauthentic text,
  connectinfo_start text,
  connectinfo_stop text,
  acctinputoctets bigint,
  acctoutputoctets bigint,
  calledstationid text,
  callingstationid text,
  acctterminatecause text,
  servicetype text,
  framedprotocol text,
  framedipaddress inet,
  framedipv6address inet,
  framedipv6prefix inet,
  framedinterfaceid text,
  delegatedipv6prefix inet,
  class text
);

CREATE INDEX IF NOT EXISTS radacct_active_session_idx ON radacct (acctuniqueid) WHERE acctstoptime IS NULL;
CREATE INDEX IF NOT EXISTS radacct_bulk_close ON radacct (nasipaddress, acctstarttime) WHERE acctstoptime IS NULL;
CREATE INDEX IF NOT EXISTS radacct_bulk_timeout ON radacct (acctstoptime NULLS FIRST, acctupdatetime);
CREATE INDEX IF NOT EXISTS radacct_start_user_idx ON radacct (acctstarttime, username);

CREATE TABLE IF NOT EXISTS radcheck (
  id serial PRIMARY KEY,
  username text NOT NULL DEFAULT '',
  attribute text NOT NULL DEFAULT '',
  op VARCHAR(2) NOT NULL DEFAULT '==',
  value text NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS radcheck_username ON radcheck (username, attribute);

CREATE TABLE IF NOT EXISTS radgroupcheck (
  id serial PRIMARY KEY,
  groupname text NOT NULL DEFAULT '',
  attribute text NOT NULL DEFAULT '',
  op VARCHAR(2) NOT NULL DEFAULT '==',
  value text NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS radgroupcheck_groupname ON radgroupcheck (groupname, attribute);

CREATE TABLE IF NOT EXISTS radgroupreply (
  id serial PRIMARY KEY,
  groupname text NOT NULL DEFAULT '',
  attribute text NOT NULL DEFAULT '',
  op VARCHAR(2) NOT NULL DEFAULT '=',
  value text NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS radgroupreply_groupname ON radgroupreply (groupname, attribute);

CREATE TABLE IF NOT EXISTS radreply (
  id serial PRIMARY KEY,
  username text NOT NULL DEFAULT '',
  attribute text NOT NULL DEFAULT '',
  op VARCHAR(2) NOT NULL DEFAULT '=',
  value text NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS radreply_username ON radreply (username, attribute);

CREATE TABLE IF NOT EXISTS radusergroup (
  id serial PRIMARY KEY,
  username text NOT NULL DEFAULT '',
  groupname text NOT NULL DEFAULT '',
  priority integer NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS radusergroup_username ON radusergroup (username);

CREATE TABLE IF NOT EXISTS radpostauth (
  id bigserial PRIMARY KEY,
  username text NOT NULL,
  pass text,
  reply text,
  calledstationid text,
  callingstationid text,
  authdate timestamp with time zone NOT NULL default now(),
  class text
);

CREATE TABLE IF NOT EXISTS nas (
  id serial PRIMARY KEY,
  nasname text NOT NULL,
  shortname text NOT NULL,
  type text NOT NULL DEFAULT 'other',
  ports integer,
  secret text NOT NULL,
  server text,
  community text,
  description text,
  require_ma text NOT NULL DEFAULT 'auto',
  limit_proxy_state text NOT NULL DEFAULT 'auto'
);
CREATE INDEX IF NOT EXISTS nas_nasname ON nas (nasname);

CREATE TABLE IF NOT EXISTS nasreload (
  nasipaddress inet PRIMARY KEY,
  reloadtime timestamp with time zone NOT NULL
);
