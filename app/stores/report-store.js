
let AppDispatcher = require('../dispatcher/app-dispatcher')
let AppConstants = require('../constants/app-constants')
let AppActions = require('../actions/app-actions')

let Store = require('./store')
let CaveStore = require('./cave-store')

let crash_reporter = require('../util/crash-reporter')
let github = require('../util/github')

let fs = require('../promised/fs')

let db = require('../util/db')

let state = {}

let ReportStore = Object.assign(new Store('report-store'), {
  get_state: () => state
})

async function report_cave (payload) {
  let id = payload.id

  try {
    AppActions.cave_progress({id, reporting: true})
    let cave = await CaveStore.find(id)
    let log_path = CaveStore.log_path(cave.install_location, payload.id)
    let game = await db.find_one({_table: 'games', id: cave.game_id})

    let game_log = await fs.readFileAsync(log_path, {encoding: 'utf8'})

    let gist_data = {
      description: `itch log for ${game.title} — ${game.url}`,
      public: false,
      files: {}
    }
    let slug = /\/\/.*\/(.*)$/.exec(game.url)[1]
    gist_data.files[`${slug}-log.txt`] = {content: game_log}
    let gist = await github.create_gist(gist_data)

    let body =
`:rotating_light: Game [${game.title}](${game.url}) is broken for me.

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
  on(AppConstants.CAVE_REPORT, report_cave)
}))

module.exports = ReportStore
