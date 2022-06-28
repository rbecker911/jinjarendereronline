import React from "react";
import {Button} from "react-bootstrap";

export class BigRender extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <>
                <h5>{this.props.title}</h5>
                <div className="render-item render-item-big scrollbar-primary">
                    <div id="render" dangerouslySetInnerHTML={{__html: this.props.render}}/>
                </div>
            </>
        );
    }
}

export class SmallRender extends React.Component {
    constructor(props) {
        super(props);
        this.divRef = React.createRef();
    }

    handleResize = () => {
        this.divRef.current.classList.toggle("extended");
    }

    render() {
        return (
            <>
                <h5>{this.props.title}</h5>
                <div ref={this.divRef} className="render-item render-item-small scrollbar-primary">
                    <div dangerouslySetInnerHTML={{__html: this.props.render}}/>
                    <Button onClick={this.handleResize}
                            bsPrefix="jro" type="button" className="close toggle-render-size">
                        <svg fill="white" width="100%" height="100%" viewBox="0 0 24 24"
                             xmlns="http://www.w3.org/2000/svg">
                            <path
                                d="M17.25 6.4a.35.35 0 01.35.35v5.105a.35.35 0 01-.598.247l-5.105-5.105a.35.35 0 01.248-.597h5.105zM6.4 17.25c0 .193.157.35.35.35h5.105a.35.35 0 00.247-.598l-5.105-5.105a.35.35 0 00-.597.248v5.105z"/>
                        </svg>
                    </Button>
                </div>
            </>
        );
    }
}