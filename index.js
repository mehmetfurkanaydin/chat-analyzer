"use strict";

const fs = require("fs");
const whatsapp = require("whatsapp-chat-parser");

const [, , filepath] = process.argv;

const fileContents = fs.readFileSync(filepath, "utf8");

const { Client } = require("@elastic/elasticsearch");
const client = new Client({
  node: "http://localhost:9200",
});

async function run() {
  await client.indices.create(
    {
      index: "messages",
      body: {
        mappings: {
          properties: {
            author: { type: "keyword" },
            message: { type: "text" },
            date: { type: "date" },
          },
        },
      },
    },
    { ignore: [400] }
  );

  const dataset = await whatsapp.parseString(fileContents);

  const body = dataset.flatMap((doc) => [
    { index: { _index: "messages" } },
    doc,
  ]);

  const { body: bulkResponse } = await client.bulk({ refresh: true, body });

  if (bulkResponse.errors) {
    const erroredDocuments = [];
    // The items array has the same order of the dataset we just indexed.
    // The presence of the `error` key indicates that the operation
    // that we did for the document has failed.
    bulkResponse.items.forEach((action, i) => {
      const operation = Object.keys(action)[0];
      if (action[operation].error) {
        erroredDocuments.push({
          // If the status is 429 it means that you can retry the document,
          // otherwise it's very likely a mapping error, and you should
          // fix the document before to try it again.
          status: action[operation].status,
          error: action[operation].error,
          operation: body[i * 2],
          document: body[i * 2 + 1],
        });
      }
    });
    console.log(erroredDocuments);
  }

  const { body: count } = await client.count({ index: "messages" });
  console.log(count);
}

run().catch(console.log);
