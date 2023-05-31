import { checkFileExists } from '../utils/ingestion.js';
import { loadIndexFromFile, deleteFromIndex } from '../utils/indexing.js';

export async function deleteEmbeddings(indexingPath, idToDelete) {
    const DEBUG = true;
    const numDimensions = 512; // the length of data point vector that will be indexed

    let indexing;
    if (await checkFileExists(indexingPath)) {
        // Load the existing index
        indexing = await loadIndexFromFile(indexingPath, numDimensions, DEBUG);
    } else {
        console.log('Nothing to delete');
    }

    // Specific ID to delete by (reference ./docs/indexing/contentsMap.json for the specific number)
    deleteFromIndex(indexingPath, indexing, idToDelete, DEBUG);
}
