(function() {
  var Client, Immutable, Promise, User, client, request,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  request = require("request-promise");

  Promise = require("bluebird");

  Immutable = require("seamless-immutable");

  Client = (function() {
    function Client() {
      this.login_key = bind(this.login_key, this);
    }

    Client.prototype.root_url = "https://itch.io/api/1";

    Client.prototype.request = function(method, path, data) {
      var options, uri;
      uri = "" + this.root_url + path;
      options = {
        method: method,
        uri: uri
      };
      switch (method.toLowerCase()) {
        case 'get':
          options.qs = data;
          break;
        case 'post':
          options.form = data;
      }
      return request(options).then(JSON.parse).then((function(_this) {
        return function(res) {
          if (res.errors) {
            return Promise.reject(Immutable(res.errors));
          } else {
            return Immutable(res);
          }
        };
      })(this));
    };

    Client.prototype.login_key = function(key) {
      return this.request("post", "/" + key + "/me", {
        source: "desktop"
      });
    };

    Client.prototype.login_with_password = function(username, password) {
      return this.request("post", "/login", {
        username: username,
        password: password,
        source: "desktop"
      });
    };

    return Client;

  })();

  User = (function() {
    function User(client1, key1) {
      this.client = client1;
      this.key = key1;
      if (!this.key) {
        throw Error("Missing key for user");
      }
    }

    User.prototype.request = function(method, url, params) {
      url = "/" + this.key + url;
      return this.client.request(method, url, params);
    };

    User.prototype.my_games = function() {
      return this.request("get", "/my-games");
    };

    User.prototype.my_owned_keys = function() {
      return this.request("get", "/my-owned-keys");
    };

    User.prototype.my_claimed_keys = function() {
      return this.request("get", "/my-claimed-keys");
    };

    User.prototype.me = function() {
      return this.request("get", "/me");
    };

    User.prototype.my_collections = function() {
      return this.request("get", "/my-collections");
    };

    User.prototype.download_key_uploads = function(download_key_id) {
      return this.request("get", "/download-key/" + download_key_id + "/uploads");
    };

    User.prototype.download_upload_with_key = function(download_key_id, upload_id) {
      return this.request("get", "/download-key/" + download_key_id + "/download/" + upload_id);
    };

    User.prototype.game_uploads = function(game_id) {
      return this.request("get", "/game/" + game_id + "/uploads");
    };

    User.prototype.download_upload = function(upload_id) {
      return this.request("get", "/upload/" + upload_id + "/download");
    };

    return User;

  })();

  client = new Client;

  module.exports = {
    client: client,
    Client: Client,
    User: User
  };

}).call(this);

//# sourceMappingURL=../app/maps/metal/api.js.map
