const vscode = require('vscode');
const axios = require('axios');
const { exec } = require('child_process');

function createPreviewPanel(documentation, mermaidSyntax) {
    const panel = vscode.window.createWebviewPanel(
        'autodocPreview',
        'Generated Documentation',
        vscode.ViewColumn.Beside,
        { enableScripts: true }
    );

    panel.webview.html = generateHTMLContent(documentation, mermaidSyntax);
}
function generateHTMLContent(documentation, mermaidSyntax) {
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Documentation Preview</title>
            <script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    margin: 20px;
                    padding: 0;
                }
                pre {
                    background-color: #f4f4f4;
                    padding: 10px;
                    border-radius: 5px;
                }
                #mermaid-container {
                    margin-top: 20px;
                }
            </style>
            <script>
                document.addEventListener('DOMContentLoaded', () => {
                    mermaid.initialize({ startOnLoad: true });
                    const diagram = \`${mermaidSyntax}\`;
                    if (diagram) {
                        document.getElementById('mermaid-container').innerHTML = diagram;
                        mermaid.init(undefined, document.querySelectorAll('.mermaid'));
                    }
                });
            </script>
        </head>
        <body>
            <h1>Generated Documentation</h1>
            <div>${documentation.result}</div>
            <div id="mermaid-container" class="mermaid"></div>
        </body>
        </html>
    `;
}

async function handleGenerateAndPreview() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('No active editor found.');
        return;
    }
    const code = editor.document.getText();
    vscode.window.showInformationMessage('Generating documentation...');
    const documentation = await generateDocumentation(code);

    if (!documentation) {
        return;
    }
    const mermaidSyntax = extractMermaidDiagram(documentation);
    if (!mermaidSyntax) {
        vscode.window.showWarningMessage('No Mermaid diagram found in the response.');
    }
    createPreviewPanel(documentation, mermaidSyntax || '');
}

// Generate Documentation using GPT-4 API
async function generateDocumentation(code) {
	const options = {
		method: 'POST',
		url: 'https://chatgpt-42.p.rapidapi.com/gpt4',
		headers: {
			'x-rapidapi-key': '0c26082c28msh1da5935e3d0bf86p1a37c5jsnadc9e484ab8c',
			'x-rapidapi-host': 'chatgpt-42.p.rapidapi.com',
			'Content-Type': 'application/json'
		},
		data: {
			messages: [
				{
					role: 'user',
					content: `Generate comprehensive documentation for the following code:
                    
${code}

Additionally, provide a mermaid js syntax in sequence diagram format to visualize an high level architecture. Return the Mermaid code inside a markdown code block so it preserves formatting. Also kindly format the output according to Atlasian Confluence standards.`
				}
			],
			web_access: false
		}
	};

	try {

		const response = await axios.request(options);
		const gptResponse = response.data;
		// const gptResponse = '# Documentation for LongestPalindromicSubstring Java Code\n\n## Overview\nThe `LongestPalindromicSubstring` class contains a method to find the longest palindromic substring within a given string. A palindromic substring is a sequence of characters that reads the same backward as forward. The implementation uses dynamic programming to efficiently determine the longest palindromic substring.\n\n## Class Structure\n```java\npublic class LongestPalindromicSubstring {\n    public static void main(String[] …Programming Logic]\n    E --> F[Return Longest Palindromic Substring]\n    F --> G[Output Result]\n```\n\n### Explanation of the Mermaid Diagram\n- The diagram illustrates the flow of the program:\n  - The user provides input (a string).\n  - The `LongestPalindromicSubstring` class processes the input through the `main` method.\n  - The `calculate` method implements the logic to find the longest palindromic substring using dynamic programming.\n  - Finally, the result is returned and output to the user.'
		console.log(gptResponse);
		return gptResponse; // GPT-4 response
	} catch (error) {
		console.error('Error generating documentation:', error);
		vscode.window.showErrorMessage('Failed to generate documentation.');
		return null;
	}
}

// Upload Documentation and Diagram to Confluence
async function uploadToConfluence(content, diagramPath) {
	const spaceKey = 'SD';
	const parentPageId = '131371'; // Replace with actual parent page ID

	const diagramBase64 = fs.readFileSync(diagramPath, { encoding: 'base64' });

	const payload = {
		space: {
			key: spaceKey
		},
		status: 'current',
		title: 'Generated Documentation',
		type: 'page',
		ancestors: [
			{
				id: parentPageId
			}
		],
		body: {
			storage: {
				value: `
<p>${content}</p>
<p>Diagram:</p>
<img src="data:image/svg+xml;base64,${diagramBase64}" />
`,
				representation: 'storage'
			}
		}
	};

	try {
		const response = await axios.post(
			'https://afzaldev2.atlassian.net/wiki/rest/api/content',
			payload,
			{
				headers: {
					Authorization: `Basic ${Buffer.from("afzaldev2@gmail.com:ATATT3xFfGF0AXDeRhct5NNiR9QTfPDP67UeHRslksTDcJAdZYekYI5uNrEImAEO_pXX_8ZkdDSqFD7Lm1qOZTRRac9SGb4k4v6aEg-2lfp3nssHTzpB4GpK1pIHf-d0INKukMOpOEdAFTI-Im7Ui6NECTryNrcpOWmuCNKR0f7tPKsk5x1T3-I=5DE57CCE").toString('base64')}`,
					'Content-Type': 'application/json',
					Accept: 'application/json'
				}
			}
		);

		return response.data;
	} catch (error) {
		console.error('Error uploading to Confluence:', error);
		vscode.window.showErrorMessage('Failed to upload to Confluence.');
		return null;
	}
}

async function uploadToConfluence2(content) {
	const spaceKey = 'SD';
	const parentPageId = '131371'; // Replace with actual parent page ID

	// const diagramBase64 = fs.readFileSync(diagramPath, { encoding: 'base64' });

	const payload = {
		space: {
			key: spaceKey
		},
		status: 'current',
		title: 'Generated Documentation' + Math.floor(Math.random() * 1000),
		type: 'page',
		ancestors: [
			{
				id: parentPageId
			}
		],
		body: {
			storage: {
				value: `
<p>${content}</p>
`,
				representation: 'storage'
			}
		}
	};

	try {
		const response = await axios.post(
			'https://afzaldev2.atlassian.net/wiki/rest/api/content',
			payload,
			{
				headers: {
					Authorization: `Basic ${Buffer.from("afzaldev2@gmail.com:ATATT3xFfGF0AXDeRhct5NNiR9QTfPDP67UeHRslksTDcJAdZYekYI5uNrEImAEO_pXX_8ZkdDSqFD7Lm1qOZTRRac9SGb4k4v6aEg-2lfp3nssHTzpB4GpK1pIHf-d0INKukMOpOEdAFTI-Im7Ui6NECTryNrcpOWmuCNKR0f7tPKsk5x1T3-I=5DE57CCE").toString('base64')}`,
					'Content-Type': 'application/json',
					Accept: 'application/json'
				}
			}
		);

		return response.data;
	} catch (error) {
		console.error('Error uploading to Confluence:', error);
		vscode.window.showErrorMessage('Failed to upload to Confluence.');
		return null;
	}
}

// Activate Command
function activate2(context) {
	let disposable = vscode.commands.registerCommand('autodoc.autodoc', async () => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			vscode.window.showErrorMessage('No active editor found.');
			return;
		}

		const code = editor.document.getText();
		vscode.window.showInformationMessage('Generating documentation...');
		const gptResponse = await generateDocumentation(code);
		//const gptResponse = '# Documentation for LongestPalindromicSubstring Java Code\n\n## Overview\nThe `LongestPalindromicSubstring` class contains a method to find the longest palindromic substring within a given string. A palindromic substring is a sequence of characters that reads the same backward as forward. The implementation uses dynamic programming to efficiently determine the longest palindromic substring.\n\n## Class Structure\n```java\npublic class LongestPalindromicSubstring {\n    public static void main(String[] …Programming Logic]\n    E --> F[Return Longest Palindromic Substring]\n    F --> G[Output Result]\n```\n\n### Explanation of the Mermaid Diagram\n- The diagram illustrates the flow of the program:\n  - The user provides input (a string).\n  - The `LongestPalindromicSubstring` class processes the input through the `main` method.\n  - The `calculate` method implements the logic to find the longest palindromic substring using dynamic programming.\n  - Finally, the result is returned and output to the user.'
		//const gptResponse = "# Documentation for SelectionSort Class\n\n## Overview\nThe `SelectionSort` class implements the selection sort algorithm, which is a simple and intuitive sorting algorithm. It sorts an array of integers in ascending order by repeatedly selecting the minimum element from the unsorted portion of the array and swapping it with the first unsorted element.\n\n## Class Structure\n\n### Fields\n- `int n`: The number of elements in the array. In this implementation, it is set to 5.\n- `int[] arr`: An array of …rted: `{ 11, 12, 22, 25, 64 }`\n\n## Usage\nTo use the `SelectionSort` class, simply run the `main` method. The sorted array will be printed to the console.\n\n---\n\n## Mermaid Diagram\n\n```mermaid\nclassDiagram\n    class SelectionSort {\n        +int n\n        +int[] arr\n        +main(String[] args)\n        +printArray()\n        +selectionSort()\n    }\n```\n\nThis diagram represents the `SelectionSort` class, its fields, and its methods, providing a high-level overview of its structure and functionality."
		if (!gptResponse) {
			return;
		}

		// Extract diagram text if present
		console.log("Printing the type of ");

		console.log(typeof gptResponse, gptResponse);

		// Ask user to upload the documentation
		vscode.window.showInformationMessage('Documentation generated. Do you want to upload it to Confluence?', 'Yes', 'No')
			.then(async (selection) => {
				if (selection === 'Yes') {
					vscode.window.showInformationMessage('Uploading to Confluence...');
					// const result = await uploadToConfluence(gptResponse.trim(), diagramPath);
					// destructure the response and only use the result
					console.log("GPT Response: ", gptResponse.result);
					
					const result2 = await uploadToConfluence2(gptResponse.result);


					if (result2) {
						vscode.window.showInformationMessage('Documentation uploaded successfully.');
					}
					else {
						vscode.window.showErrorMessage('Failed to upload documentation.');
					}
				}
			});
	});

	context.subscriptions.push(disposable);
}
function activate(context) {
    let disposable = vscode.commands.registerCommand('autodoc.autodoc', handleGenerateAndPreview);

    context.subscriptions.push(disposable);
}
function extractMermaidDiagram(gptResponse) {
	try {
		// Ensure gptResponse is a string
		if (typeof gptResponse !== 'string') {
			gptResponse = JSON.stringify(gptResponse);
		}

		// Regular expression to match Mermaid code blocks
		const mermaidRegex = /```mermaid([\s\S]*?)```/;

		// Extract the diagram content
		const match = gptResponse.match(mermaidRegex);
		console.log("Printing the match");
		console.log(match);
		
		if (match && match[1]) {
			const mermaidDiagram = match[1];
			console.log('Extracted Mermaid Diagram:', mermaidDiagram);
			return mermaidDiagram;
		} else {
			console.error('No Mermaid diagram found in the response.');
			return null;
		}
	} catch (error) {
		console.log(error);
		console.error('Error extracting Mermaid diagram:', error);
		return null;
	}
}

// Deactivate Extension
function deactivate() { }

module.exports = {
	activate,
	deactivate
};
