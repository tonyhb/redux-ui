'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.reducerEnhancer = exports.defaultState = exports.SET_DEFAULT_UI_STATE = exports.UPDATE_UI_STATE = exports.MASS_UPDATE_UI_STATE = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

exports.default = reducer;
exports.updateUI = updateUI;
exports.massUpdateUI = massUpdateUI;
exports.setDefaultUI = setDefaultUI;
exports.unmountUI = unmountUI;
exports.mountUI = mountUI;

var _immutable = require('immutable');

var _invariant = require('invariant');

var _invariant2 = _interopRequireDefault(_invariant);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// For updating multiple UI variables at once.  Each variable might be part of
// a different context; this means that we need to either call updateUI on each
// key of the object to update or do transformations within one action in the
// reducer. The latter only triggers one store change event and is more
// performant.
var MASS_UPDATE_UI_STATE = exports.MASS_UPDATE_UI_STATE = '@@redux-ui/MASS_UPDATE_UI_STATE';
var UPDATE_UI_STATE = exports.UPDATE_UI_STATE = '@@redux-ui/UPDATE_UI_STATE';
var SET_DEFAULT_UI_STATE = exports.SET_DEFAULT_UI_STATE = '@@redux-ui/SET_DEFAULT_UI_STATE';

// These are private consts used in actions only given to the UI decorator.
var MOUNT_UI_STATE = '@@redux-ui/MOUNT_UI_STATE';
var UNMOUNT_UI_STATE = '@@redux-ui/UNMOUNT_UI_STATE';

var defaultState = exports.defaultState = new _immutable.Map({
  __reducers: new _immutable.Map({
    // This contains a map of component paths (joined by '.') to an object
    // containing the fully qualified path and the reducer function:
    // 'parent.child': {
    //   path: ['parent', 'child'],
    //   func: (state, action) => { ... }
    // }
  })
});

function reducer() {
  var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : defaultState;
  var action = arguments[1];

  var key = action.payload && (action.payload.key || []);

  if (!Array.isArray(key)) {
    key = [key];
  }

  // Let ui reducer handle custom actions.
  state.entrySeq().forEach(function (_ref) {
    var _ref2 = _slicedToArray(_ref, 2),
        key = _ref2[0],
        value = _ref2[1];

    var handleAction = value.get('handleAction');
    if (handleAction && handleAction.hasOwnProperty(action.type)) {
      (function () {
        var transforms = handleAction[action.type](value.toObject(), action);
        if ((typeof transforms === 'undefined' ? 'undefined' : _typeof(transforms)) === 'object' && transforms.toString() === '[object Object]') {
          state = state.withMutations(function (s) {
            Object.keys(transforms).forEach(function (k) {
              if (!value.has(k)) {
                throw new Error('Couldn\'t find variable ' + k + ' within your component\'s UI state ' + ('context. Define ' + k + ' before using it in the @ui decorator'));
              }
              s.setIn([key, k], transforms[k]);
            });
          });
        }
      })();
    }
  });

  (function () {
    switch (action.type) {
      case UPDATE_UI_STATE:
        var _action$payload = action.payload,
            name = _action$payload.name,
            value = _action$payload.value;

        state = state.setIn(key.concat(name), value);
        break;

      case MASS_UPDATE_UI_STATE:
        var _action$payload2 = action.payload,
            uiVars = _action$payload2.uiVars,
            transforms = _action$payload2.transforms;

        state = state.withMutations(function (s) {
          Object.keys(transforms).forEach(function (k) {
            var path = uiVars[k];
            (0, _invariant2.default)(path, 'Couldn\'t find variable ' + k + ' within your component\'s UI state ' + ('context. Define ' + k + ' before using it in the @ui decorator'));

            s.setIn(path.concat(k), transforms[k]);
          });
        });
        break;

      case SET_DEFAULT_UI_STATE:
        // Replace all UI under a key with the given values
        state = state.setIn(key, new _immutable.Map(action.payload.value));
        break;

      case MOUNT_UI_STATE:
        var _action$payload3 = action.payload,
            defaults = _action$payload3.defaults,
            customReducer = _action$payload3.customReducer;

        state = state.withMutations(function (s) {
          // Set the defaults for the component
          s.setIn(key, new _immutable.Map(defaults));

          // If this component has a custom reducer add it to the list.
          // We store the reducer func and UI path for the current component
          // inside the __reducers map.
          if (customReducer) {
            var path = key.join('.');
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
        state = state.withMutations(function (s) {
          s.deleteIn(key);
          // Remove any custom reducers
          s.deleteIn(['__reducers', key.join('.')]);
        });
        break;
    }
  })();

  var customReducers = state.get('__reducers');
  if (customReducers.size > 0) {
    state = state.withMutations(function (mut) {
      customReducers.forEach(function (r) {
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
        var path = r.path,
            func = r.func;

        var newState = func(mut.getIn(path), action);
        if (newState === undefined) {
          throw new Error('Your custom UI reducer at path ' + path.join('.') + ' must return some state');
        }
        mut.setIn(path, newState);
      });
      return mut;
    });
  }

  return state;
}

var reducerEnhancer = exports.reducerEnhancer = function reducerEnhancer(customReducer) {
  return function (state, action) {
    state = reducer(state, action);
    if (typeof customReducer === 'function') {
      state = customReducer(state, action);
    }
    return state;
  };
};

function updateUI(key, name, value) {
  return {
    type: UPDATE_UI_STATE,
    payload: {
      key: key,
      name: name,
      value: value
    }
  };
};

function massUpdateUI(uiVars, transforms) {
  return {
    type: MASS_UPDATE_UI_STATE,
    payload: {
      uiVars: uiVars,
      transforms: transforms
    }
  };
}

// Exposed to components, allowing them to reset their and all child scopes to
// the default variables set up
function setDefaultUI(key, value) {
  return {
    type: SET_DEFAULT_UI_STATE,
    payload: {
      key: key,
      value: value
    }
  };
};

/** Private, decorator only actions **/

// This is not exposed to your components; it's only used in the decorator.
function unmountUI(key) {
  return {
    type: UNMOUNT_UI_STATE,
    payload: {
      key: key
    }
  };
};

/**
 * Given the key/path, set of defaults and custom reducer for a UI component
 * during construction prepare the state of the UI reducer
 *
 */
function mountUI(key, defaults, customReducer) {
  return {
    type: MOUNT_UI_STATE,
    payload: {
      key: key,
      defaults: defaults,
      customReducer: customReducer
    }
  };
}