import pg from "pg";

// Railway automatically injects DATABASE_URL if linked
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });

async function decreaseStats() {
  try {
    await client.connect();

    // The query safely deducts points, prevents negative stats,
    // and updates status to 'DEAD' if either stat reaches 0.
    const query = `
      UPDATE "Character"
      SET 
        "hunger" = CASE 
          WHEN "hunger" - 0.1984 <= 0 THEN 0 
          ELSE "hunger" - 0.1984 
        END,
        "thirst" = CASE 
          WHEN "thirst" - 0.5208 <= 0 THEN 0 
          ELSE "thirst" - 0.5208 
        END,
        "status" = CASE 
          WHEN "hunger" - 0.1984 <= 0 OR "thirst" - 0.5208 <= 0 THEN 'DEAD'
          ELSE "status"
        END
      WHERE "status" = 'ALIVE' 
        AND ("hunger" > 0 OR "thirst" > 0);
    `;

    const res = await client.query(query);
    console.log(`Successfully processed stats for ${res.rowCount} characters.`);
  } catch (err) {
    console.error("Error executing query", err.stack);
    process.exit(1);
  } finally {
    await client.end();
    process.exit(0);
  }
}

decreaseStats();
