import Settings from "./Settings";
import Editors from "./Editors";
import {combineReducers} from "redux";

const rootReducers = combineReducers({
    settings: Settings,
    editors: Editors
});

export default rootReducers;