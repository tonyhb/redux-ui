'use strict';

import React from 'react';
import { Provider } from 'react-redux';
import { createStore, combineReducers } from 'redux';
import ui, { reducer } from '../../src';

const store = createStore(combineReducers({ ui: reducer }));

/**
 * Wrap given JSX with a provider contianing a store with the UI reducer
 */
const wrapWithProvider = (jsx) => (
  <Provider store={ store }>
    { jsx }
  </Provider>
);

export {
  wrapWithProvider
}
