import {createSlice} from '@reduxjs/toolkit'

const JSON_INITIAL_VALUE = '{}'

const TEMPLATE_INITIAL_VALUE = "<h3>Features</h3>Switch between <b>Render Template</b> and <b>Entity Insight</b> from the navigation bar. Entity insight mode expects a list of objects.\n" +
    "\n" +
    "Start typing <em>input_json.</em> to auto-complete keys from the json object, or right click the keys in the json editor and click <b>Use</b> to paste them in the template editor.\n" +
    "\n" +
    "To format the json object, right click the editor and select Format Document.\n" +
    "\n" +
    "Press <b>F1</b> on each editor to view actions and keyboard shortcuts.\n"


export const EditorsSlice = createSlice({
    name: 'editors',
    initialState: {
        inputJson: JSON_INITIAL_VALUE,
        template: TEMPLATE_INITIAL_VALUE
    },
    reducers: {
        saveEditorState: (state, action) => {
            state.inputJson = action.payload.jsonEditorRef.current.editor.getModel().getValue();
            state.template = action.payload.templateEditorRef.current.editor.getModel().getValue();
        },
        clearEditorState: (state) => {
            state.inputJson = JSON_INITIAL_VALUE;
            state.template = TEMPLATE_INITIAL_VALUE;
        }
    },
})

// Action creators are generated for each case reducer function
export const {saveEditorState, clearEditorState} = EditorsSlice.actions

export default EditorsSlice.reducer