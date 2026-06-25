import cron from "node-cron";
import pg from "pg";

// Railway automatically injects DATABASE_URL if linked
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });

async function decreaseStats() {
  try {
    await client.connect();
    // Adjust the values (-5, -10, etc.) to fit your game's balance
    const query = `
      UPDATE "Character" 
      SET "Hunger" = GREATEST(0, "Hunger" - 5), 
          "Thirst" = GREATEST(0, "Thirst" - 8);
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

cron.schedule("* * * * *", () => {
  decreaseStats();
});
