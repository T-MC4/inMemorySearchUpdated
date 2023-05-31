import { checkFileExists } from '../utils/ingestion.js';
import { loadModel } from '../utils/embedding.js';
import {
    loadIndexFromFile,
    buildIndexing,
    addEmbeddings,
    returnMatchedFiller,
} from '../utils/indexing.js';
import { deleteEmbeddings } from './deleteUsingID.js';

// ------------------------------------------------------------------------------------------- //
// IMPLEMENT THIS INTO AIRCHAT SO THAT IT ONLY RUNS ONCE (IDEALLY BEFORE THE CALL EVEN STARTS) //
// ------------------------------------------------------------------------------------------- //

const DEBUG = true;
const numDimensions = 512; // the length of data point vector that will be indexed.
const maxElements = 100000; // the maximum number of data points.
const dataProcessingPath = './data/to_process';
const dataProcessedPath = './data/processed';
const indexingPath = './data/indexing/vectorIndex.hnsw';
const contentsMapPath = './data/indexing/contentsMap.json';
let counterID = 1;
let indexing;

const model = await loadModel(DEBUG);

// Check if the indexing exists
const is_existing_index = await checkFileExists(indexingPath);

// Load the existing index of create a new one
if (is_existing_index) {
    console.log('Static Index File Exists - Loading File');
    // Load the existing index
    indexing = await loadIndexFromFile(
        indexingPath,
        numDimensions,
        maxElements,
        DEBUG
    );
} else {
    console.log('No Index File - Building From Scratch');
    // Build the new indexing
    indexing = await buildIndexing(
        indexingPath,
        numDimensions,
        maxElements,
        DEBUG
    );
}

// Add any embeddings grabbed from the to_process folder earlier
await addEmbeddings(
    model,
    dataProcessingPath,
    dataProcessedPath,
    indexingPath,
    indexing,
    DEBUG,
    contentsMapPath
);

// ----------------------------------------------------- //
// MAKE QUERIES TO THE VECTOR STORE (See Examples Below) //
// ----------------------------------------------------- //

// Perform a nearest neighbor search
const sentence = `my wife left me`;
const nearestNeighbors = 5; // the number of nearest neighbors to search.

const results = await returnMatchedFiller(
    indexing,
    model,
    sentence,
    nearestNeighbors,
    DEBUG
    // contentsMapPath // This is optional Search post processing to append the contents text to the matched embeddings
);
console.log(results);
// console.table(results);

// ------------------------------------------------------------ //
// DELETE EMBEDDINGS FROM THE VECTOR STORE (See Examples Below) //
// ------------------------------------------------------------ //

const staticIndexPath = './data/indexing/index.hnsw';
const idToDelete = 0; // Reference ./docs/indexing/contentsMap.json for the specific number
await deleteEmbeddings(staticIndexPath, idToDelete);
