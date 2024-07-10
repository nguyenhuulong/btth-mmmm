const SUPABASE_URL = "http://192.168.43.163:8001";

const _supabase = require("@supabase/supabase-js");

var KEY = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q`;
const supabase = _supabase.createClient(SUPABASE_URL, KEY, {
  db: { schema: "vz" },
});

(async () => {
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

  var { data, error } = await channel;

  if (error) {
    console.error("Error subscribing to changes:", error);
  } else {
    console.log('Subscribed to changes in table "rule"');
    // var { data, error1 } = await supabase
    //   .from("rule")
    //   .insert([
    //     {
    //       uuid: "c02b4c2e-f191-4f23-b936-923288860277",
    //       name: "otherValue",
    //       create_by: "xxxx",
    //       create_date: new Date(),
    //       order_date: new Date(),
    //       update_by: "sdsds",
    //       update_date: new Date(),
    //       event: "ffff",
    //       type: "eeeee",
    //       is_default: false,
    //     },
    //   ])
    //   .select();
    // console.log(data, error1)
  }
})();
