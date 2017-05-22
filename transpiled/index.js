'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.reducer = undefined;

var _ui = require('./ui');

var _ui2 = _interopRequireDefault(_ui);

var _actionReducer = require('./action-reducer');

var _actionReducer2 = _interopRequireDefault(_actionReducer);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = _ui2.default;
exports.reducer = _actionReducer2.default;