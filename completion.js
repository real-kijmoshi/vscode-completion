const ollama = require('ollama');
const fetch = require('node-fetch');
const vscode = require('vscode');

const LAMA_URL = "http://127.0.0.1:11434";

// CHECK IF LAMA IS ONLINE
fetch(LAMA_URL).then(() => {
    vscode.window.showInformationMessage('[kijmoshi-codex] Lama is online');
}).catch(() => {
    vscode.window.showErrorMessage('Lama is offline');
});

function extractCodeBulletPoints(document, position) {
    const fullText = document.getText();
    const currentLine = position.line;
    
    const importRegex = /import\s+.*?from\s+['"].*?['"]/g;
    const functionRegex = /function\s+(\w+)\s*\(/g;
    const varRegex = /(const|let|var)\s+(\w+)\s*=/g;

    const imports = [...fullText.matchAll(importRegex)].map(match => match[0]);
    const functions = [...fullText.matchAll(functionRegex)].map(match => match[1]);
    const variables = [];

    for (let i = 0; i <= currentLine; i++) {
        const lineText = document.lineAt(i).text;
        const vars = [...lineText.matchAll(varRegex)];
        variables.push(...vars.map(match => match[2]));
    }

    return {
        imports: imports,
        functions: functions,
        variables: variables
    };
}

const completion = async (document, position, linePrefix) => {
    const codeBulletPoints = extractCodeBulletPoints(document, position);
    
    const prompt = `
You are an AI code completion tool specialized in JavaScript. Your task is to provide intelligent and context-aware code suggestions. Analyze the given code snippet and provide ONLY the completion that is syntactically correct, follows best practices, and is consistent with the existing code style and logic.

Basic JavaScript Knowledge:
1. Variables and Data Types:
   - Use 'const' for values that won't be reassigned, 'let' for mutable variables, and avoid 'var'.
   - Common types: string, number, boolean, null, undefined, object, array, function.
   - Template literals use backticks: \`Hello, \${name}!\`

2. Functions:
   - Function declaration: function functionName(params) { ... }
   - Arrow functions: const functionName = (params) => { ... }
   - Methods in objects: { methodName(params) { ... } }

3. Control Structures:
   - if...else, switch, for loops, while loops, do...while loops
   - Ternary operator: condition ? expressionIfTrue : expressionIfFalse

4. Arrays and Objects:
   - Array methods: map, filter, reduce, forEach, find, some, every
   - Object methods: Object.keys(), Object.values(), Object.entries()
   - Spread operator: [...array], {...object}
   - Destructuring: const { prop1, prop2 } = object; const [first, second] = array;

5. Asynchronous JavaScript:
   - Promises: new Promise((resolve, reject) => { ... })
   - Async/Await: async function name() { await promiseFunction(); }
   - fetch API for HTTP requests

6. ES6+ Features:
   - Classes: class ClassName { constructor() { ... } methodName() { ... } }
   - Modules: import and export statements
   - Optional chaining: object?.property?.method?.()
   - Nullish coalescing: value ?? defaultValue

7. Common Built-in Objects and APIs:
   - Math object for mathematical operations
   - Date object for date and time manipulation
   - JSON object for parsing and stringifying JSON data
   - localStorage and sessionStorage for client-side storage
   - console methods for debugging: log, error, warn, table

8. Best Practices:
   - Use meaningful variable and function names
   - Keep functions small and focused on a single task
   - Use camelCase for variables and functions, PascalCase for classes
   - Prefer const over let when the value won't change
   - Use strict equality (===) instead of loose equality (==)
   - Handle errors with try...catch blocks

Current code context:
Imports: ${codeBulletPoints.imports.join(', ')}
Functions: ${codeBulletPoints.functions.join(', ')}
Variables in scope: ${codeBulletPoints.variables.join(', ')}

Guidelines:
1. Complete the code in a way that makes sense given the context and available imports, functions, and variables.
2. Maintain consistent coding style (indentation, naming conventions, etc.).
3. Suggest logical next steps or completions based on common JavaScript patterns and the available context.
4. If appropriate, complete entire statements or blocks of code.
5. Provide ONLY the completion, not the entire code snippet or any explanations.
6. If no meaningful completion can be made, return an empty string.
7. Use modern JavaScript syntax and best practices as outlined in the basic knowledge section.
8. Consider the scope and choose appropriate variable declarations (const, let).
9. If completing a function, consider whether it should be asynchronous based on its likely operations.
10. When suggesting method calls on objects or arrays, prioritize methods that are commonly used in JavaScript.

IMPORTANT: Respond ONLY with the code completion. Do not include any explanations, comments, or the original code.

Here's the code to complete:
${linePrefix}

Completion:`;

    const response = await ollama.default.chat({
        model: "llama3.1",
        messages: [
            {
                role: "system",
                content: "You are a code completion AI. Respond only with code completions, nothing else."
            },
            {
                role: "user",
                content: prompt
            }
        ]
    });

    return response.message.content.trim();
}

module.exports = completion;