# Sevr CMS Framework

[![npm](https://img.shields.io/npm/v/sevr.svg?maxAge=2592000)](https://www.npmjs.com/package/sevr)
[![Build Status](https://travis-ci.org/ExclamationLabs/sevr.svg?branch=master)](https://travis-ci.org/ExclamationLabs/sevr)
[![David](https://david-dm.org/ExclamationLabs/sevr.svg)](https://david-dm.org/ExclamationLabs/sevr)

Sevr is modern Node.js framework for building custom content management systems.
Sevr is built on a composable architecture allowing you to creating custom
solutions with only the features they need, and nothing you dont.

**Disclaimer**: This is still in alpha stages and as such, the api is
likely to change.

## [API](docs)

## Getting Started

The best way to first get started with the Sevr is to follow the tutorial,
[sevr-tutorial](https://github.com/ExclamationLabs/sevr-tutorial). This will
guide you through the setup and common patterns while building a simple blog.
If you'd like start from scratch, however, please read on.

**Note**: Sevr requires a MongoDB instance. This guide assumes one is already
set up and running.

### Installation

Sevr is available from npm
```
npm install --save sevr
```

### Directory Structure

In order to run the application, a few directories and files are needed. The
following top-level directories are required: `collections`, `types`. These
directories can remain empty for now. Additionally, an `index.js` should be
added to the root of the project.

### Connecting to MongoDB

By default, Sevr will start a new database called 'sevr' on localhost:27017,
however this is easily configured:

```javascript
connection: {
	host: 'localhost',
	port: 27017,
	username: null,
	password: null,
	database: 'sevr'
}
```

### Boilerplate

```javascript
const Sevr = require('sevr')

const config = {}
const sevr = new Sevr(config)

// Connect to the database
sevr.connect()
	.then(() => {
		sevr.logger.verbose('Initialized database connection')
	})
	.catch(err => {
		sevr.logger.error(err.stack)
	})

// Start the Express web server
sevr.startServer()
```

### Collections

Collections are at the heart of any application on the Sevr framework, and are
analogous to tables in a relational database. Collections are created by first
defining them, with a collection definition, a JavaScript object, which defines
the structure and behavior of data within that collection. Collection
definitions are defined in the `collections` directory. Each defintion should
be in its own file. More information on creating collection definitions can be
found with the [Collection API](docs/collections).

### Types

Sevr provides many standard data types for collections, but there are times
where a custom type will need to be defined to offer specific behavior. Like
collection definitions, these are JavaScript objects, which define the
underlying data type, validation, and various meta information. Custom types
are defined in the `types` directory. Each type should be in its own file.
More information on creating custom types can be found with the
[Type API](docs/type/README.md).

### Plugins

The core framework for Sevr is very lean, which mostly offers a base for working
with the data layer and providing a web server instance. Most applications built
on the Sevr Framework will need to add a few plugins to enable the features
needed for a full functioning system. The lean core here, allows for great
flexibility without adding a lot of unnecessary bloat to your projects. More
information about plugins can be found with the [Plugin API](docs/plugin)

## Tests

Tests are run using Mocha, and create a test database, `sevr-test`.

```
npm test
```

## Available Plugins

- [Sevr CLI](https://github.com/ExclamationLabs/sevr-cli) - Command line interface for the Sevr Framework
- [Sevr Perm](https://github.com/ExclamationLabs/sevr-perm) - Collection roles and permissions

## License

This project is licensed under the [MIT license](license.txt).
