'use strict';

import { assert } from 'chai';
import React, { Component } from 'react';
import ReactTestUtils from 'react-dom/test-utils';

import ui, { reducer } from '../../src';
import { render, renderAndFind } from '../utils/render.js';

describe('display name', () => {
  class Test extends Component {
    render() { return <p>Hi</p>; }
  }

  const WrappedTest = ui()(Test);

  it('assigns a displayName using the wrapped component\'s name', () => {
    assert(WrappedTest.displayName === 'Connect(UI(Test))', 'displayName set correctly');
  });
});
