'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

exports.default = ui;

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _propTypes = require('prop-types');

var _redux = require('redux');

var _reactRedux = require('react-redux');

var _invariant = require('invariant');

var _invariant2 = _interopRequireDefault(_invariant);

var _shallowEqual = require('react-pure-render/shallowEqual');

var _shallowEqual2 = _interopRequireDefault(_shallowEqual);

var _actionReducer = require('./action-reducer');

var _ReduxUIStoreContext = require('./ReduxUIStoreContext');

var _utils = require('./utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function ui(key) {
    var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    if ((typeof key === 'undefined' ? 'undefined' : _typeof(key)) === 'object') {
        opts = key;
        key = opts.key;
    }

    var connector = (0, _reactRedux.connect)(function (state) {
        return { ui: (0, _utils.getUIState)(state) };
    }, function (dispatch) {
        return (0, _redux.bindActionCreators)({
            updateUI: _actionReducer.updateUI,
            massUpdateUI: _actionReducer.massUpdateUI,
            setDefaultUI: _actionReducer.setDefaultUI,
            mountUI: _actionReducer.mountUI,
            unmountUI: _actionReducer.unmountUI
        }, dispatch);
    },
    // These allow you to pass 'mergeProps' and 'options' keys into the
    // UI decorator's options which will be passed to @connect().
    // TODO: Document
    opts.mergeProps, opts.options);

    return function (WrappedComponent) {
        var _class, _temp;

        // Return a parent UI class which scopes all UI state to the given key
        /**
         * UI is a wrapper component which:
         *   1. Inherits any parent scopes from parent components that are wrapped
         *      by @UI
         *   2. Sets up a new UI scope for the current component
         *   3. Merges the current UI scope into the parent UI scope (where the
         *      current scope takes precedence over parents)
         *
         * This allows normal block-scoping of UI state:
         *
         *   1. All UI components must define their local state keys
         *   2. Upon updating a state key, if it's not in the current scope
         *      walk up the tree until the variable is set
         *
         * This means that any child component can affect the current browser
         * chrome's UI state whilst maintaining their own local UI state.
         *
         * All state will be blown away on navigation by default.
         */
        var UI = (_temp = _class = function (_Component) {
            _inherits(UI, _Component);

            function UI(props, ctx, queue) {
                _classCallCheck(this, UI);

                var _this = _possibleConstructorReturn(this, (UI.__proto__ || Object.getPrototypeOf(UI)).call(this, props, ctx, queue));

                _this.resetUI = _this.resetUI.bind(_this);
                _this.updateUI = _this.updateUI.bind(_this);

                // If the key is undefined generate a new random hex key for the
                // current component's UI scope.
                //
                // We do this in construct() to guarantee a new key at component
                // instantiation time wihch is needed for iterating through a list of
                // components with no explicit key
                if (key === undefined) {
                    _this.key = (WrappedComponent.displayName || WrappedComponent.name) + Math.floor(Math.random() * (1 << 30)).toString(16);
                } else {
                    _this.key = key;
                }

                // Immediately set this.uiPath and this.uiVars based on the incoming
                // context in class instantiation
                _this.getMergedContextVars(_this.context);
                return _this;
            }

            _createClass(UI, [{
                key: 'componentWillMount',


                // Pass these down in the new context created for this component
                // static childContextTypes = {
                //     // uiKey is the name of the parent context's key
                //     uiKey: string,
                //     // uiPath is the current path of the UI context
                //     uiPath: array,
                //     // uiVars is a map of UI variable names stored in state to the parent
                //     // context which controls them.
                //     uiVars: object,
                //
                //     // Actions to pass to children
                //     updateUI: func,
                //     resetUI: func
                // }
                //
                // // Get the existing context from a UI parent, if possible
                // static contextTypes = {
                //     // This is used in mergeUIProps and construct() to immediately set
                //     // props.
                //
                //     uiKey: string,
                //     uiPath: array,
                //     uiVars: object,
                //
                //     updateUI: func,
                //     resetUI: func
                // }

                value: function componentWillMount() {
                    // If the component's UI subtree doesn't exist and we have state to
                    // set ensure we update our global store with the current state.
                    if (this.props.ui.getIn(this.uiPath) === undefined && opts.state) {
                        var state = this.getDefaultUIState(opts.state);
                        this.context.store.dispatch((0, _actionReducer.mountUI)(this.uiPath, state, opts.reducer));
                    }
                }

                // When a parent context calls resetUI it blows away the entire subtree
                // that any child contexts may store state in.
                //
                // We may need to restore default props for this component if a parent
                // has blown away our state.

            }, {
                key: 'componentWillReceiveProps',
                value: function componentWillReceiveProps(nextProps) {
                    // We can only see if this component's state is blown away by
                    // accessing the current global UI state; the parent will not
                    // necessarily always pass down child state.
                    var ui = (0, _utils.getUIState)(this.context.store.getState());
                    if (ui.getIn(this.uiPath) === undefined && opts.state) {
                        var state = this.getDefaultUIState(opts.state, nextProps);
                        this.props.setDefaultUI(this.uiPath, state);
                    }
                }

                // Get default state by evaluating any functions passed in to the state
                // opts.
                // This is also used within componentWilLReceiveProps and so props
                // also needs to be passed in

            }, {
                key: 'getDefaultUIState',
                value: function getDefaultUIState(uiState) {
                    var _this2 = this;

                    var props = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.props;

                    var globalState = this.context.store.getState();
                    var state = _extends({}, uiState);
                    Object.keys(state).forEach(function (k) {
                        if (typeof state[k] === 'function') {
                            state[k] = state[k](_this2.props, globalState);
                        }
                    });
                    return state;
                }

                // Blow away all UI state for this component key by setting the
                // state for this key to undefined. This will get reset to the
                // default state in componentWillMount in the future.
                //
                // We use requestAnimationFrame because `@ui()` can be combined with
                // with `@connect()`; if the connect decorator uses selectors based on
                // UI state (such as live filtering) the connect decorator will receive
                // `undefined` as `this.props.ui` before unmounting.
                //
                // requestAnimationFrame avoids this.

            }, {
                key: 'componentWillUnmount',
                value: function componentWillUnmount() {
                    var _this3 = this;

                    if (opts.persist !== true) {
                        if (window && window.requestAnimationFrame) {
                            window.requestAnimationFrame(function () {
                                return _this3.props.unmountUI(_this3.uiPath);
                            });
                        } else {
                            this.props.unmountUI(this.uiPath);
                        }
                    }
                }

                // Sets this.uiVars && this.uiPath.
                //
                // Merges this UI context's variables with any parent context's
                // variables defined in uiVars.

            }, {
                key: 'getMergedContextVars',
                value: function getMergedContextVars() {
                    var _this4 = this;

                    var ctx = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.context;

                    if (!this.uiVars || !this.uiPath) {
                        var uiPath = ctx.uiPath || [];
                        this.uiPath = uiPath.concat(this.key);

                        // Keep trackof each UI variable and which path it should be set in
                        var state = opts.state || {};
                        this.uiVars = _extends({}, ctx.uiVars) || {};
                        Object.keys(state).forEach(function (k) {
                            return _this4.uiVars[k] = _this4.uiPath;
                        }, this);
                    }

                    return [this.uiVars, this.uiPath];
                }

                // Construct a new context for all child UI components. We need to merge
                // in the vars defined in opts.state to uiVars to explicitly state that
                // this context is in charge of those variables.
                //
                // Pass the uiKey and partially applied updateUI function to all
                // child components that are wrapped in a plain `@ui()` decorator

            }, {
                key: 'getContextForChild',
                value: function getContextForChild() {
                    var _getMergedContextVars = this.getMergedContextVars(),
                        _getMergedContextVars2 = _slicedToArray(_getMergedContextVars, 2),
                        uiVars = _getMergedContextVars2[0],
                        uiPath = _getMergedContextVars2[1];

                    return {
                        store: this.context.store,
                        uiKey: this.key,
                        uiVars: uiVars,
                        uiPath: uiPath,

                        updateUI: this.updateUI,
                        resetUI: this.resetUI
                    };
                }

                // Helper function to reset UI for the current context **and all child
                // scopes**.
                //
                // This is the same as exiting scope in programming; all variables
                // defined within the scope are reset.

            }, {
                key: 'resetUI',
                value: function resetUI() {
                    this.props.setDefaultUI(this.uiPath, this.getDefaultUIState(opts.state));
                    // TODO: Wipe all child contexts
                }
            }, {
                key: 'updateUI',
                value: function updateUI(name, value) {
                    // Get a list of all UI variables available to this context (which
                    var _getMergedContextVars3 = this.getMergedContextVars(),
                        _getMergedContextVars4 = _slicedToArray(_getMergedContextVars3, 1),
                        uiVars = _getMergedContextVars4[0];

                    var uiVarPath = uiVars[name];

                    if ((typeof name === 'undefined' ? 'undefined' : _typeof(name)) === 'object' && value === undefined) {
                        // We're mass updating many UI variables. These may or may not be
                        // directly controlled by our context, so we delegate to the
                        // reducer which will deeply set each variable according to its
                        // uiPath (from uiVars).
                        //
                        // Doing this means we only trigger one store update.
                        this.props.massUpdateUI(this.uiVars, name);
                        return;
                    }

                    (0, _invariant2.default)(uiVarPath, 'The \'' + name + '\' UI variable is not defined in the UI context in "' + (WrappedComponent.displayName || WrappedComponent.name) + '" ' + 'or any parent UI context. Set this variable using the "state" ' + 'option in the @ui decorator before using it.');

                    this.props.updateUI(uiVarPath, name, value);
                }

                // Iterate through the list of contexts merging in UI variables from the
                // UI store

            }, {
                key: 'mergeUIProps',
                value: function mergeUIProps() {
                    var _this5 = this;

                    // WARNING: React has a subtle componentWillMount bug which we're
                    // working around here!
                    //
                    // ## React bug
                    //
                    // On the first *ever* render of this component we set defaults in
                    // componentWillMount. This works; when `render()` is called the
                    // wrapped component has the default props within this.props.ui
                    //
                    // BUT.  Unmount, navigate away then return to this component.  When
                    // componentWillMount is called a *second* time, we call updateUI to
                    // set default props. **These aren't passed in to render() until the
                    // component is mounted a second time**. Even though it worked first
                    // time. And even though this is a new instance of the component.
                    //
                    // ## Workaround.
                    //
                    // Instead of relying on this.props.ui from our connector we call
                    // getState() in the store directly here. We guarantee that this will
                    // be the latest set of props, including default props set in
                    // componentWillMount.
                    //
                    // We still use @connect() to connect to the store and listen for
                    // changes in other cases.
                    var ui = (0, _utils.getUIState)(this.context.store.getState());

                    var result = Object.keys(this.uiVars).reduce(function (props, k) {
                        props[k] = ui.getIn(_this5.uiVars[k].concat(k));
                        return props;
                    }, {}) || {};

                    // If this slice of the UI has not changed (shallow comparison),
                    // then use an old copy of the slice to prevent unnecessary
                    // re-rendering
                    if (!(0, _shallowEqual2.default)(this.__previousMergeResult, result)) {
                        this.__previousMergeResult = result;
                    }
                    return this.__previousMergeResult;
                }
            }, {
                key: 'render',
                value: function render() {
                    return _react2.default.createElement(
                        _ReduxUIStoreContext.ReduxUIStoreContext.Provider,
                        { value: this.getContextForChild() },
                        _react2.default.createElement(WrappedComponent, _extends({}, this.props, {
                            uiKey: this.key,
                            uiPath: this.uiPath,
                            ui: this.mergeUIProps(),
                            resetUI: this.resetUI,
                            updateUI: this.updateUI }))
                    );
                }
            }]);

            return UI;
        }(_react.Component), _class.propTypes = {
            // The entire global UI state via react-redux connector
            ui: _propTypes.object.isRequired,
            // These actions are passed via react-redux connector
            setDefaultUI: _propTypes.func.isRequired,
            updateUI: _propTypes.func.isRequired,
            massUpdateUI: _propTypes.func.isRequired }, _temp);


        UI.contextType = _ReduxUIStoreContext.ReduxUIStoreContext;

        return connector(UI);
    };
}