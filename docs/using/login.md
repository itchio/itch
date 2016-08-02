
# Logging in

The first time the app starts, it will ask you for your itch.io username (or e-mail)
and password.

*Note: It is not possible to use the app anonymously at the moment, although downloading
or even purchasing is possible on the <https://itch.io> website without an account.*

## Two-factor authentication

Currently, even if you have two-factor authentication enabled, the app won't ask
for it in the login screen. Logging in through the app doesn't give access to your
full account, it only allows to list your collections and download games you've
bought.

The web log-in is currently separate, see 'App log-in vs web-login' underneath.

## App log-in vs web log-in

Currently, if you want to browse the itch.io website as your itch.io account,
you'll need to login a second time through the in-app browser.

For example, if one of your creations is set to 'private', or 'restricted', you
might see a 'page not found' error when opening them in a tab. Logging into itch.io
from the in-app browser will fix that.

Start by reading [this github issue](https://github.com/itchio/itch/issues/672)
for a more in-depth look of why things are the way they are at the moment.

## Multiple sessions

You can log in with multiple user accounts from the itch app. Each session
has its own set of browser tabs, has access to its own creations, etc.

There is one thing that's shared between all sessions connected on the same
itch app: all sessions are able to launch installed games (but may not be
able to update them).
