
I'm trying to simplify the architecture of the app.

## state of stores

browser-side (node):

  * remote data:
    * CredentialsStore
    * GameStore
    * CaveStore
    * CollectionStore
    * InstallLocationStore
    * SelfUpdateStore
    * SetupStore
    * I18nStore
  * native resources:
    * WindowStore
    * TrayStore
    * NotificationStore
    * UrlStore
    * PolicyStore

renderer-side (chrome):

  * AppStore
  * I18nStore

That's too many stores. I think we should have one canonical app state,
and maybe the browser-side doesn't actually need stores/flux ?

Also, I don't like that stores are singletons in the Flux infrastructure.
In our app, pretty much everything is tied to a session/user, some stores
shouldn't be created before that, and should stop existing when that's done,
instead of being re-used when switching accounts

## i18n

get rid of i18next maybe? it seems like we've already written our own backend,
what's left is just looking up keys and interpolating, it's not that hard. and
that way we get rid of their singleton magic.
