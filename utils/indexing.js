import pkg from "hnswlib-node"; // Import the HNSW library
const { HierarchicalNSW } = pkg;
import fillerMap from "./fillerMap.js";
import { convertToEmbedding } from "./embedding.js";

/**
 * Search the sentence in the indexing and return the nearest neighbors.
 *
 * @param {string} sentences - The sentence to search in a list of sentences
 * @param {Object} model - The model to use for the conversion
 * @param {Object} indexing - The indexing to use for the search
 * @param {number} nearestNeighbors - The number of nearest neighbors to return
 * @param {boolean} debug - Whether to print debug information
 * @returns - The nearest neighbors which contains distances and IDs with the embedding.
 */
export async function vectorSearch(
  sentences,
  model,
  indexing,
  nearestNeighbors,
  debug = false
) {
  // Convert the sentence to an embedding.
  const queryVector = await convertToEmbedding(model, sentences, debug);

  const start = performance.now();

  const result = indexing.searchKnn(queryVector[0], nearestNeighbors);
  if (debug) {
    console.log(`\nSearch took ${performance.now() - start} milliseconds.`);
  }

  return { ...result, embedding: queryVector[0] };
}

/**
 * Return the matched filler.
 *
 * @param {Object} indexing - The indexing to use for the search
 * @param {Object} model - The model to use for the conversion
 * @param {string} text - The text to search
 * @param {number} nearestNeighbors - The number of nearest neighbors to return
 * @param {boolean} debug - Whether to print debug information
 * @returns - The matched filler
 */
export async function returnMatchedFiller(
  indexing,
  model,
  text,
  nearestNeighbors,
  debug
) {
  let result = await vectorSearch(
    [text],
    model,
    indexing,
    nearestNeighbors,
    debug
  );

  let start = performance.now();

  const fillers = result.neighbors.map((id) => {
    return fillerMap.get(getFillerID(id));
  });

  if (debug) {
    console.log(
      `\nSearching post processing took ${
        performance.now() - start
      } milliseconds (ie. converting embedding ID into fillerText value).`
    );
  }
  return { ...result, fillers };
}

/**
 * Build the indexing.
 *
 * @param {string} path - The path to save the indexing
 * @param {number} numDimensions - The number of dimensions
 * @param {number} maxElements - The maximum number of elements
 * @param {boolean} debug - Whether to print debug information
 * @returns - The indexing
 */
export function buildIndexing(path, numDimensions, maxElements, debug = false) {
  const start = performance.now();

  const indexing = new HierarchicalNSW("cosine", numDimensions);
  indexing.initIndex(maxElements);

  indexing.writeIndexSync(path);

  if (debug) {
    console.log(
      `\nBuilding Index took ${performance.now() - start} milliseconds.`
    );
  }
  return indexing;
}

/**
 * Add the Embeddings to the indexing.
 *
 * @param {string} path - The path to save the indexing.
 * @param {Object} indexing - The indexing to add the point to
 * @param {array} embedding - The embedding to add
 * @param {number} ID - The ID to add
 * @param {boolean} debug - Whether to print debug information
 */
export function addToIndex(path, indexing, embedding, ID, debug) {
  const start = performance.now();

  indexing.addPoint(embedding, ID);
  indexing.writeIndexSync(path);

  if (debug) {
    console.log(
      `\nAdd to index took ${performance.now() - start} milliseconds.`
    );
  }
}


/**
 * Add the Bulks Embeddings to the indexing.
 *
 * @param {string} path - The path to save the indexing.
 * @param {Object} indexing - The indexing to add the point to
 * @param {array} embedding - The embedding to add
 * @param {number} ID - The ID to add
 * @param {boolean} debug - Whether to print debug information
 */
 export function addBulkToIndex(path, indexing, embeddings, IDs, debug) {
  const start = performance.now();

  embeddings.forEach((embedding,index) => {
    indexing.addPoint(embedding, IDs[index]);
  });
  indexing.writeIndexSync(path);

  if (debug) {
    console.log(
      `\nAdd Bulk ${embeddings.length} to index took ${performance.now() - start} milliseconds.`
    );
  }
}

/**
 * Delete the Embeddings to the indexing.
 *
 * @param {string} path - The path to save the indexing.
 * @param {Object} indexing - The indexing to add the point to
 * @param {number} ID - The ID to add
 * @param {boolean} debug - Whether to print debug information
 */
export function deleteFromIndex(path, indexing, ID, debug) {
  const start = performance.now();
  try {
    indexing.markDelete(ID);
    indexing.writeIndexSync(path);
  } catch (e) {
    console.log(e);
  }

  if (debug) {
    console.log(
      `\nDelete from index took ${performance.now() - start} milliseconds.`
    );
  }
}

/**
 * Build the indexing.
 *
 * @param {string} path - The number of dimensions
 * @param {number} numDimensions - The number of dimensions
 * @param {number} maxElements - The maximum number of elements
 * @param {boolean} debug - Whether to print debug information
 * @returns - The indexing
 */
export async function loadIndexFromFile(
  path,
  numDimensions,
  maxElements,
  debug = false
) {
  const start = performance.now();

  // Load index data from file
  const indexing = new HierarchicalNSW("cosine", numDimensions);
  indexing.readIndexSync(path, true);
  indexing.resizeIndex(maxElements);
  if (debug) {
    console.log(
      `\nLoading Index took ${performance.now() - start} milliseconds.`
    );
  }

  return indexing;
}

/**
 * Create an ID for each page.
 *
 * @param {number} index - The index of the page
 * @param {number} fillerID - The filler ID
 * @returns - The ID
 */
export function createID(index, fillerID) {
  const id = index * 100 + fillerID;
  return id;
}

/**
 * Get the filler ID from the ID.
 *
 * @param {number} id - The ID
 * @returns - The filler ID
 */
export function getFillerID(id) {
  return id % 100;
}
