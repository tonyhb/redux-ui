'use strict';

import { Map } from 'immutable';
import invariant from 'invariant'

// For updating multiple UI variables at once.  Each variable might be part of
// a different context; this means that we need to either call updateUI on each
// key of the object to update or do transformations within one action in the
// reducer. The latter only triggers one store change event and is more
// performant.
export const MASS_UPDATE_UI_STATE = '@@redux-ui/MASS_UPDATE_UI_STATE';
export const UPDATE_UI_STATE = '@@redux-ui/UPDATE_UI_STATE';
export const SET_DEFAULT_UI_STATE = '@@redux-ui/SET_DEFAULT_UI_STATE';

// These are private consts used in actions only given to the UI decorator.
const MOUNT_UI_STATE = '@@redux-ui/MOUNT_UI_STATE';
const UNMOUNT_UI_STATE = '@@redux-ui/UNMOUNT_UI_STATE';

export const defaultState = new Map({
  __reducers: new Map({
    // This contains a map of component paths (joined by '.') to an object
    // containing the fully qualified path and the reducer function:
    // 'parent.child': {
    //   path: ['parent', 'child'],
    //   func: (state, action) => { ... }
    // }
  })
});

export default function reducer(state = defaultState, action) {
  let key = action.payload && (action.payload.key || []);

  if (!Array.isArray(key)) {
    key = [key];
  }

  switch (action.type) {
    case UPDATE_UI_STATE:
      const { name, value } = action.payload;
      state = state.setIn(key.concat(name), value);
      break;

    case MASS_UPDATE_UI_STATE:
      const { uiVars, transforms } = action.payload;
      state = state.withMutations( s => {
        Object.keys(transforms).forEach(k => {
          const path = uiVars[k];
          invariant(
            path,
            `Couldn't find variable ${k} within your component's UI state ` +
            `context. Define ${k} before using it in the @ui decorator`
          );

          s.setIn(path.concat(k), transforms[k]);
        });
      });
      break;

    case SET_DEFAULT_UI_STATE:
      // Replace all UI under a key with the given values
      state = state.setIn(key, new Map(action.payload.value));
      break;

    case MOUNT_UI_STATE:
      const { defaults, customReducer } = action.payload;
      state = state.withMutations( s => {
        // Set the defaults for the component
        s.setIn(key, new Map(defaults));

        // If this component has a custom reducer add it to the list.
        // We store the reducer func and UI path for the current component
        // inside the __reducers map.
        if (customReducer) {
          let path = key.join('.');
          s.setIn(['__reducers', path], {
            path: key,
            func: customReducer
          });
        }

        return s;
      });
      break;

    case UNMOUNT_UI_STATE:
      // We have to use deleteIn as react unmounts root components first;
      // this means that using setIn in child contexts will fail as the root
      // context will be stored as undefined in our state
      state= state.withMutations(s => {
        s.deleteIn(key);
        // Remove any custom reducers
        s.deleteIn(['__reducers', key.join('.')]);
      });
      break;
  }

  const customReducers = state.get('__reducers');
  if (customReducers.size > 0) {
    state = state.withMutations(mut => {
      customReducers.forEach(r => {
        // This calls each custom reducer with the UI state for each custom
        // reducer with the component's UI state tree passed into it.
        //
        // NOTE: Each component's reducer gets its own UI state: not the entire
        // UI reducer's state. Whatever is returned from this reducer is set
        // within the **components** UI scope.
        //
        // This is because it's the only way to update UI state for components
        // without keys - you need to know the path in advance to update state
        // from a reducer.  If you have list of components with no UI keys in
        // the component heirarchy, any children will not be able to use custom
        // reducers as the path is random.
        //
        // TODO: Potentially add the possibility for a global UI state reducer?
        //       Though why wouldn't you just add a custom reducer to the
        //       top-level component?
        const { path, func } = r;
        const newState = func(mut.getIn(path), action);
        if (newState === undefined) {
          throw new Error(`Your custom UI reducer at path ${path.join('.')} must return some state`);
        }
        mut.setIn(path, newState);
      });
      return mut;
    });
  }

  return state;
}

export const reducerEnhancer = (customReducer) => (state, action) => {
  state = reducer(state, action);
  if (typeof customReducer === 'function') {
    state = customReducer(state, action);
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

export function massUpdateUI(uiVars, transforms) {
  return {
    type: MASS_UPDATE_UI_STATE,
    payload: {
      uiVars,
      transforms
    }
  };
}

// Exposed to components, allowing them to reset their and all child scopes to
// the default variables set up
export function setDefaultUI(key, value) {
  return {
    type: SET_DEFAULT_UI_STATE,
    payload: {
      key,
      value
    }
  };
};

/** Private, decorator only actions **/

// This is not exposed to your components; it's only used in the decorator.
export function unmountUI(key) {
  return {
    type: UNMOUNT_UI_STATE,
    payload: {
      key
    }
  };
};

/**
 * Given the key/path, set of defaults and custom reducer for a UI component
 * during construction prepare the state of the UI reducer
 *
 */
export function mountUI(key, defaults, customReducer) {
  return {
    type: MOUNT_UI_STATE,
    payload: {
      key,
      defaults,
      customReducer
    }
  }
}
