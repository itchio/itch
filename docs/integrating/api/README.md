
# API integration

You can integrate your game with the itch.io API in different ways, depending
on whether they're using the app or not.

When using the app, you can include an [app manifest](../manifest.md) which
will directly pass your game an API key using an environment variable.

Combined with the rest of our [server-side API](https://itch.io/docs/api/serverside),
you can do things like:

  * Authenticate a user (ie. know for sure which itch.io account is playing your game)
  * Retrieve user information (such as their username, avatar, whether they have a press account, etc.)
  * Get a proof of purchase

For example, you might want your online play servers to be only accessible
by users who have purchased a legitimae copy of your game, and to all press users.

For more information, refer to the **API key** part of the [app manifest](../manifest.md) page.

*Note: our API offering will continue to expand over time. If you have particular needs
for your game's release, don't hesitate to get in touch with us at [support@itch.io](mailto:support@itch.io)*
