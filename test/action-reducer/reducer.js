'use strict';

import {
  reducer,
  reducerEnhancer,
  UPDATE_UI_STATE
} from '../../src/action-reducer.js';

import { assert } from 'chai';
import { is, Map } from 'immutable';
import { Provider } from 'react-redux';
import { createStore, combineReducers } from 'redux';
import { defaultState } from '../../src/action-reducer.js';

const customReducer = (state, action) => {
  if (action.type === 'CUSTOM_ACTION_TYPE') {
    return state.set('isHooked', true);
  }
  return state;
}
const enhancedReducer = reducerEnhancer(customReducer);

describe('reducerEnhancer', () => {
  let enhancedStore;
  
  beforeEach( () => {
    enhancedStore = createStore(combineReducers({ ui: enhancedReducer }));
  });

  it('delegates to the default reducer', () => {
    assert.isTrue(is(enhancedStore.getState().ui, defaultState));

    enhancedStore.dispatch({
      type: UPDATE_UI_STATE,
      payload: {
        key: 'a',
        name: 'foo',
        value: 'bar'
      }
    });

    assert.isTrue(
      is(
        enhancedStore.getState().ui,
        new Map({
          __reducers: new Map(),
          a: new Map({ foo: 'bar' })
        })
      )
    );
  });

  it('intercepts custom actions', () => {
    assert.isTrue(is(enhancedStore.getState().ui, defaultState));

    enhancedStore.dispatch({
      type: 'CUSTOM_ACTION_TYPE',
      payload: {
        foo: 'bar'
      }
    });
    assert.isTrue(
      is(
        enhancedStore.getState().ui,
        new Map({
          __reducers: new Map(),
          isHooked: true
        })
      )
    );
  });

});
