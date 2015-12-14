'use strict';


import { assert } from 'chai'; 
import { reducer } from '../../src';
import ui from '../../src/ui';

import React, { Component } from 'react';
import TestUtils from 'react-addons-test-utils';

// redux
import { createStore, combineReducers } from 'redux';
import { Provider } from 'react-redux';
let store = createStore(combineReducers({ ui: reducer }));

describe('key generation', () => {

  class TestWithoutKey extends Component {
    render() { return <p>Hi</p>; }
  }
  const WrappedTestWithoutKey = ui({})(TestWithoutKey);

  describe('opts.key === undefined', () => {
    it('assigns a random key to the component', () => {
      const tree = TestUtils.renderIntoDocument(
        <Provider store={ store }>
          <div>
            <WrappedTestWithoutKey />
            <WrappedTestWithoutKey />
            <WrappedTestWithoutKey />
          </div>
        </Provider>
      );
      const comps = TestUtils
        .scryRenderedComponentsWithType(tree, TestWithoutKey);
      const { uiKey } = comps[0].props;

      // Check basic setup of the UI key within the first component
      assert(uiKey !== '', 'uiKey is not empty');
      assert(uiKey.substr(0, 'TestWithoutKey'.length) === 'TestWithoutKey', 'Key begins with component name');
      assert(uiKey.length >= ('TestWithoutKey'.length + 5));

      // Ensure that all three components have unique IDs by creating a set
      // of each key and checking the set's length
      const uniqs = Array.from(new Set(comps.map(c => c.props.uiKey)));
      assert(uniqs.length === 3, 'Two unique keys are specified');
    });
  });

});
