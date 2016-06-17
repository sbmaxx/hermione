'use strict';

var format = require('util').format,
    inherit = require('inherit'),
    FlatReporter = require('./flat'),
    tsm = require('teamcity-service-messages');

module.exports = inherit(FlatReporter, {
    _onRunnerEnd: function() {
        console.log('on runner end, teamcity');
        try {
            this._results.forEach(function(test) {
                console.log(`test: ${JSON.stringify(test)}`);

                var testName = this._getTestName(test);

                if (test.pending) {
                    tsm.testIgnored({name: testName});
                    return;
                }

                tsm.testStarted({name: testName});

                if (test.state === 'failed') {
                    tsm.testFailed({
                        name: testName,
                        message: test.err,
                        details: test.err && test.err.stack || test.err
                    });
                }

                tsm.testFinished({name: testName, duration: test.duration});
            }.bind(this));

            console.log('should call base');
            this.__base();
        } catch(e) {
            console.log(e.stack);
        }
    },

    _getTestName: function(test) {
        return format('%s [%s: %s]',
            test.fullTitle().trim(),
            test.browserId,
            test.sessionId
        );
    }
});
