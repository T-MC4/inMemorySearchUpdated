import {
    extractPageContentAndMetadata,
    checkFileExists,
} from '../utils/ingestion.js';
import { loadModel, convertToEmbedding } from '../utils/embedding.js';
import {
    buildIndexing,
    returnMatchedFiller,
    createID,
    addToIndex,
    addBulkToIndex,
    addBulkToContentsIndex,
    loadIndexFromFile,
} from '../utils/indexing.js';

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

// Read all the files in the directory and return the content and move the files to the processed folder.
const extractionResult = await extractPageContentAndMetadata(
    dataProcessingPath,
    dataProcessedPath,
    'json',
    DEBUG
);

// Extract valid values and assign empty if not valid
const { fillersIDs = [], contents = [] } = extractionResult || {};

// Check if the indexing exists
const is_existing_index = await checkFileExists(indexingPath);

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
// Get the current count
counterID = indexing.getCurrentCount();

console.log('Total Text:', contents.length);
// if there is any content, add it to the indexing
if (contents.length) {
    const start = performance.now();
    const newContentIDs = [];
    const newIDs = [];

    // Convert the text to an embedding.
    const embeddings = await convertToEmbedding(model, contents, DEBUG);

    // Add the embedding to the indexing and append to the contentsMap
    for (let i = 0; i < fillersIDs.length; i++) {
        counterID += 1;
        newContentIDs.push([counterID, contents[i]]);
        newIDs.push(createID(counterID, fillersIDs[i]));
    }
    console.log(newIDs);

    await addBulkToContentsIndex(contentsMapPath, newContentIDs, DEBUG);
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
const sentence = `my wife left me`;
const nearestNeighbors = 5; // the number of nearest neighbors to search.

const results = await returnMatchedFiller(
    indexing,
    model,
    sentence,
    nearestNeighbors,
    DEBUG
    // contentsMapPath
);
console.log(results);

// console.table(results);
