import React from "react";
import MonacoEditor from "react-monaco-editor";
import "core-js/stable";
import "regenerator-runtime/runtime";
import {OutlineModel} from "monaco-editor/esm/vs/editor/contrib/documentSymbols/outlineModel"
import {jinja2conf, jinja2lang} from "./Jinja";
import {useSelector} from "react-redux";
import {Col, Row} from "react-bootstrap";

const getSymbolsForPosition = async (model, position, include_symbols) => {
    return OutlineModel.create(model, {
        isCancellationRequested: false,
        onCancellationRequested: function (a) {
            return null;
        }
    }).then(symbols => {
        symbols = symbols.asListOfDocumentSymbols();
        // console.log(symbols);
        symbols = symbols.filter(symbol =>
            symbol.range.containsPosition(position)
        );
        symbols = symbols.map(symbol => {
            // console.log(symbol);
            if (symbol.kind === 17) { // List
                if (include_symbols) {
                    return `[] ${symbol.name}`;
                } else {
                    return `${symbol.name}[0]`
                }
            } else if (symbol.kind === 18 || symbol.kind === 1) { // object
                if (include_symbols) {
                    return `{} ${symbol.name}`;
                } else {
                    return `${symbol.name}`
                }
            } else {
                return symbol.name;
            }
        });
        return symbols;
    });
};

export default function Editors(props) {
    const {jsonEditorRef, templateEditorRef} = props;
    const settings = useSelector(state => state.settings);
    const editorState = useSelector(state => state.editors);
    const options = {
        wordWrap: settings.wordWrap,
        minimap: {enabled: settings.minimap},
        scrollBeyondLastLine: false,
        selectOnLineNumbers: true,
        roundedSelection: false,
        readOnly: false
    };

    function initTemplateEditor(monaco) {
        monaco.languages.register({id: "jinja2"});
        monaco.languages.setLanguageConfiguration("jinja2", jinja2conf);
        monaco.languages.setMonarchTokensProvider("jinja2", jinja2lang);
        monaco.languages.registerCompletionItemProvider("jinja2", {
            provideCompletionItems: (model, position) => {
                return {
                    suggestions: [
                        {
                            label: 'input_json',
                            kind: monaco.languages.CompletionItemKind.Function,
                            insertText: 'input_json',
                            documentation: "The base of the object in the json editor"
                        },
                        {
                            label: 'ifelse',
                            kind: monaco.languages.CompletionItemKind.Snippet,
                            insertText: [
                                '{% if (${1:condition}) %}',
                                '\t$0',
                                '{% else %}',
                                '\t',
                                '{% endif %}'
                            ].join('\n'),
                            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                            documentation: 'If-Else Statement'
                        }, {
                            label: 'if',
                            kind: monaco.languages.CompletionItemKind.Snippet,
                            insertText: [
                                '{% if (${1:condition}) %}',
                                '\t$0',
                                '{% endif %}'
                            ].join('\n'),
                            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                            documentation: 'If Statement'
                        }, {
                            label: 'for',
                            kind: monaco.languages.CompletionItemKind.Snippet,
                            insertText: [
                                '{% for ${1:value} in ${2:iterable} %}',
                                '\t$0',
                                '{% endfor %}'
                            ].join('\n'),
                            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                            documentation: 'For Statement'
                        },
                        {
                            label: 'set',
                            kind: monaco.languages.CompletionItemKind.Snippet,
                            insertText: '{% set ${1:name} = ${2:value} %}\n',
                            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                            documentation: 'Set Statement'
                        },
                        {
                            label: 'do',
                            kind: monaco.languages.CompletionItemKind.Snippet,
                            insertText: '{% do ${1:something} %}\n',
                            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                            documentation: 'Do Statement'
                        }
                    ]
                };
            }
        });
        monaco.languages.registerCompletionItemProvider("jinja2", {
            triggerCharacters: ["."],
            provideCompletionItems: (model, position, context, token) => {
                let path = model.getValueInRange({
                    startLineNumber: position.lineNumber,
                    startColumn: 0,
                    endLineNumber: position.lineNumber,
                    endColumn: position.column
                });
                let suggestions = []
                OutlineModel.create(jsonEditorRef.current.editor.getModel(), token).then(symbols => {
                    symbols = symbols.asListOfDocumentSymbols();
                    path = path.substr(path.indexOf("input_json.") + 11).split(".");
                    let container = (path.length === 1) ? "" : path.slice(0, -1).join(".");
                    let symbolName = path[path.length - 1];
                    symbols.filter((symbol, index, self) =>
                        symbol.containerName === container &&
                        symbol.name.startsWith(symbolName) &&
                        index === self.findIndex((t) => (t.place === symbol.place && t.name === symbol.name))
                    ).forEach((symbol) => {
                        suggestions.push({
                            label: symbol.name,
                            kind: monaco.languages.CompletionItemKind.Function,
                            insertText: symbol.name
                        })
                    });
                });
                return {suggestions: suggestions};
            }
        });
    }

    function initJsonEditor(monaco) {
        monaco.languages.registerHoverProvider("json", {
            provideHover: async (model, position) => {
                const symbols = await getSymbolsForPosition(model, position, true);
                return {
                    contents: [
                        {
                            value: "path: " + symbols.join(" > "),
                            isTrusted: true
                        }
                    ]
                };
            }
        });
    }

    function JsonEditorPostMount(editor, monaco) {
        window.addEventListener('resize', () => editor.layout())
        editor.addAction({
            id: 'use-in-jinja-template',
            label: 'Use',
            keybindings: [
                monaco.KeyMod.CtrlCmd | monaco.KeyCode.F10,
                // chord
                monaco.KeyMod.chord(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_K, monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_M)
            ],
            precondition: null,
            keybindingContext: null,
            contextMenuGroupId: 'navigation',
            contextMenuOrder: 1,
            run: async function (jsonEditor) {
                let templateEditor = props.templateEditorRef.current.editor;
                let selection = templateEditor.getSelection();
                let path = await getSymbolsForPosition(jsonEditor.getModel(), jsonEditor.getPosition(), false);
                let op = {
                    range: selection,
                    text: "input_json." + path.join('.'),
                    forceMoveMarkers: true
                };
                templateEditor.executeEdits("my-source", [op]);
                return null;
            }
        })
    }

    return (
        <Row id={"editors"}>
            <Col sm={6} id="input_json">
                <h5>Json Object</h5>
                <MonacoEditor
                    ref={jsonEditorRef}
                    height="87vh"
                    width="auto"
                    language="json"
                    defaultValue={editorState.inputJson}
                    options={options}
                    editorWillMount={initJsonEditor}
                    editorDidMount={JsonEditorPostMount}
                    theme={settings.theme}
                />
            </Col>
            <Col sm={6} id="template">
                <h5>Template</h5>
                <MonacoEditor
                    ref={templateEditorRef}
                    height="87vh"
                    width="auto"
                    language="jinja2"
                    defaultValue={editorState.template}
                    options={options}
                    editorWillMount={initTemplateEditor}
                    editorDidMount={editor => window.addEventListener('resize', () => editor.layout())}
                    theme={settings.theme}
                />
            </Col>
        </Row>
    )
}