'use strict';

import { assert } from 'chai'; 
import React, { Component } from 'react';
import TestUtils from 'react-addons-test-utils';

import ui, { reducer } from '../../src';
import { render, renderAndFind } from '../utils/render.js';

describe('key generation', () => {

  class Test extends Component {
    render() { return <p>Hi</p>; }
  }
  const testKey = 'testKey'

  const WrappedTestWithoutKey = ui({})(Test);
  const WrappedTestWithKey = ui({key: testKey})(Test);

  describe('opts.key === undefined', () => {
    it('assigns a random key to the component', () => {
      const tree = render(
        <div>
          <WrappedTestWithoutKey />
          <WrappedTestWithoutKey />
          <WrappedTestWithoutKey />
        </div>
      );
      const comps = TestUtils
        .scryRenderedComponentsWithType(tree, Test);
      const { uiKey } = comps[0].props;

      // Check basic setup of the UI key within the first component
      assert(uiKey !== '', 'uiKey is not empty');
      assert(uiKey.substr(0, 'Test'.length) === 'Test', 'Key begins with component name');
      assert(uiKey.length >= ('Test'.length + 5));

      // Ensure that all three components have unique IDs by creating a set
      // of each key and checking the set's length
      const uniqs = Array.from(new Set(comps.map(c => c.props.uiKey)));
      assert(uniqs.length === 3, 'Two unique keys are specified');
    });
  });

  describe('opts.key !== undefined', () => {
    it('uses the specified key', () => {
      const tree = render(<WrappedTestWithKey />);
      const c = TestUtils.findRenderedComponentWithType(tree, Test);
      const { uiKey } = c.props;

      // Check basic setup of the UI key within the first component
      assert(uiKey === testKey, 'uiKey matches opts.key');
    });
  });

  describe('props.uiPath', () => {
    it('exposes uiPath', () => {
      const c = renderAndFind(<WrappedTestWithKey />, Test);
      const { uiPath } = c.props;

      // Check basic setup of the UI key within the first component
      assert.equal(uiPath, testKey);
    });
  });

});
