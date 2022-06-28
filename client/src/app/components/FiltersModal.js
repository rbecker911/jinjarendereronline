import React from 'react';
import {Button, Col, Container, Modal, Row, Table} from "react-bootstrap";
import {TableOfContents} from "./TOC";

export default function FiltersModal(props) {
    return (<>
            <Modal.Header closeButton>
                <Modal.Title>Filters</Modal.Title>
            </Modal.Header>
            <Modal.Body className={"scrollbar-primary"}>
                <Container>
                    <Row>
                        <Col sm={3}>
                            <TableOfContents/>
                        </Col>
                        <Col sm={9}>
                            <main>
                                {Object.keys(props.filters).map((category) => {
                                    return <div key={category}>
                                        <h2 id={category}>{category}</h2>
                                        {props.filters[category].map((f) => {
                                            return <div key={f.name}>
                                                <h3 id={f.name}>{f.name}</h3>
                                                <p>{f.description}</p>
                                                {f.inputs.length > 0 ?
                                                    <>
                                                        <h5>Inputs</h5>
                                                        <Table striped bordered hover>
                                                            <thead>
                                                            <tr>
                                                                <th>Name</th>
                                                                <th>Type</th>
                                                                <th>Description</th>
                                                            </tr>
                                                            </thead>
                                                            <tbody>
                                                            {f.inputs.map((data, id) => {
                                                                return <tr key={id}>
                                                                    <td>{data.name}</td>
                                                                    <td>{data.type}</td>
                                                                    <td>{data.description}</td>
                                                                </tr>
                                                            })}
                                                            </tbody>
                                                        </Table>
                                                    </> : null}
                                            </div>
                                        })}
                                        <hr/>
                                    </div>
                                })}
                            </main>
                        </Col>
                    </Row>
                </Container>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="primary" onClick={props.handleClose}>
                    Close
                </Button>
            </Modal.Footer>
        </>
    )
}