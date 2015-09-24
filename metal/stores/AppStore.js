(function() {
  var AppConstants, AppDispatcher, AppStore, CHANGE_EVENT, EventEmitter, _state, assign;

  EventEmitter = require("events").EventEmitter;

  AppDispatcher = require("../dispatcher/AppDispatcher");

  AppConstants = require("../constants/AppConstants");

  assign = require("object-assign");

  CHANGE_EVENT = 'change';

  _state = {
    game: null,
    panel: "owned"
  };

  AppStore = assign({}, EventEmitter.prototype, {
    emit_change: function() {
      return this.emit(CHANGE_EVENT);
    },
    add_change_listener: function(callback) {
      return this.on(CHANGE_EVENT, callback);
    },
    remove_change_listener: function(callback) {
      return this.removeListener(CHANGE_EVENT, callback);
    },
    get_game: function() {
      return _state.game;
    },
    get_panel: function() {
      return _state.panel;
    }
  });

  AppDispatcher.register(function(action) {
    switch (action.actionType) {
      case AppConstants.VIEW_GAME:
        _state.game = action.game;
        return AppStore.emit_change();
      case AppConstants.CLOSE_GAME:
        _state.game = null;
        return AppStore.emit_change();
      case AppConstants.FOCUS_PANEL:
        _state.panel = action.panel;
        return AppStore.emit_change();
    }
  });

  module.exports = AppStore;

}).call(this);
