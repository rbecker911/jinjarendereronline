import React, {useEffect, useState} from "react";
import {Button} from "react-bootstrap";
import {clearEditorState, saveEditorState} from "../reducers/Editors";
import {useDispatch} from "react-redux";
import {alertService} from "../services/alert.service";

const RenderButton = (props) => {
    const [isLoading, setLoading] = useState(false);

    useEffect(() => {
        if (isLoading) {
            props.renderTemplate().then(() => {
                setLoading(false);
            });
        }
    }, [isLoading]);

    const handleClick = () => setLoading(true);

    return (
        <Button
            variant="outline-success"
            disabled={isLoading}
            onClick={!isLoading ? handleClick : null}
        >
            {isLoading ? 'Loading…' : 'Render'}
        </Button>
    );
}

const SaveButton = (props) => {
    const dispatch = useDispatch();

    return (
        <Button variant="outline-info"
                onClick={() => {
                    dispatch(saveEditorState(props.editors));
                    alertService.info("Saved!");
                }}>
            Save
        </Button>
    );
}

const ClearButton = (props) => {
    const dispatch = useDispatch();
    const handleClick = () => {
        props.editors.jsonEditorRef.current.editor.executeEdits(null, [{
            text: '',
            range: props.editors.jsonEditorRef.current.editor.getModel().getFullModelRange()
        }]);
        props.editors.templateEditorRef.current.editor.executeEdits(null, [{
            text: '',
            range: props.editors.templateEditorRef.current.editor.getModel().getFullModelRange()
        }]);
        dispatch(clearEditorState());
    };

    return (
        <Button variant="outline-danger"
                onClick={handleClick}>
            Clear
        </Button>
    );
}

export default function ControlButtons(props) {
    return (
        <div id={"control-buttons"}>
            <RenderButton renderTemplate={props.renderTemplate}/>
            <SaveButton editors={props.editors}/>
            <ClearButton editors={props.editors}/>
        </div>
    )
}