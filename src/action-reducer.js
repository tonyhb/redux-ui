'use strict';

export const UPDATE_UI_STATE = '@@redux-ui/UPDATE_UI_STATE';
export const SET_DEFAULT_UI_STATE = '@@redux-ui/SET_DEFAULT_UI_STATE';

export default function(state = {}, action) {
  const key = action.payload && (action.payload.key || '');

  switch (action.type) {
    case UPDATE_UI_STATE:
      const { name, value } = action.payload;

      // We're updating many values using an object
      if (typeof name === 'object') {
        return {
          ...state,
          [key]: {
            ...state[key],
            ...name
          }
        };
      }

      // Only updating a name/value pair
      return {
        ...state,
        [key]: {
          ...state[key],
          [name]: value
        }
      };

    // Replace all UI under a key with the given values
    case SET_DEFAULT_UI_STATE:
      return {
        ...state,
        [key]: action.payload.value
      };
  }

  return state;
}

export function updateUI(key, name, value) {
  return {
    type: UPDATE_UI_STATE,
    payload: {
      key,
      name,
      value
    }
  };
};

export function setDefaultUI(key, value) {
  return {
    type: SET_DEFAULT_UI_STATE,
    payload: {
      key,
      value
    }
  };
};
