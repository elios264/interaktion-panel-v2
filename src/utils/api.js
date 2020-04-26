import _ from 'lodash';
import Parse from 'parse';
import { getValue } from 'controls/utils';

export const buildQuery = (classNameOrQuery, queries) => {

  queries = _.map(_.castArray(queries), (queryParams) => _.toPairs(queryParams).reduce((query, [command, parameters]) => {
    switch (command) {
      case 'ascending': case 'select':
      case 'include': case 'descending': case 'exists':
        return query[command](parameters);
      case 'equalTo': case 'notEqualTo':
      case 'lessThan': case 'greaterThan': case 'containedIn': case 'notContainedIn':
      case 'lessThanOrEqualTo': case 'greaterThanOrEqualTo':
        return _.toPairs(parameters).reduce((newQuery, [prop, value]) => newQuery[command](prop, value), query);
      case 'matchesQuery':
        return _.reduce(parameters, (newQuery, [className, subQueryParams], columnName) => newQuery.matchesQuery(columnName, buildQuery(className, subQueryParams)), query);
      case 'matchesKeyInQuery': {
        return _.reduce(parameters, (newQuery, [className, [subQueryKey, subQueryParams]], columnName) => newQuery.matchesKeyInQuery(columnName, subQueryKey, buildQuery(className, subQueryParams)), query);
      }
      default: return query;
    }
  }, classNameOrQuery instanceof Parse.Query ? classNameOrQuery : new Parse.Query(classNameOrQuery)));

  if (queries.length > 1) {
    return Parse.Query.or(...queries).limit(Number.MAX_SAFE_INTEGER);
  }
  return queries[0].limit(Number.MAX_SAFE_INTEGER);
};

export const handleOperation = async (fn, invoker, message = '', { login = false } = {}) => {
  const id = _.uniqueId();
  try {
    invoker.onEvent({ type: 'BEGIN_OPERATION', id, message });
    return await fn();
  } catch (err) {
    console.warn(err.code, err.message);

    if (err.code === Parse.Error.AGGREGATE_ERROR) {
      err.messages = _(err.errors).map('message').uniq().join(',');
    } else {
      err.message = getValue(err.code, {
        [Parse.Error.OPERATION_FORBIDDEN]: login ? 'Incorrect access credentials.' : 'Access denied.',
        [Parse.Error.OBJECT_NOT_FOUND]: login ? 'Incorrect access credentials.' : 'The record was not found.',
        [Parse.Error.INVALID_SESSION_TOKEN]: 'Invalid session, please log in again',
        [Parse.Error.CONNECTION_FAILED]: 'Could not connect to the server, please check your internet connection.',
        [Parse.Error.DUPLICATE_VALUE]: 'A duplicate value was provided for a field with unique values.',
        [Parse.Error.COMMAND_UNAVAILABLE]: 'Command unavailable, try again later.',
      }, err.message);
    }
    throw err;
  } finally {
    invoker.onEvent({ type: 'END_OPERATION', id });
  }
};
