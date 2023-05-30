import {
	extractPageContentAndMetadata,
	checkFileExists,
} from "../utils/ingestion.js";
import { loadModel, convertToEmbedding } from "../utils/embedding.js";
import {
	buildIndexing,
	returnMatchedFiller,
	createID,
	addToIndex,
	addBulkToIndex,
	loadIndexFromFile,
} from "../utils/indexing.js";

// ------------------------------------------------------------------------------------------- //
// IMPLEMENT THIS INTO AIRCHAT SO THAT IT ONLY RUNS ONCE (IDEALLY BEFORE THE CALL EVEN STARTS) //
// ------------------------------------------------------------------------------------------- //

const DEBUG = true;
const numDimensions = 512; // the length of data point vector that will be indexed.
const maxElements = 100000; // the maximum number of data points.
const dataProcessingPath = "./data/to_process";
const dataProcessedPath = "./data/processed";
const indexingPath = "./data/indexing/index.hnsw";
let counterID = 1;
let indexing;

const model = await loadModel(DEBUG);

// Read all the files in the directory and return the content and move the files to the processed folder.
const { fillersIDs, contents } = await extractPageContentAndMetadata(
	dataProcessingPath,
	dataProcessedPath,
	"json",
	DEBUG
);

const is_existing_index = await checkFileExists(indexingPath);
// Check if the indexing exists
if (is_existing_index) {
	// Load the existing index
	indexing = await loadIndexFromFile(
		indexingPath,
		numDimensions,
		maxElements,
		DEBUG
	);
} else {
	// Build the new indexing
	indexing = await buildIndexing(
		indexingPath,
		numDimensions,
		maxElements,
		DEBUG
	);
}
// Get the current count
counterID = indexing.getCurrentCount();

console.log("Total Text:", contents.length);
// if there is any content, add it to the indexing
if (contents.length) {
	const start = performance.now();
	// Convert the text to an embedding.
	const embeddings = await convertToEmbedding(model, contents, DEBUG);
	// Add the embedding to the indexing
	const newIDs = fillersIDs.map((id) => {
		counterID += 1;
		return createID(counterID, id);
	});

	addBulkToIndex(indexingPath, indexing, embeddings, newIDs, DEBUG);

	if (DEBUG) {
		console.log(
			`\nIndexing took ${performance.now() - start} milliseconds. shape ${
				embeddings.length
			}`
		);
	}
}

// ----------------------------------------------------- //
// MAKE QUERIES TO THE VECTOR STORE (See Examples Below) //
// ----------------------------------------------------- //

// Perform a nearest neighbor search
const sentence = `I tensorflow/core/platform/cpu_feature_guard.cc:193] This TensorFlow binary
  is optimized with oneAPI Deep Neural Network Library (oneDNN) to use the following
  CPU instructions in performance-critical operations:  AVX2 FMA
  I tensorflow/core/platform/cpu_feature_guard.cc:193] This TensorFlow binary
  is optimized with oneAPI Deep Neural Network Library (oneDNN) to use the following
  CPU instructions in performance-critical operations:  AVX2 FMAoperations:  AVX2 FMA`;
const sentence2 = `Test`;
const sentence3 = `Yeah dude`;
const sentence4 = `I tensorflow/core/platform/cpu_feature_guard.cc:193] This TensorFlow binary
is optimized with oneAPI Deep Neural Network Library (oneDNN) to use the following
CPU instructions in performance-critical operations:  AVX2 FMA
I tensorflow/core/platform/cpu_feature_guard.cc:193] This TensorFlow binary
is optimized with oneAPI Deep Neural Network Library (oneDNN) to use the following
CPU instructions in performance-critical operations:  AVX2 FMAoperations:  AVX2 FMA. 
I tensorflow/core/platform/cpu_feature_guard.cc:193] This TensorFlow binary
  is optimized with oneAPI Deep Neural Network Library (oneDNN) to use the following
  CPU instructions in performance-critical operations:  AVX2 FMA
  I tensorflow/core/platform/cpu_feature_guard.cc:193] This TensorFlow binary
  is optimized with oneAPI Deep Neural Network Library (oneDNN) to use the following
  CPU instructions in performance-critical operations:  AVX2 FMAoperations:  AVX2 FMA`;

const nearestNeighbors = 1; // the number of nearest neighbors to search.

const results = await returnMatchedFiller(
	indexing,
	model,
	sentence,
	nearestNeighbors,
	DEBUG
);
const results2 = await returnMatchedFiller(
	indexing,
	model,
	sentence2,
	nearestNeighbors,
	DEBUG
);
const results3 = await returnMatchedFiller(
	indexing,
	model,
	sentence3,
	nearestNeighbors,
	DEBUG
);
const results4 = await returnMatchedFiller(
	indexing,
	model,
	sentence4,
	nearestNeighbors,
	DEBUG
);

console.log(
	results.fillers,
	results2.fillers,
	results3.fillers,
	results4.fillers
);
