require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

const jsonDirectory = path.join(__dirname, process.env.JSON_FILES_PATH);
const sendDirectory = path.join(__dirname, process.env.SEND_FILES_PATH);

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
  const directory = path.join(__dirname, process.env.JSON_FILES_PATH);

  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory);
  }

  const files = fs.readdirSync(directory);
  const tableFiles = files.filter(file =>
    file.startsWith(`${change.table}_change`)
  );
  let filePath;

  if (tableFiles.length === 0) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    filePath = path.join(directory, `${change.table}_change_${timestamp}.json`);

    const logDirectory = path.join(__dirname, process.env.LOG_FILES_PATH);
    if (!fs.existsSync(logDirectory)) {
      fs.mkdirSync(logDirectory);
    }

    const currentDate = new Date().toLocaleDateString().replace(/\//g, "-");
    const logFilePath = path.join(logDirectory, `${currentDate}.txt`);
    const logContent = `CREATE ${path.basename(
      filePath
    )} ${new Date().toLocaleString()}\n`;

    fs.appendFileSync(logFilePath, logContent);
  } else {
    filePath = path.join(directory, tableFiles[0]);
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
    uuid: change.old.uuid
  });

  fs.writeFileSync(filePath, JSON.stringify(changes, null, 2));
}

async function subscribeToTableChanges(table) {
  console.log(`Setting up subscription for table ${table}...`);
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
  }
}

async function main() {
  const schema = "vz";
  const tables = await getTablesFromSchema(schema);

  tables.forEach(table => {
    subscribeToTableChanges(table);
  });
}

function ensureDirectoryExists(directory) {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory);
  }
}

function cutAndPasteFiles() {
  ensureDirectoryExists(sendDirectory);
  fs.readdir(jsonDirectory, (err, files) => {
    if (err) {
      console.error("Error reading directory:", err);
      return;
    }
    files.forEach(file => {
      const sourceFile = path.join(jsonDirectory, file);
      const destinationFile = path.join(sendDirectory, file);
      fs.rename(sourceFile, destinationFile, err => {
        if (err) {
          console.error(`Error moving file ${file}:`, err);
        }
      });
    });
  });
}

setInterval(cutAndPasteFiles, process.env.SEND_TIME);

main();
