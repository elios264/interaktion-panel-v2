import _ from 'lodash';
import PropTypes from 'prop-types';
import { useState, useMemo } from 'react';
import { Modal, Step } from 'semantic-ui-react';

import { SelectFileStep, ArrangeEntitiesStep, ConfirmArrangementStep, ImportStep } from './steps';
import { jsonKeys, actions } from './types';
import { getRequiredDefinitions } from './utils';


const importSteps = [
  { icon: 'file archive outline', title: 'Select a file' },
  { icon: 'fork', title: 'Arrange entities' },
  { icon: 'checkmark box', title: 'Confirm arrangement' },
  { icon: 'upload', title: 'Import' },
];
const restoreSteps = [
  importSteps[0],
  importSteps[1],
  { icon: 'checkmark box', title: 'Confirm restore' },
  { icon: 'undo', title: 'Restore' },
];


export const ImportObjectsAssistantModal = ({ onClose, definitions, onImport, onExport }) => {

  const [{ step, json, importSuccess }, setState] = useState({ step: 0, json: {} });
  const requiredDefinitions = useMemo(() => _.isEmpty(json) ? undefined : getRequiredDefinitions(definitions, json), [definitions, json]);

  const goToPrevStep = () => setState(({ step, json }) => ({ step: step - (step === 2 && json[jsonKeys.isRestore] ? 2 : 1), json }));
  const goToNextStep = (json) => setState(({ step }) => ({ step: step + (step === 0 && json[jsonKeys.isRestore] ? 2 : 1), json }));
  const goToFinalState = (importSuccess) => setState(({ json }) => ({ step: importSuccess ? 4 : 3, json, importSuccess }));


  const header = (
    <Step.Group fluid>
      { _.map(json[jsonKeys.isRestore] ? restoreSteps : importSteps, ({ icon, title }, index) => (
        <Step
          key={index}
          title={title}
          icon={step === 3 && index === step && _.isUndefined(importSuccess) ? { name: 'cog', loading: true } : icon}
          completed={step > index}
          active={step === index}
          disabled={index > step} />
      ))}
    </Step.Group>
  );

  return (
    <Modal size='large' onClose={() => onClose(null, false)} open closeOnDimmerClick={false} closeOnEscape={false} closeIcon>
      <Modal.Header size='medium' content={`${_.first(definitions).title} import assistant`} />
      {step === 0 && <SelectFileStep header={header} definitions={definitions} onNext={goToNextStep} />}
      {step === 1 && <ArrangeEntitiesStep header={header} definitions={requiredDefinitions} onNext={goToNextStep} onBack={goToPrevStep} json={json} onImport={onImport} />}
      {step === 2 && <ConfirmArrangementStep header={header} definitions={requiredDefinitions} onNext={goToNextStep} onBack={goToPrevStep} json={json} onExport={onExport} />}
      {step >= 3 && <ImportStep header={header} onFinish={goToFinalState} onClose={() => onClose(null, true)} json={json} onImport={onImport} />}
    </Modal>
  );
};

ImportObjectsAssistantModal.jsonKeys = jsonKeys;
ImportObjectsAssistantModal.actions = actions;
ImportObjectsAssistantModal.propTypes = {
  onImport: PropTypes.func.isRequired,
  onExport: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  definitions: PropTypes.arrayOf(PropTypes.shape({
    title: PropTypes.string.isRequired,
    property: PropTypes.string.isRequired,
    propertyFilterer: PropTypes.func,
    matchBy: PropTypes.oneOfType([PropTypes.string, PropTypes.func]).isRequired,
    displayName: PropTypes.func.isRequired,
    allowReferences: PropTypes.bool,
    schema: PropTypes.object,
    referenceSchema: PropTypes.object,
    detailsUrl: PropTypes.func,
    children: PropTypes.arrayOf(PropTypes.shape({
      collection: PropTypes.string.isRequired,
      accessor: PropTypes.oneOfType([PropTypes.string, PropTypes.func]).isRequired,
    }).isRequired),
  }).isRequired).isRequired,
};
