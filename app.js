import pg from "pg";

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });

async function decreaseStats() {
  const query = `
    UPDATE "Character"
    SET 
      "hunger" = CASE 
        WHEN "hunger" - 0.0165 <= 0 THEN 0 
        ELSE "hunger" - 0.0165 
      END,
      "thirst" = CASE 
        WHEN "thirst" - 0.1157 <= 0 THEN 0 
        ELSE "thirst" - 0.1157 
      END,
      "status" = CASE 
        WHEN "hunger" - 0.0165 <= 0 OR "thirst" - 0.1157 <= 0 THEN 'DEAD'
        ELSE "status"
      END
    WHERE "status" = 'ALIVE' 
      AND ("hunger" > 0 OR "thirst" > 0);
  `;
  const res = await client.query(query);
  console.log(`Successfully processed stats for ${res.rowCount} characters.`);
}

const KIN_TYPES = [
  {
    // Turtle Type
    breeds: [
      { type: "dragon", influence: 0.2 },
      { type: "turtle", influence: 0.8 },
    ],
    skinColor: "#3292e0",
  },
  {
    // Dragon Type
    breeds: [
      { type: "dragon", influence: 0.8 },
      { type: "turtle", influence: 0.2 },
    ],
    skinColor: "#e03232",
  },
];

async function hatchMysteryEggs() {
  const kin = KIN_TYPES[Math.floor(Math.random() * KIN_TYPES.length)];
  const kinMeta = JSON.stringify(kin);

  const query = `
    BEGIN;

    UPDATE "CharacterObjectState" cos
    SET "isDiscarded" = true,
        "isPickedUp" = false
    FROM "ObjectInstance" oi
    WHERE cos."objectInstanceId" = oi.id
      AND oi."displayName" = 'Mystery Egg'
      AND cos."isPickedUp" = true
      AND cos."isDiscarded" = false
      AND cos."collectedAt" <= NOW() - INTERVAL '3 days';

    INSERT INTO "Kin" (
      "id", "characterId", "name", "sex", "kinMeta", "currentHealth", "currentStamina"
    )
    SELECT
      gen_random_uuid(),
      cos."characterId",
      'Unnamed',
      'male',
      $1::jsonb,
      100,
      50
    FROM "CharacterObjectState" cos
    JOIN "ObjectInstance" oi ON cos."objectInstanceId" = oi.id
    WHERE oi."displayName" = 'Mystery Egg'
      AND cos."isPickedUp" = false
      AND cos."isDiscarded" = true
      AND cos."collectedAt" <= NOW() - INTERVAL '3 days'
      AND NOT EXISTS (
        SELECT 1 FROM "Kin" k WHERE k."characterId" = cos."characterId"
  );

    COMMIT;
  `;
  const res = await client.query(query, [kinMeta]);
  console.log(`Hatched eggs processed.`);
}

async function main() {
  try {
    await client.connect();
    await decreaseStats();
    await hatchMysteryEggs();
  } catch (err) {
    console.error("Error executing query", err.stack);
    process.exit(1);
  } finally {
    await client.end();
    process.exit(0);
  }
}

main();
