
// tslint:disable:no-console

/*
 * This code is injected into all webviews — it patches a few itch.io things
 * to make them friendlier to the app, like the login form, the purchase form, etc.
 */

/** 
 * Our own little twist on `window`, with a few more fields
 */
interface IExtendedWindow {
  // yes, we have jQuery on itch.io — what is this, 2009 ?
  $: any;
  // global namespace for itch.io JavaScript
  I: any;
  __itchInit: (itchTabId: string) => void;
  __itchTabId: string;
}

const extendedWindow = (window as any) as IExtendedWindow;

setTimeout(function () {
  const urlParser = require("../util/url").default;
  const store = require("../store/chrome-store").default;
  const querystring = require("querystring");

  const sendMessage = (verb: string, userAttrs = {}) => {
    const attrs = {
      ...userAttrs,
      tabId: extendedWindow.__itchTabId,
    };

    const url = `https://itch-internal/${verb}?${querystring.stringify(attrs)}`;
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.send();
  };

  const I = extendedWindow.I || {};

  Object.defineProperty(window, "I", {
    get: () => I,
    set: (val) => Object.assign(I, val),
  });

  let BBF: any;

  // monkey-patch BaseBuyForm, because it's fun!
  Object.defineProperty(I, "BaseBuyForm", {
    get: () => BBF,
    set: (val) => {
      BBF = val;
      BBF.prototype.submit_handler = function () {
        if (!this.is_valid()) {
          return false;
        }

        const {$} = extendedWindow;
        const $buttons = $(".checkout_btn, .confirm_vat_btn");
        disable($buttons);
        $buttons.html($('<span><span class="icon icon-stopwatch itchInjectedSpinner"></span> Loading...</span>'));
        $buttons.not(":eq(0)").hide();

        // don't close the window here
      };
    },
  });

  function disable ($el: any) {
    $el.prop("disabled", true);
    $el.css("opacity", 0.7);
    $el.css("-webkit-filter", "grayscale(70%)");
  }

  function purchaseInject () {
    const {$} = extendedWindow;
    const form = $("form.buy_form_widget");
    form.attr("target", "_self");

    // TODO: use 'file:///' protocol instead, if that's no issue.
    const css = $(`<style>
      .itchInjectedSpinner {
        animation: sk-rotateplane 2.4s .5s infinite ease-out;
      }

      @keyframes sk-rotateplane {
        0% {transform: perspective(120px) rotateY(0deg);}
        25% {transform: perspective(120px) rotateY(-180deg);}
        50% {transform: perspective(120px) rotateY(-180deg);}
        75% {transform: perspective(120px) rotateY(-360deg);}
        100% {transform: perspective(120px) rotateY(-360deg);}
      }
    </style>`)[0];

    document.body.appendChild(css);
  }

  function evolveTab (path: string) {
    sendMessage("evolve-tab", {path});
  }

  function analyzePage (url: string) {
    sendMessage("analyze-page", {url});
  }

  function itchInject () {
    const {$} = extendedWindow;

    $(".admin_tag_editor_widget").hide();
    $(".above_game_banner").hide();
    // $('.header_widget').hide()

    {
      const $page = $(".view_game_page");
      if ($page.length) {
        $page.find(".buy_row").prev("h2").hide();
        $page.find(".buy_row, .donate, .uploads").hide();
        $page.find(".game_frame").remove();
      }
    }

    {
      const $page = $(".index_page");
      if ($page.length) {
        // $page.find('.index_sidebar').remove()
        $page.find(".anon_intro").remove();
        $page.find(".app_banner").remove();
        // $page.find('.main_column').css('margin', 0)
      }
    }

    {
      let oldURL = "";
      setInterval(() => {
        const $iframe = $("iframe.object_viewer");
        const iframe = $iframe[0];

        if (iframe && oldURL !== iframe.src) {
          console.log("iframe changed URL!", iframe.src);
          analyzePage(iframe.src);
          oldURL = iframe.src;
        }
      }, 1000);
    }
  }

  function loginInject () {
    const {me} = store.getState().session.credentials;
    const {$} = extendedWindow;
    const $page = $(".user_login_page");
    const $title = $page.find(".stat_header_widget h2");
    $title.text(`Verify password for ${me.username}`);

    const $form = $page.find(".form");

    const $username = $form.find("input[name=username]");
    $username.val(me.username);
    $username.closest(".input_row").css("display", "none");

    const $password = $form.find("input[name=password]");
    $password.focus();

    $form.find(".buttons .line").css("display", "none");
  }

  function checkoutInject () {
    const {$} = extendedWindow;
    $(".close_button").on("click", (e: Event) => {
      window.close();
      e.preventDefault();
      e.stopPropagation();
    });
  }

  extendedWindow.__itchInit = (tabId: string) => {
    extendedWindow.__itchTabId = tabId;

    const host = urlParser.subdomainToDomain(window.location.hostname);

    if (["itch.io", "localhost.com"].indexOf(host) === -1) {
      // don't inject anything on non-itch pages
      console.log("not an itch page, bailing out", host);
      return;
    }

    const metaTag = document.querySelector('meta[name="itch:path"]') as HTMLMetaElement;
    if (metaTag) {
      let path = metaTag.content;
      const parsed = urlParser.parse(window.location.href);
      if (parsed.search) {
        path += parsed.search;
      }
      evolveTab(path);
    } else {
      analyzePage(window.location.href);
    }

    console.log("injecting itch js");
    itchInject();

    const tokens = window.location.pathname.split("/");
    const firstToken = tokens[1];
    const lastToken = tokens[tokens.length - 1];

    switch (lastToken) {
      case "purchase":
        purchaseInject();
        break;
      case "login":
        loginInject();
        break;
      default:
        if (firstToken === "checkout") {
          checkoutInject();
        }
        break;
    }
  };

  window.addEventListener("keydown", (e: KeyboardEvent) => {
    switch (e.key) {
      case "F12":
        if (!e.shiftKey) {
          return;
        }
        sendMessage("open-devtools");
        break;
      default:
        break;
    }
  });
}, 10);
