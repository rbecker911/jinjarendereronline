import React, {useEffect, useState} from 'react';
import PropTypes from 'prop-types';
import BSAlert from 'react-bootstrap/Alert'

import {alertService, AlertType} from '../services/alert.service';

const propTypes = {
    id: PropTypes.string,
    fade: PropTypes.bool
};

const defaultProps = {
    id: 'default-alert',
    fade: false
};

const alertTypeClass = {
    [AlertType.Success]: 'success',
    [AlertType.Error]: 'danger',
    [AlertType.Info]: 'info',
    [AlertType.Warning]: 'warning'
}

function AlertComponent({id}) {
    const [alerts, setAlerts] = useState([]);

    useEffect(() => {
        // subscribe to new alert notifications
        const subscription = alertService.onAlert(id)
            .subscribe(alert => {
                setAlerts(alerts => ([...alerts, alert]));
                setTimeout(() => removeAlert(alert), 5000);
            });

        // clean up function that runs when the component unmounts
        return () => {
            subscription.unsubscribe();
        };
    }, []);

    function removeAlert(alert) {
        // fade out alert
        const alertWithFade = {...alert, fade: true};
        setAlerts(alerts => alerts.map(x => x === alert ? alertWithFade : x));

        // remove alert after faded out
        setTimeout(() => {
            setAlerts(alerts => alerts.filter(x => x !== alertWithFade));
        }, 250);
    }

    if (!alerts.length) return null;

    return (
        <div className="bottom-right-alert">
            {alerts.map((alert, index) =>
                <BSAlert transition={false} key={index} variant={alertTypeClass[alert.type]}
                         className={alert.fade ? 'fade' : null} onClose={() => removeAlert(alert)} dismissible>
                    <strong>{alert.message}</strong>
                    {alert.editorRef !== undefined ? <><br/><BSAlert.Link onClick={() => {
                        alert.editorRef.current.editor.setSelection({
                            startLineNumber: alert.lineno,
                            startColumn: alert.colno, endLineNumber: alert.lineno, endColumn: alert.colno
                        });
                        alert.editorRef.current.editor.revealLineInCenter(alert.lineno)
                        alert.editorRef.current.editor.focus();
                    }}>Show in Editor</BSAlert.Link></> : null}
                </BSAlert>
            )}
        </div>
    );
}

AlertComponent.propTypes = propTypes;
AlertComponent.defaultProps = defaultProps;
export {AlertComponent};