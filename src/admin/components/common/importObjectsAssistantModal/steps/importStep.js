import PropTypes from 'prop-types';
import { useState, useRef, useLayoutEffect } from 'react';
import { Modal, Button, TextArea, Form, Ref } from 'semantic-ui-react';
import { useEffectAsync } from 'controls/hooks';
import moment from 'moment';

import { jsonKeys } from '../types';


export const ImportStep = ({ onFinish, onClose, onImport, header, json }) => {
  const isRestore = json[jsonKeys.isRestore];
  const textAreaRef = useRef();
  const [importing, setImporting] = useState(true);
  const [logText, updateLog] = useState(isRestore ? 'Restoring backup from file...\n' : 'Importing entities from file...\n');

  useEffectAsync(async () => {
    const logProgress = (text) => {
      updateLog((log) => `${log}\n${text}`);
      console.log(text);
    };
    const beforeImport = moment();
    try {
      await onImport({ json, logProgress });
      onFinish(true);
      logProgress('\nDone.');
    } catch (err) {
      onFinish(false);
      logProgress(`\nFATAL ERROR OCURRED, IMPORT HAS BEEN ABORTED:\n${err.message}\n`);
    }
    logProgress(`\nTime taken: ${moment().diff(beforeImport, 'seconds')} seconds.`);
    setImporting(false);
  }, []);

  useLayoutEffect(() => {
    textAreaRef.current.scrollTop = textAreaRef.current.scrollHeight;
  }, [logText]);

  return (
    <>
      <Modal.Content as={Form}>
        {header}
        <Ref innerRef={textAreaRef}>
          <TextArea
            value={logText}
            rows={15}
            className='w-100 overflow-y-scroll'
            style={{ resize: 'none' }} />
        </Ref>
      </Modal.Content>
      {importing ? (
        <Modal.Actions className='flex items-center'>
          <span className='mr-auto b'>To abort the operation close the tab NOW!</span>
        </Modal.Actions>
      ) : (
        <Modal.Actions>
          <Button onClick={onClose} secondary content='Close' />
        </Modal.Actions>
      )}
    </>
  );
};
ImportStep.propTypes = {
  onFinish: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  onImport: PropTypes.func.isRequired,
  json: PropTypes.object.isRequired,
  header: PropTypes.node.isRequired,
};
