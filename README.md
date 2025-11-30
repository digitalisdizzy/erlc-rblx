# erlc-rblx

Interact with the [ER:LC API](https://apidoc.policeroleplay.community) with simple 429 prevention.

## Create an App
An `App` is required to interact with the API. Create it like this:

```js
const { App } = require("erlc-rblx")

const app = new App("application-key") // Small apps do not need an application key, but large apps (150+ servers) can apply for one
app.addQueue("commands", 4000, 10) // Create a separate queue for commands with a 4 second wait-time between requests and a max length of 10, as they have higher ratelimits. An App automatically has a "main" queue.
```

## Interact with a private server
To interact with a private server, you use the `App#getPrivateServer` method.

```js
const privateServer = app.getPrivateServer("server-key") // A server key IS required, unlike an application key.

privateServer.getInfo("main").then(console.log).catch(console.warn) // An example of a method to use with a PrivateServer, using the queue "main". If a queue is not specified, it'll use the PrivateServer's defaultQueue property, which is by default "main".
privateServer.sendCommand(":m Hello World!", "commands").catch(console.warn) // Send a test message to the server using the separate "commands" queue
```

## Bug fixes or improvements
If there is a bug or improvement you want to see, please let me know by making an [issue](https://github.com/digitalisdizzy/erlc-rblx/issues), or make a [pull request](https://github.com/digitalisdizzy/erlc-rblx/pulls)

## Copyright and Licenses
Emergency Response: Liberty County is © of [Police Roleplay Community](https://policeroleplay.community)  
Roblox is © & ™ of [Roblox Corporation](https://corp.roblox.com/)

[erlc-rblx](https://github.com/digitalisdizzy/erlc-rblx) is © of digitalisdizzy (2025) and is distributed under the [MIT License](https://github.com/digitalisdizzy/erlc-rblx/blob/main/LICENSE).