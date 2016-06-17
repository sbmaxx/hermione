'use strict';

var format = require('util').format,
    inherit = require('inherit'),
    FlatReporter = require('./flat'),
    tsm = require('teamcity-service-messages');

tsm.autoFlowId = false;

module.exports = inherit(FlatReporter, {
    _onRunnerEnd: function() {
        this._results.forEach(function(test) {
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

        this.__base();
    },

    _getTestName: function(test) {
        return format('%s [%s]',
            test.fullTitle().trim(),
            test.browserId
        );
    }
});
