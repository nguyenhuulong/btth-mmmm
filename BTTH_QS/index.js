require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

const receivedDirectory = path.join(__dirname, process.env.RECEIVED_FILES_PATH);

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  db: { schema: "vz_qs" },
});

async function processJsonFiles() {
  fs.readdir(receivedDirectory, async (err, files) => {
    if (err) {
      console.error("Error reading directory:", err);
      return;
    }

    files.sort((a, b) => {
      const timestampA = parseInt(a.split("_")[0]);
      const timestampB = parseInt(b.split("_")[0]);
      return timestampA - timestampB;
    });

    for (const file of files) {
      const filePath = path.join(receivedDirectory, file);
      const fileData = fs.readFileSync(filePath, "utf8");
      const changes = JSON.parse(fileData);
      for (const change of changes) {
        await processChange(change);
      }
      fs.unlinkSync(filePath);
    }
  });
}

async function processChange(change) {
  const { eventType, table, payload, uuid } = change;
  let query;
  switch (eventType) {
    case "INSERT":
      query = supabase.from(table).insert([payload]);
      break;
    case "UPDATE":
      query = supabase.from(table).update(payload).eq("uuid", uuid);
      break;
    case "DELETE":
      query = supabase.from(table).delete().eq("uuid", uuid);
      break;
    default:
      console.error("Unknown event type:", eventType);
      return;
  }
  const { data, error } = await query;
  if (error) {
    console.error("Error applying change to database:", error);
  } else {
    console.log("Change applied successfully:", query.body);
  }
}

function ensureDirectoryExists(directory) {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory);
  }
}

function main() {
  ensureDirectoryExists(receivedDirectory);
  setInterval(processJsonFiles, process.env.SEND_TIME);
}

main();
