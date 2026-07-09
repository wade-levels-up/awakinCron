import pg from "pg";

// Railway automatically injects DATABASE_URL if linked
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });

async function decreaseStats() {
  try {
    await client.connect();
    // Decay rates calculated for Railway cron running every 5 minutes (288 runs/day):
    // Thirst: 100 / (3 days * 288 runs/day)  = ~0.1157 per run -> hits 0 in 3 days
    // Hunger: 100 / (21 days * 288 runs/day) = ~0.0165 per run -> hits 0 in 21 days
    const query = `
      UPDATE "Character" 
      SET "Hunger" = GREATEST(0, "Hunger" - 0.0165), 
          "Thirst" = GREATEST(0, "Thirst" - 0.1157);
    `;
    const res = await client.query(query);
    console.log(`Successfully updated ${res.rowCount} characters.`);
  } catch (err) {
    console.error("Error executing query", err.stack);
    process.exit(1);
  } finally {
    await client.end(); // Crucial: Closes connection so the Cron can terminate
    process.exit(0); // Crucial: Signals Railway the job is safely finished
  }
}

decreaseStats();
