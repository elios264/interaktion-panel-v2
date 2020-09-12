import _ from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { Segment, Header, Button, Modal, Icon, Dropdown } from 'semantic-ui-react';
import { useDispatch } from 'react-redux';
import Joi from '@hapi/joi';

import { utils } from 'controls';
import { handleError } from 'utils/actions';
import { jsonKeys } from '../types';
import { getRequiredDefinitions } from '../utils';


export const SelectFileStep = ({ definitions, onNext, header }) => {
  const dispatch = useDispatch();

  const pickAndValidateFile = (isRestore = false) => dispatch(handleError(async () => {
    const [file] = await utils.selectFiles({ multiple: false, accept: 'application/json' });
    const json = await utils.toReadable(file, 'readAsText').then(JSON.parse);

    // - validate version
    if (json.version !== window.__ENVIRONMENT__.BUILD) {
      throw new Error(`The file was generated with a build version with value "${json.version}" whereas needs to have the same version as the current build: "${window.__ENVIRONMENT__.BUILD}"`);
    }

    // - validate environment
    if (isRestore && json.environment !== window.__ENVIRONMENT__.BUILD_ENVIRONMENT) {
      throw new Error(`The file was generated with a build environment with value "${json.environment}", a restore needs a file generated in the same environment as the current one: "${window.__ENVIRONMENT__.BUILD}"`);
    }

    // - validate references
    if (!_.isObject(json.references) || _.some(json.references, _.negate(_.isBoolean))) {
      throw new Error('The file does not contain a valid references node');
    }

    const requiredDefinitions = getRequiredDefinitions(definitions, json);

    // - validate contains definitions
    _.each(requiredDefinitions, ({ property, title }) => {
      if (!_.isArray(json[property]) || _.size(json[property]) < 1) {
        throw new Error(`The file does not contain a valid required collection: "${title}"`);
      }
    });

    // - validate is valid schema
    await Promise.all(_.flatMap(requiredDefinitions, ({ title, property, schema, referenceSchema, allowReferences }) => _.map(json[property], (entity, index) => {

      if (!_.isObject(entity) || _.isUndefined(entity.id)) {
        throw new Error(`In collection "${title}", entity at index ${index}: entity is not an object with an id property`);
      }

      if (json.references[property] && !allowReferences) {
        throw new Error(`Collection "${title}": is a marked as a references collection with no actual data for importing, you are probably importing this file into the wrong section`);
      }

      return Joi.object(json.references[property] ? referenceSchema : schema).validateAsync(entity, { allowUnknown: true }).catch((err) => {
        throw new Error(`In collection "${title}", entity with id ${entity.id} : ${err.message}`);
      });
    })));

    // - transform json and validate uniqueness
    _.transform(requiredDefinitions, (json, { property, title }) => {

      const collection = json[property];
      const duplicatedIds = _(collection).groupBy('id').mapValues('length').pickBy((value) => value > 1).keys().value();

      if (duplicatedIds.length) {
        throw new Error(`In collection "${title}": the following entities are duplicated by id: ${utils.joinAndSeparator(duplicatedIds)}`);
      }

      json[property] = _.keyBy(collection, 'id');

    }, json);

    // - validate children exist
    _(requiredDefinitions).filter('children').flatMap(({ property, children, title }) => _.map(children, (child) => ({ property, child, title }))).each(({ property, child, title }) => {
      const parentsChildrenIds = _(json[property]).flatMap(child.accessor).uniq().value();
      const existingChildrenIds = _.map(json[child.collection], 'id');
      const missingChildrenIds = _.difference(parentsChildrenIds, existingChildrenIds);

      if (missingChildrenIds.length) {
        throw new Error(`In collection "${title}": some referenced ${child.collection} are missing: ${utils.joinAndSeparator(missingChildrenIds)}`);
      }
    });

    json[jsonKeys.isRestore] = isRestore;
    onNext(json);
  }, 'Invalid file'));

  return (
    <>
      <Modal.Content>
        {header}
        <Segment placeholder>
          <Header icon>
            <Icon name='file archive outline' />
            You need to select a JSON file generated by this system that has the same build version: {window.__ENVIRONMENT__.BUILD}
          </Header>
          <div className='flex justify-center'>
            <Button.Group primary>
              <Button icon='download' content='Import from file' onClick={() => pickAndValidateFile(false)} />
              <Dropdown
                className='button icon'
                floating
                options={[{ key: 'restore', active: false, icon: 'undo', text: 'Restore from file', value: 'restore', onClick: () => pickAndValidateFile(true) }]}
                // eslint-disable-next-line react/jsx-fragments, react/jsx-no-useless-fragment
                trigger={<React.Fragment />} />
            </Button.Group>
          </div>
        </Segment>
      </Modal.Content>
      <Modal.Actions />
    </>
  );
};
SelectFileStep.propTypes = {
  definitions: PropTypes.array.isRequired,
  onNext: PropTypes.func.isRequired,
  header: PropTypes.node.isRequired,
};
