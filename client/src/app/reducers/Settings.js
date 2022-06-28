import {createSlice} from '@reduxjs/toolkit'

export const SettingsSlice = createSlice({
    name: 'settings',
    initialState: {
        theme: 'vs-dark',
        wordWrap: true,
        minimap: false,
        smallRender: false,
        mode: 'render'
    },
    reducers: {
        toggleSmallRender: (state) => {
            state.smallRender = !state.smallRender
        },
        toggleMinimap: (state) => {
            state.minimap = !state.minimap
        },
        toggleWordWrap: (state) => {
            state.wordWrap = !state.wordWrap
        },
        selectTheme: (state, action) => {
            state.theme = action.payload
        },
        selectMode: (state, action) => {
            state.mode = action.payload
        }
    },
})

// Action creators are generated for each case reducer function
export const {toggleMinimap, toggleWordWrap, selectTheme, selectMode, toggleSmallRender} = SettingsSlice.actions

export default SettingsSlice.reducer