import _ from 'lodash';
import { User } from 'objects';

export const userInfoReducer = (state = null, action) => {
  if (action.type === 'SET_USER') {
    return action.user;
  } else if (state && action.type === '_User_UPDATED' && _.get(action.objects[0], 'id') === state.id) {
    return User.withSessionToken(action.objects[0], state.sessionToken);
  }

  return state;
};
