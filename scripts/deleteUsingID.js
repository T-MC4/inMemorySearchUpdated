import { checkFileExists } from "../utils/ingestion.js";
import { loadIndexFromFile, deleteFromIndex } from "../utils/indexing.js";

const DEBUG = true;
const numDimensions = 512; // the length of data point vector that will be indexed
const indexingPath = "./data/indexing/index.hnsw";

let indexing;
if (await checkFileExists(indexingPath)) {
  // Load the existing index
  indexing = await loadIndexFromFile(indexingPath, numDimensions, DEBUG);
} else {
  console.log("Nothing to delete");
}

const ID = 1234; // Specific ID to delete by

deleteFromIndex(indexingPath, indexing, ID, DEBUG);
