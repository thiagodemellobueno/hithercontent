var https = require("https"),
    isjson = require("is-json"),
    async = require("async");

module.exports = (function () {

  var auth = {};

  var init = function (cred) {
    if (typeof cred === "object") {
      if (cred.hasOwnProperty("user") && typeof cred.user === "string") {
        auth.user = cred.user;
      }
      if (cred.hasOwnProperty("akey") && typeof cred.akey === "string") {
        auth.akey = cred.akey;
      }
    }
  }

  var reset = function (cred) {
      auth = {};
      init(cred);
  }

  var getJSONfromAPI = function (request, callback) {

    var options = {
      auth: auth.user + ":" + auth.akey,
      headers: {
        "Accept": "application/vnd.gathercontent.v0.5+json"
      },
      host: "api.gathercontent.com",
      path: request
    };

    var req = https.get(options, function (res) {

      var body = "";

      res.on("data", function (chunk) {
        body += chunk;
      });

      res.on("end", function () {
        var data = isjson(body) ? JSON.parse(body) : {};
        if (callback && typeof callback === "function") {
          callback(data);
        }
      });

    });

    req.on("error", function (e) {
      console.log(e);
    });

  };

  var reduceItemToKVPairs = function (d) {
    return d.hasOwnProperty("data") && typeof d.data === "object"
        ? flattenItemData(d.data)
        : {}
  };

  var flattenItemData = function (d) {
      var item = {},
          k;
      for (k in d) {
          if (k !== "config" && d.hasOwnProperty(k)) {
              item["_" + k.replace(/\s/g, "-")] = d[k]
          }
      }
      if (d.hasOwnProperty("config") && Array.isArray(d.config)) {
          d.config.forEach(function (v, i, a) {
              var tab_label = v.label;
              v.elements.forEach(function (v, i, a) {
                  var k = tab_label + "_" + (v.label || v.title);
                  k = k && k.replace(/\s/g, "-");
                  if (v.type === "text") {
                      item[k] = v.value;
                  } else if (v.type === "choice_radio") {
                      item[k] = v.options.filter(v => v.selected).reduce((p, c) => p + c.label, "");
                  } else if (v.type === "choice_checkbox") {
                      item[k] = v.options.filter(v => v.selected).map(v => v.label);
                  } else if (v.type === "section") {
                      item[k] = v.subtitle;
                  }
              });
          });
      }
      return item;
  }

  var getProjectBranch = function (project_id, item_id, aOI, cB) {

      var completeBranch = (typeof cB === "function")
        ? cB
        : (typeof aOI === "function")
            ? aOI
            : (typeof item_id === "function")
                ? item_id
                : () => {},
        actOnItem = (typeof cB === "function")
            ? (typeof aOI === "function")
                ? aOI
                : i => i.data
            : (typeof aOI === "function")
                ? (typeof item_id === "function")
                    ? item_id
                    : i => i.data
                : i => i.data,
        item_id = (typeof item_id === "number") ? item_id : 0,
        project_id = (typeof project_id === "number") ? project_id : 0,
        root = { "items": [] };

      getJSONfromAPI("/items?project_id=" + project_id, function (project_data) {

          var getItem = function (root_id, siblings_store, finishItem) {
              var storeItem = function (item) {
                      var item_data = actOnItem(item);
                      siblings_store.push(item_data);
                      return item_data;
                  },
                  findChildItems = function (item_data) {
                      var subitems = project_data.data
                        .filter(i => i.parent_id === root_id);
                      if (subitems.length) { item_data.items = [] }
                      async.each(subitems,
                          (i, finishChild) => {
                              getItem(i.id, item_data.items, finishChild)
                          },
                          () => {
                              item_data.items
                                .sort((a, b) => parseInt(a.position, 10) - parseInt(b.position, 10))
                              finishItem()
                          }
                      );
                  };
              if (root_id === 0) {
                  findChildItems(root);
              } else {
                  getJSONfromAPI("/items/" + root_id, item => findChildItems(storeItem(item)));
              }
          };

          getItem(item_id, root.items, () => { completeBranch(root) });
      });
  };

  return {
    init: init,
    reset: reset,
    getJSONfromAPI: getJSONfromAPI,
    reduceItemToKVPairs: reduceItemToKVPairs,
    getProjectBranch: getProjectBranch
  }

}());
