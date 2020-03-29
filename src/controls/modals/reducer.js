import _ from 'lodash';

export const modals = (state = [], action) => {
  switch (action.type) {
    case 'SHOW_MODAL': return [_.pick(action, 'id', 'options', 'onClose'), ...state];
    case 'DESTROY_MODAL': return _.without(state, _.find(state, ['id', action.id]));
    default: return state;
  }
};
