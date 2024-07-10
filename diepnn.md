ALTER ROLE authenticator SET pgrst.db_schemas TO 'public, storage, graphql, realtime, vz';

NOTIFY pgrst;


SELECT * FROM pg_user;
SELECT * FROM pg_roles;



GRANT ALL PRIVILEGES ON DATABASE "postgres" to authenticator;


grant USAGE on schema vz to service_role;
grant all on all tables in schema vz to service_role;



select * from pgrst;