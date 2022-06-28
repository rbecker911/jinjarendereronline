import React, {useEffect, useState} from 'react';
import {useDispatch, useSelector} from "react-redux";
import axios from "axios";
import {Col, Container, Form, Modal, Nav, Navbar, NavDropdown, Row} from "react-bootstrap";
import Editors from "./components/Editors";
import {BigRender, SmallRender} from "./components/Renders";
import {selectMode, toggleMinimap, toggleSmallRender, toggleWordWrap} from "./reducers/Settings";
import ControlButtons from "./components/ControlButtons";
import FiltersModal from "./components/FiltersModal";
import {alertService} from "./services/alert.service";
import {AlertComponent} from "./components/AlertComponent";

export default function App() {
    const [renders, setRenders] = useState([<BigRender title={"Render"} key={"default"}/>]);
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState([]);
    const [examples, setExamples] = useState([]);
    const jsonEditorRef = React.useRef();
    const templateEditorRef = React.useRef();
    const settings = useSelector(state => state.settings);
    const dispatch = useDispatch();

    const handleCloseFilters = () => setShowFilters(false);
    const handleShowFilters = () => setShowFilters(true);

    useEffect(() => {
        Promise.all([axios.get('/filters'), axios.get('/examples')]).then(results => {
            let filters = results[0];
            setFilters(filters.data);
            let examples = results[1];
            setExamples(examples.data);
            document.getElementById('ipl-progress-indicator').classList.add("available");
            setTimeout(() => {
                document.getElementById('ipl-progress-indicator').remove()
            }, 2000);
            renderTemplate();
        }).catch(err => console.log(err))
    }, []);

    function renderTemplate() {
        return axios.post("/render", {
            template: templateEditorRef.current.editor.getModel().getValue(),
            inputJson: jsonEditorRef.current.editor.getModel().getValue(),
            mode: settings.mode
        }).then(response => {
            if (settings.mode === 'entity') {
                const rendersResponse = response.data.renders;
                const allRenders = [];
                for (let i = 0; i < rendersResponse.length; i++) {
                    if (settings.smallRender) {
                        allRenders.push(<SmallRender render={rendersResponse[i].render}
                                                     title={rendersResponse[i].entity}
                                                     key={rendersResponse[i].entity}/>)
                    } else {
                        allRenders.push(<BigRender render={rendersResponse[i].render} title={rendersResponse[i].entity}
                                                   key={rendersResponse[i].entity}/>)
                    }
                }
                setRenders(allRenders);
            } else {
                if (settings.smallRender) {
                    setRenders([<SmallRender render={response.data.render} title="Render" key="render"/>])
                } else {
                    setRenders([<BigRender render={response.data.render} title="Render" key="render"/>])
                }
            }
        }).catch(error => {
            if (error.response !== undefined && error.response.data.status === 'error') {
                if (error.response.data.message.startsWith("Syntax error in jinja2 template") ||
                    error.response.data.message.startsWith("Value error in JSON")) {
                    alertService.error(error.response.data.message, {
                        lineno: error.response.data.lineno !== undefined ? error.response.data.lineno : 0,
                        colno: error.response.data.colno !== undefined ? error.response.data.colno : 0,
                        editorRef: error.response.data.message.startsWith("Value error in JSON") ? jsonEditorRef : templateEditorRef
                    })
                } else {
                    alertService.error(error.response.data.message)
                }
            } else {
                console.log(error)
            }
        });
    }

    function showExample(example) {
        dispatch(selectMode(example.mode))
        jsonEditorRef.current.editor.executeEdits(null, [{
            text: example.inputJson,
            range: jsonEditorRef.current.editor.getModel().getFullModelRange()
        }]);
        templateEditorRef.current.editor.executeEdits(null, [{
            text: example.template,
            range: templateEditorRef.current.editor.getModel().getFullModelRange()
        }]);
        return renderTemplate();
    }

    return (
        <>
            <Navbar bg="primary" expand="lg" variant="dark">
                <Container fluid>
                    <Nav className="me-auto">
                        <NavDropdown active id="render-mode-dropdown"
                                     title={settings.mode === 'render' ? "Render Template" : "Entity Insight"}>
                            <NavDropdown.Item active={settings.mode === 'render'} eventKey="render"
                                              onSelect={() => dispatch(selectMode('render'))}>Render
                                Template</NavDropdown.Item>
                            <NavDropdown.Item active={settings.mode === 'entity'} eventKey="entity"
                                              onSelect={() => dispatch(selectMode('entity'))}>Entity
                                Insight</NavDropdown.Item>

                        </NavDropdown>
                        <NavDropdown autoClose={"outside"} id={"settings-dropdown"} title={"Settings"}>
                            <NavDropdown.Item as={"div"}>
                                <Form.Check
                                    onChange={() => dispatch(toggleSmallRender())}
                                    defaultChecked={settings.smallRender}
                                    type={"checkbox"}
                                    id={`small-render-checkbox`}
                                    label={`Siemplify Sized Renders`}
                                />
                            </NavDropdown.Item>
                            <NavDropdown.Item as={"div"}>
                                <Form.Check
                                    onChange={() => dispatch(toggleMinimap())}
                                    defaultChecked={settings.minimap}
                                    type={"checkbox"}
                                    id={`minimap-checkbox`}
                                    label={`Minimap`}
                                /></NavDropdown.Item>
                            <NavDropdown.Item as={"div"}>
                                <Form.Check
                                    onChange={() => dispatch(toggleWordWrap())}
                                    defaultChecked={settings.wardWrap}
                                    type={"checkbox"}
                                    id={`wordwrap-checkbox`}
                                    label={`Word Wrap`}
                                /></NavDropdown.Item>
                        </NavDropdown>
                        {examples.length > 0 ?
                            <NavDropdown id="examples-dropdown"
                                         title={"Examples"}>
                                {examples.map((example, id) =>
                                    <NavDropdown.Item onSelect={() => showExample(example)}
                                                      key={id}>{example.name}</NavDropdown.Item>
                                )}
                            </NavDropdown>
                            : null}
                        <Nav.Link eventKey={2} href="#" onClick={handleShowFilters}>Filters</Nav.Link>
                        <Nav.Link eventKey={3}
                                  onClick={() => window.open("https://jinja.palletsprojects.com/en/3.0.x/templates/", "_blank")}>Documentation</Nav.Link>
                    </Nav>
                    <ControlButtons renderTemplate={renderTemplate} editors={{jsonEditorRef, templateEditorRef}}/>
                    <Modal show={showFilters} onHide={handleCloseFilters} size={"xl"} scrollable>
                        <FiltersModal handleClose={handleCloseFilters} filters={filters}/>
                    </Modal>
                </Container>
            </Navbar>
            <Container fluid>
                <Row className="row-eq-height row-height">
                    <Col sm={9}>
                        <Editors jsonEditorRef={jsonEditorRef} templateEditorRef={templateEditorRef}/>
                    </Col>
                    <Col sm={3} id="renders" className="scrollbar-primary"
                         style={{overflow: renders.length > 1 ? null : 'hidden'}}>
                        {renders}
                    </Col>
                </Row>
            </Container>
            <AlertComponent/>
        </>
    )
}