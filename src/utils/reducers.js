import _ from 'lodash';

export const cleanWhenNoUser = (reducer) => (state, action) => reducer((action.type === 'SET_USER' && !action.user) ? undefined : state, action);

export const createCRUDObjectReducer = (prefix, { key = 'id', filter = _.identity, merge = false } = {}) => (state = {}, action) => {
  switch (action.type) {
    case `${prefix}_FETCHED`:
      return _(action.objects).filter(filter).keyBy(key).value();
    case `${prefix}_ADDED`:
    case `${prefix}_UPDATED`:
      return !merge
        ? _.pickBy({ ...state, ..._.keyBy(action.objects, key) }, filter)
        : _.pickBy(_.assignWith(state, _.keyBy(action.objects, key), (fst, snd) => {
          if (!fst) {
            return snd;
          }
          if (merge.discard) {
            fst = _.omit(fst, merge.discard);
          }
          return { ...fst, ...snd };
        }), filter);
    case `${prefix}_REMOVED`:
      return _(action.objects).map(key).reduce((acc, cur) => (delete acc[cur], acc), { ...state });
    default: return state;
  }
};
