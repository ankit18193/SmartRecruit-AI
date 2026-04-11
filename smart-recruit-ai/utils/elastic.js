const { Client } = require("@elastic/elasticsearch");

const client = new Client({
  node: "http://elasticsearch:9200",
  maxRetries: 5,
  requestTimeout: 60000,
});

// 🔥 CREATE INDEX
async function createJobIndex() {
  const indexExists = await client.indices.exists({ index: "jobs" });

  if (!indexExists) {
    await client.indices.create({
      index: "jobs",
      body: {
        mappings: {
          properties: {
            title: { type: "text" },
            description: { type: "text" },
            requiredSkills: { type: "text" },
            experienceRequired: { type: "integer" },
          },
        },
      },
    });

    console.log("✅ Job index created");
  }
}

module.exports = { client, createJobIndex };