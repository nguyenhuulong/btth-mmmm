ALTER ROLE authenticator SET pgrst.db_schemas TO 'public, storage, graphql, realtime, vz';
GRANT ALL PRIVILEGES ON DATABASE "postgres" to authenticator;
GRANT USAGE on schema vz to service_role;
GRANT all on all tables in schema vz to service_role;