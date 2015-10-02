(function() {
  var AppActions, AppConstants, AppDispatcher, AppInstall, AppStore, Humanize, InstallState, api, app, db, defer, fileutils, fs, fstream, install, keyMirror, mkdirp, path, progress, request;

  app = require("app");

  path = require("path");

  fs = require("fs");

  request = require("request");

  progress = require("request-progress");

  fstream = require("fstream");

  mkdirp = require("mkdirp");

  Humanize = require("humanize-plus");

  keyMirror = require("keymirror");

  defer = require("./defer");

  fileutils = require("./fileutils");

  api = require("./api");

  db = require("./db");

  AppDispatcher = require("./dispatcher/AppDispatcher");

  AppConstants = require("./constants/AppConstants");

  AppActions = require("./actions/AppActions");

  AppStore = require("./stores/AppStore");

  InstallState = keyMirror({
    PENDING: null,
    SEARCHING_UPLOAD: null,
    DOWNLOADING: null,
    EXTRACTING: null,
    CONFIGURING: null,
    RUNNING: null,
    ERROR: null,
    IDLE: null
  });

  AppInstall = (function() {
    AppInstall.library_dir = path.join(app.getPath("home"), "Downloads", "itch.io");

    AppInstall.archives_dir = path.join(AppInstall.library_dir, "archives");

    AppInstall.apps_dir = path.join(AppInstall.library_dir, "apps");

    AppInstall.by_id = {};

    function AppInstall() {}

    AppInstall.prototype.setup = function(opts) {
      var data;
      data = {
        _table: 'installs',
        game_id: opts.game.id,
        state: InstallState.PENDING
      };
      return db.insert(data).then((function(_this) {
        return function(record) {
          return _this.load(record);
        };
      })(this));
    };

    AppInstall.prototype.load = function(record) {
      this.id = record._id;
      AppInstall.by_id[this.id] = this;
      this.game_id = record.game_id;
      this.progress = 0;
      return db.findOne({
        _table: 'games',
        id: this.game_id
      }).then((function(_this) {
        return function(game) {
          _this.game = game || (function() {
            throw new Error("game not found: " + this.game_id);
          }).call(_this);
          return console.log("found game: " + (JSON.stringify(_this.game)));
        };
      })(this)).then((function(_this) {
        return function() {
          return _this.app_path || db.findOne({
            _table: 'users',
            id: _this.game.user_id
          }).then(function(user) {
            var slug, username;
            console.log("found user: " + (JSON.stringify(user)));
            username = user.username;
            slug = _this.game.url.match(/[^\/]+$/);
            return _this.app_path = path.join(AppInstall.apps_dir, slug + "-by-" + username);
          });
        };
      })(this)).then((function(_this) {
        return function() {
          _this.set_state(record.state);
          console.log("Loaded install " + _this.id + " with state " + _this.state);
          switch (_this.state) {
            case InstallState.PENDING:
              return defer(function() {
                return _this.start();
              });
          }
        };
      })(this));
    };

    AppInstall.prototype.set_state = function(state) {
      console.log("Install " + this.id + ", [" + this.state + " -> " + state + "]");
      this.state = state;
      return this.emit_change();
    };

    AppInstall.prototype.emit_change = function() {
      return defer((function(_this) {
        return function() {
          return AppActions.install_progress(_this);
        };
      })(this));
    };

    AppInstall.prototype.start = function() {
      return this.search_for_uploads();
    };

    AppInstall.prototype.search_for_uploads = function() {
      var client;
      this.set_state(InstallState.SEARCHING_UPLOAD);
      client = AppStore.get_current_user();
      return db.findOne({
        _table: 'download_keys',
        game_id: this.game.id
      }).then((function(_this) {
        return function(key) {
          console.log("tried to find download key for " + _this.game.id + ", got " + (JSON.stringify(key)));
          if (key) {
            _this.key = key;
            return client.download_key_uploads(_this.key.id);
          } else {
            return client.game_uploads(_this.game.id);
          }
        };
      })(this)).then((function(_this) {
        return function(res) {
          var interesting_uploads, prop, scored_uploads, uploads;
          uploads = res.uploads;
          prop = (function() {
            switch (process.platform) {
              case "darwin":
                return "p_osx";
              case "win32":
                return "p_windows";
              case "linux":
                return "p_linux";
            }
          })();
          interesting_uploads = uploads.filter(function(upload) {
            return !!upload[prop];
          });
          scored_uploads = interesting_uploads.map(function(upload) {
            var filename, score;
            score = 0;
            filename = upload.filename.toLowerCase();
            if (/\.zip$/.test(filename)) {
              score += 10;
            }
            if (/soundtrack/.test(filename)) {
              score -= 100;
            }
            return upload.merge({
              score: score
            });
          });
          scored_uploads = scored_uploads.sort(function(a, b) {
            return b.score - a.score;
          });
          console.log("Scored uploads\n" + (JSON.stringify(scored_uploads)));
          if (scored_uploads.length) {
            return _this.set_upload(scored_uploads[0]);
          } else {
            _this.set_state(InstallState.ERROR);
            return AppActions.notify("No uploads found for " + _this.game.title);
          }
        };
      })(this));
    };

    AppInstall.prototype.set_upload = function(upload1) {
      var archive_name, ext;
      this.upload = upload1;
      console.log("Choosing to download " + this.upload.filename);
      ext = fileutils.ext(this.upload.filename);
      archive_name = "upload-" + this.upload.id + ext;
      this.archive_path = path.join(AppInstall.archives_dir, archive_name);
      return this.get_url();
    };

    AppInstall.prototype.get_url = function() {
      var client;
      this.set_state(InstallState.DOWNLOADING);
      client = AppStore.get_current_user();
      return (this.key ? client.download_upload_with_key(this.key.id, this.upload.id) : client.download_upload(this.upload.id)).then((function(_this) {
        return function(res) {
          _this.url = res.url;
          return defer(function() {
            return _this.download();
          });
        };
      })(this));
    };

    AppInstall.prototype.download = function() {
      var dst, flags, headers, r;
      this.set_state(InstallState.DOWNLOADING);
      headers = {};
      flags = 'w';
      if (this.local_size) {
        headers['Range'] = "bytes=" + this.local_size + "-";
        flags = 'a';
      } else if (fs.existsSync(this.archive_path)) {
        console.log("Have existing archive at " + this.archive_path + ", checking size");
        request.head(this.url).on('response', (function(_this) {
          return function(response) {
            var content_length, diff, stats;
            content_length = response.headers['content-length'];
            stats = fs.lstatSync(_this.archive_path);
            console.log((Humanize.fileSize(content_length)) + " (remote file size)");
            console.log((Humanize.fileSize(stats.size)) + " (local file size)");
            diff = content_length - stats.size;
            if (diff > 0) {
              console.log("Should download remaining " + (Humanize.fileSize(diff)) + " bytes.");
              _this.local_size = stats.size;
              return _this.get_url();
            } else {
              console.log("All good.");
              return _this.extract();
            }
          };
        })(this));
        return;
      }
      console.log("Downloading with headers " + (JSON.stringify(headers)) + ", flags = " + flags);
      r = progress(request.get({
        encoding: null,
        url: this.url,
        headers: headers
      }), {
        throttle: 25
      });
      r.on('response', (function(_this) {
        return function(response) {
          var content_length;
          console.log("Got status code: " + response.statusCode);
          content_length = response.headers['content-length'];
          return console.log("Downloading " + (Humanize.fileSize(content_length)) + " for " + _this.game.title);
        };
      })(this));
      r.on('error', (function(_this) {
        return function(err) {
          return console.log("Download error: " + (JSON.stringify(err)));
        };
      })(this));
      r.on('progress', (function(_this) {
        return function(state) {
          _this.progress = 0.01 * state.percent;
          return _this.emit_change();
        };
      })(this));
      mkdirp.sync(path.dirname(this.archive_path));
      dst = fs.createWriteStream(this.archive_path, {
        flags: flags,
        defaultEncoding: "binary"
      });
      return r.pipe(dst).on('close', (function(_this) {
        return function() {
          _this.progress = 0;
          _this.emit_change();
          AppActions.bounce();
          AppActions.notify(_this.game.title + " finished downloading.");
          return _this.extract();
        };
      })(this));
    };

    AppInstall.prototype.extract = function() {
      this.set_state(InstallState.EXTRACTING);
      return require("./extractor").extract(this.archive_path, this.app_path).progress((function(_this) {
        return function(state) {
          console.log("Progress callback! " + state.percent);
          _this.progress = 0.01 * state.percent;
          return _this.emit_change();
        };
      })(this)).then((function(_this) {
        return function(res) {
          _this.progress = 0;
          _this.emit_change();
          console.log("Extracted " + res.total_size + " bytes total");
          return _this.set_state(InstallState.IDLE);
        };
      })(this))["catch"]((function(_this) {
        return function(e) {
          _this.set_state(InstallState.ERROR);
          console.log(e);
          return AppActions.notify("Failed to extract " + _this.game.title);
        };
      })(this));
    };

    AppInstall.prototype.configure = function() {
      this.set_state(InstallState.CONFIGURING);
      return require("./configurator").configure(this.app_path).then((function(_this) {
        return function(res) {
          _this.executables = res.executables;
          if (_this.executables.length > 0) {
            console.log("Configuration successful");
            return defer(function() {
              return _this.launch();
            });
          } else {
            _this.set_state(InstallState.ERROR);
            console.log("No executables found");
            return AppActions.notify("Failed to configure " + _this.game.title);
          }
        };
      })(this));
    };

    AppInstall.prototype.launch = function() {
      var candidates, exec_path, orig_path;
      this.set_state(InstallState.RUNNING);
      console.log("Launching " + this.game.title + ", " + this.executables.length + " available");
      candidates = (function() {
        var i, len, ref, results;
        ref = this.executables;
        results = [];
        for (i = 0, len = ref.length; i < len; i++) {
          orig_path = ref[i];
          exec_path = path.normalize(orig_path);
          results.push({
            exec_path: exec_path,
            depth: exec_path.split(path.sep).length
          });
        }
        return results;
      }).call(this);
      candidates.sort(function(a, b) {
        return a.depth - b.depth;
      });
      console.log("choosing " + candidates[0].exec_path + " out of candidates\n " + (JSON.stringify(candidates)));
      return require("./launcher").launch(candidates[0].exec_path).then((function(_this) {
        return function(res) {
          console.log(res);
          return AppActions.notify(res);
        };
      })(this))["catch"]((function(_this) {
        return function(e) {
          var msg;
          msg = _this.game.title + " crashed with code " + e.code;
          console.log(msg);
          console.log("...executable path: " + e.exe_path);
          return AppActions.notify(msg);
        };
      })(this))["finally"]((function(_this) {
        return function() {
          return _this.set_state(InstallState.IDLE);
        };
      })(this));
    };

    return AppInstall;

  })();

  install = function() {
    return AppDispatcher.register(function(action) {
      switch (action.action_type) {
        case AppConstants.DOWNLOAD_QUEUE:
          return db.findOne({
            _table: 'installs',
            game_id: action.opts.game.id
          }).then((function(_this) {
            return function(record) {
              if (record) {
                install = AppInstall.by_id[record._id];
                return install.configure();
              } else {
                install = new AppInstall();
                return install.setup(action.opts);
              }
            };
          })(this));
        case AppConstants.LOGIN_DONE:
          return db.find({
            _table: 'installs'
          }).then(function(records) {
            var i, len, record, results;
            results = [];
            for (i = 0, len = records.length; i < len; i++) {
              record = records[i];
              install = new AppInstall();
              results.push(install.load(record));
            }
            return results;
          });
      }
    });
  };

  module.exports = {
    install: install
  };

}).call(this);

//# sourceMappingURL=../app/maps/metal/install_manager.js.map
