
{ EventEmitter } = require "events"
AppDispatcher = require "../dispatcher/AppDispatcher"
AppConstants = require "../constants/AppConstants"
assign = require "object-assign"

CHANGE_EVENT = 'change'

_state = {
  game: null
  panel: "owned"
}

AppStore = assign {}, EventEmitter.prototype, {

  emit_change: ->
    @emit CHANGE_EVENT

  add_change_listener: (callback) ->
    @on CHANGE_EVENT, callback

  remove_change_listener: (callback) ->
    @removeListener CHANGE_EVENT, callback

  get_game: ->
    _state.game

  get_panel: ->
    _state.panel

}

AppDispatcher.register (action) ->

  switch action.actionType

    when AppConstants.VIEW_GAME
      _state.game = action.game
      AppStore.emit_change()

    when AppConstants.CLOSE_GAME
      _state.game = null
      AppStore.emit_change()

    when AppConstants.FOCUS_PANEL
      _state.panel = action.panel
      AppStore.emit_change()

module.exports = AppStore

