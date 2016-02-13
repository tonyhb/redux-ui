'use strict';

import React from 'react';
import { Provider } from 'react-redux';
import { createStore, combineReducers as reduxCombineReducers } from 'redux';
import { combineReducers as immutableCombineReducers } from 'redux-immutablejs';
import ui, { reducer } from '../../src';
import TestUtils from 'react-addons-test-utils';

let _combineReducers = reduxCombineReducers;
const setCombineReducers = (cr) => {
  _combineReducers = (cr === 'reduxCombineReducers') ? reduxCombineReducers : immutableCombineReducers;
}

let store = null;
const initStore = () => {
  store = createStore(_combineReducers({ ui: reducer }));
  return store;
}

const getUiState = (state, cr) => (cr === 'immutableCombineReducers') ? state.get('ui') : state.ui;

/**
 * Wrap given JSX with a provider contianing a store with the UI reducer
 */
const wrapWithProvider = (jsx) => (
  <Provider store={ initStore() }>
    { jsx }
  </Provider>
);

const render = (jsx) => {
  return TestUtils.renderIntoDocument(
    wrapWithProvider(jsx)
  );
}

const renderAndFind = (jsx, type = null) => {
  if (type === undefined) {
    type = jsx;
    jsx = <jsx />
  }
  const tree = render(jsx);
  return TestUtils.findRenderedComponentWithType(tree, type);
}

export {
  store,
  wrapWithProvider,
  render,
  renderAndFind,
  setCombineReducers,
  getUiState
}
