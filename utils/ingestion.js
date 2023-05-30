import fs from "fs";
import path from "path";

export function readFileContent(filePath) {
	return new Promise((resolve, reject) => {
		fs.readFile(filePath, "utf-8", (err, data) => {
			if (err) {
				reject(err);
			} else {
				resolve(data);
			}
		});
	});
}

export async function getFilesInDirectory(directoryPath, fileType) {
	const files = await fs.promises.readdir(directoryPath);
	const filteredFiles = files.filter(
		(file) => path.extname(file).toLowerCase() === `.${fileType}`
	);
	return filteredFiles;
}

export async function checkFileExists(filePath) {
	try {
		fs.accessSync(filePath);
		return true;
	} catch (error) {
		return false;
	}
}

/**
 * Read all the files in the directory and return the content.
 *
 * @param {string} baseDir - The base directory
 * @param {string} processedBaseDir - The directory to move the files to once they are processed.
 * @param {string} extension - The extension of the files to read.
 * @param {boolean} debug - Whether to print debug information
 * @returns - Array which contains the page content and the ID.
 */
export async function extractPageContentAndMetadata(
	baseDir,
	processedBaseDir,
	extension,
	debug = false
) {
	let start = performance.now();
	// Load data to build the indexing
	const arrayOfJSONFiles = await getFilesInDirectory(baseDir, extension);

	let jsonContent = [];

	// Process all the new files
	for (const fileName of arrayOfJSONFiles) {
		// Read the contents
		const filePath = path.join(baseDir, fileName);
		const content = await readFileContent(filePath);
		jsonContent = [...jsonContent, ...JSON.parse(content)];
		// Move file to 'processed' folder indicate it's done
		const destPath = path.join(processedBaseDir, fileName);
		fs.renameSync(filePath, destPath);
		if (debug) {
			console.log(`${fileName} File Read & Moved successfully`);
		}
	}

	// Load the existing index
	const contents = [];
	const fillersIDs = [];

	// Update the existing index
	jsonContent.forEach((entry) => {
		contents.push(entry.pageContent);
		fillersIDs.push(entry.metadata.fillerID);
	});

	if (debug) {
		console.log(
			`\nReading all files took ${performance.now() - start} milliseconds.`
		);
	}
	return {
		contents,
		fillersIDs,
	};
}
