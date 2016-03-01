
const AppDispatcher = require('../dispatcher/app-dispatcher')
const AppConstants = require('../constants/app-constants')
const AppActions = require('../actions/app-actions')

const Store = require('./store')
const CaveStore = require('./cave-store')

const crash_reporter = require('../util/crash-reporter')
const github = require('../util/github')
const sf = require('../util/sf')
const market = require('../util/market')

let state = {}

let ReportStore = Object.assign(new Store('report-store'), {
  get_state: () => state
})

async function report_cave (payload) {
  let id = payload.id

  try {
    AppActions.cave_progress({id, reporting: true})
    let cave = CaveStore.find(id)
    let log_path = CaveStore.log_path(id)
    let game = market.get_entities('games')[cave.game_id]

    let game_log = await sf.read_file(log_path)

    let gist_data = {
      description: `itch log for ${game.title} — ${game.url}`,
      public: false,
      files: {}
    }
    let slug = /\/\/.*\/(.*)$/.exec(game.url)[1]
    gist_data.files[`${slug}-log.txt`] = {content: game_log}
    let gist = await github.create_gist(gist_data)

    let body =
`:rotating_light: ${game.classification} [${game.title}](${game.url}) is broken for me.

:book: Here's the complete [debug log](${gist.html_url}).

:running: Any additional details can go here!`

    crash_reporter.report_issue({
      type: `${game.classification} ${game.title} broken`,
      body
    })
  } catch (e) {
    console.log(`Error reporting cave: ${e.stack || e}`)
  } finally {
    AppActions.cave_progress({id, reporting: false})
  }
}

AppDispatcher.register('report-store', Store.action_listeners(on => {
  on(AppConstants.REPORT_CAVE, report_cave)
}))

module.exports = ReportStore
