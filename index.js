require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  db: { schema: "vz" },
});

async function subscribeToChanges() {
  console.log("Setting up subscription...");

  const channel = supabase
    .channel("custom-all-channel")
    .on(
      "postgres_changes",
      { event: "*", schema: "vz", table: "rule" },
      payload => {
        console.log("Change received!", payload);
      }
    )
    .subscribe(status => {
      console.log("Subscription status:", status);
    });

  const { error } = await channel;

  if (error) {
    console.error("Error subscribing to changes:", error);
  } else {
    console.log('Subscribed to changes in table "rule"');
  }
}

subscribeToChanges();
