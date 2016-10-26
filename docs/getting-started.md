# Getting Started

Getting up and running with the Sevr Framework is quite simple and only
requires a small amount of code and configuration for a simple implementation.
A typical implementation should have a project structure similar to

```
├── collections
│   └── ...
├── index.js
├── node_modules
│   └── ...
├── package.json
└── types
    └── ...
```

By default, collection definitions are loaded automatically from the
`collections` directory, and the type definitions from the `types`
directory.

For the simplist application, the `index.js` file will contain only a handful
of lines required to get the application started.

```javascript
// index.js
const Sevr = require('sevr')

// Create new sevr instance
const sevr = new Sevr()

// Start the service
sevr.start()
	.then(() => {
		sevr.logger.info('Up and running!')
	})
	.catch(err => {
		sevr.logger.error(err.stack)
	})

// Start the web server
sevr.startServer()

module.exports = sevr
```

Assuming at least one collection has been defined, sevr will start when running
`node index` and intialize a new database named "sevr" at localhost:27017, and
will begin listening to incoming http connections on `localhost:3000`.