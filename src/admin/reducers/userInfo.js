export const userInfoReducer = (state = null, action) => (action.type === 'SET_USER' ? action.user : state);
