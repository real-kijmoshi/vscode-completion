const vscode = require('vscode');
const completion = require('./completion');

function activate(context) {
    console.log('Activating inline completion provider');
    const provider = vscode.languages.registerInlineCompletionItemProvider({ pattern: '**' }, {
        async provideInlineCompletionItems(document, position, context, token) {
            console.log('Providing inline completion items');
            try {
                const linePrefix = document.lineAt(position).text.substr(0, position.character);
                const response = await completion(document, position, linePrefix);
               
                if(response === "") {
                    return [];
                }
               
                return [new vscode.InlineCompletionItem(response)];
               
            } catch (error) {
                console.error('Error providing inline completion:', error);
                return [];
            }
        }
    });
    context.subscriptions.push(provider);
    console.log('Inline completion provider activated');
}

function deactivate() {
    console.log('Deactivating inline completion provider');
}

module.exports = {
    activate,
    deactivate
};