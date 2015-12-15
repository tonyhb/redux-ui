'use strict';

import React from 'react';
import { Provider } from 'react-redux';
import { createStore, combineReducers } from 'redux';
import ui, { reducer } from '../../src';
import TestUtils from 'react-addons-test-utils';

const store = createStore(combineReducers({ ui: reducer }));

/**
 * Wrap given JSX with a provider contianing a store with the UI reducer
 */
const wrapWithProvider = (jsx) => (
  <Provider store={ store }>
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
  renderAndFind
}
