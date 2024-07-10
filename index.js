require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  db: { schema: "vz" },
});

async function getTablesFromSchema(schema) {
  const { data, error } = await supabase.rpc("get_tables", {
    schema_name: schema,
  });

  if (error) {
    console.error("Error getting tables:", error);
    return [];
  }

  return data.map(row => row.table_name);
}

async function appendChangeToFile(change) {
  const directory = path.join(__dirname, "json_files");
  const filePath = path.join(directory, `${change.table}_change.json`);

  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory);
  }

  let changes = [];
  if (fs.existsSync(filePath)) {
    const fileData = fs.readFileSync(filePath);
    changes = JSON.parse(fileData);
  }

  changes.push({
    eventType: change.eventType,
    table: change.table,
    payload: change.new,
  });

  fs.writeFileSync(filePath, JSON.stringify(changes, null, 2));
}

async function subscribeToTableChanges(table) {
  const channel = supabase
    .channel(`custom-all-channel-${table}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "vz", table: table },
      payload => {
        console.log(`Change received for table ${table}!`, payload);
        appendChangeToFile(payload);
      }
    )
    .subscribe();

  const { error } = await channel;

  if (error) {
    console.error(`Error subscribing to changes for table ${table}:`, error);
  } else {
    console.log(`Subscribed to changes in table ${table}`);
  }
}

async function main() {
  const schema = "vz";
  const tables = await getTablesFromSchema(schema);

  tables.forEach(table => {
    subscribeToTableChanges(table);
  });
}

main();
