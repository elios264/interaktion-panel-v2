import _ from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { Table, Modal, Button, Message, Header } from 'semantic-ui-react';

import { utils, AwaitableAnchor } from 'controls';
import { jsonKeys, actions } from '../types';

const getCollectionConsensus = ({ entities, isRestore }) => {
  if (isRestore) {
    return <span>{_.size(entities)} will be checked for modifications and the modified ones will be <span className='blue b'>restored</span></span>;
  }

  const { [actions.ignore]: ignore, [actions.create]: create, [actions.update]: update, [actions.reference]: reference } = _(entities)
    .groupBy(jsonKeys.operationAction)
    .mapValues(_.size)
    .value();

  return utils.joinAndSeparatorJSX([
    create && <span>{create} will be <span className='b green'>created</span></span>,
    update && <span>{update} will be <span className='b yellow'>updated</span></span>,
    reference && <span>{reference} will be used as <span className='b orange'>reference</span></span>,
    ignore && <span>{ignore} will be <span className='b gray'>ignored</span></span>,
  ]);

};

export const ConfirmArrangementStep = ({ definitions, onNext, onBack, header, json, onExport }) => {
  const isRestore = json[jsonKeys.isRestore];

  return (
    <>
      <Modal.Content>
        {header}
        <Header size='medium'>Here's what's going to happen:</Header>
        <Table celled padded>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell singleLine>Collection</Table.HeaderCell>
              <Table.HeaderCell>Summary</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {_(definitions)
              .filter(({ property }) => isRestore ? !json.references[property] : true)
              .map(({ title, property }) => (
                <Table.Row key={property}>
                  <Table.Cell>
                    <Header as='h3'>{title}</Header>
                  </Table.Cell>
                  <Table.Cell>{getCollectionConsensus({ entities: json[property], isRestore })}.</Table.Cell>
                </Table.Row>
              ))
              .value()
            }
          </Table.Body>
        </Table>

        {isRestore ? (
          <Message warning>Please note that the restore operation will only revert <span className='b'>existing</span> entities to their state in the file, if you want to restore deleted entities use the import operation.</Message>
        ) : (
          <Message warning>Before performing an import it's recommended to create a backup just in case you want to go back later, <AwaitableAnchor className='pointer' onClick={onExport}>click here</AwaitableAnchor> if you want to.</Message>
        )}

      </Modal.Content>
      <Modal.Actions>
        <Button onClick={onBack} secondary icon='left chevron' labelPosition='left' content='Back' />
        <Button onClick={() => onNext(json)} primary icon='right chevron' labelPosition='right' content='Next' />
      </Modal.Actions>
    </>
  );
};
ConfirmArrangementStep.propTypes = {
  definitions: PropTypes.array.isRequired,
  onBack: PropTypes.func.isRequired,
  onNext: PropTypes.func.isRequired,
  onExport: PropTypes.func.isRequired,
  json: PropTypes.object.isRequired,
  header: PropTypes.node.isRequired,
};
