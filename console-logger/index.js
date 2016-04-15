/*eslint no-console: 0 */
'use strict'

/**
 * Console logger
 * ---
 * Provides simple a universal logger for Ichabod
 */

const chalk = require('chalk')

const styles = {
	verbose:  chalk.cyan,
	info:     chalk.green,
	warning:  chalk.yellow,
	error:    chalk.red,
	critical: chalk.red.bold.inverse
}

module.exports = {

	verbose: function() {
		console.log(styles.verbose.apply(this, arguments))
	},

	info: function() {
		console.log(styles.info.apply(this, arguments))
	},

	warning: function() {
		console.log(styles.warning.apply(this, arguments))
	},

	error: function() {
		console.error(styles.error.apply(this, arguments))
	},

	critical: function() {
		console.error(styles.critical.apply(this, arguments))
	}

}
