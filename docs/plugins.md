# Plugins

Plugins are an integral part of the Sevr Framework. In fact, the are the
primary way for interfacing with Sevr. Creating a plugin is fairly
straight forward and only requires a single class or constructor function.

Plugin classes can implement various lifecycle methods to control how and when
data and functionality enter the system. With the exception of the constructor,
the values returned from these methods are coerced to Promises, allowing each
method to be asynchronous. These methods are called in the following order:

###  constructor(sevr, config)
The class constructor is called once a connection to the database has been
established. The constructor should be used to setup the plugin environment.

| Param | Type |
| --- | --- |
| sevr | `Sevr` |
| config | `Object` | 

### registerTypes() : `*`
This method is called after loading the types. If a plugin needs to load an
additional type, it should be done at this time.

### registerCollections() : `*`
Called directly after loading all collections. If a plugin needs to modify the
collections in any way, it can be done here.

### didInitialize() : `*`
This method is called once all other setup has been complete. Sevr's
authentication mechanism is intialized just before this method call, so it
is available at this time.

### willRun() : `*`
This method is called just before Sevr emits the `ready` event.

### run()
This is the final method call within the plugin lifecycle. Unlike the other
lifecycle methods, each `run` method is run concurrently.

## Example

```javascript
// myplugin.js
class MyPlugin {
	constructor(sevr, config) {
		this.sevr = sevr
		this.config = config
	}

	willRun() {
		this.sevr.logger.info('MyPlugin is ready to roll!')
	}

	run() {
		this.sevr.server.get('my-plugin', (req, res) => {
			res.send('Hello, World')
		})
	}
}

module.exports = MyPlugin
```

```javascript
// index.js
const Sevr = require('sevr')
const MyPlugin = require('./myplugin')

const sevr = new Sevr()

// Attach plugin
sevr.attach(MyPlugin)

module.exports = sevr
```