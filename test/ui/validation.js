'use strict';

import { assert } from 'chai'; 
import React, { Component } from 'react';
import TestUtils from 'react-addons-test-utils';
import shallowEqual from 'react-redux/lib/utils/shallowEqual';

import ui, { reducer } from '../../src';
import { render, renderAndFind } from '../utils/render.js';

describe('Prop validation', () => {
  class Child extends Component {
    render = () => <p>Child</p>
  }
  const UIChild = ui({ state: { name: 'child' } })(Child);

  it('only allows you to set defined variables in a single-level tree', () => {
    const child = renderAndFind(<UIChild />, Child);
    assert.throws(() => child.props.updateUI({ foo: 1 }));
  });
});

