'use strict';

var format = require('util').format,
    inherit = require('inherit'),
    FlatReporter = require('./flat'),
    tsm = require('teamcity-service-messages');

module.exports = inherit(FlatReporter, {
    _onRunnerEnd: function() {
        var length = this._results.length;
        console.log(`Total test count: ${length}`);
        console.log('on runner end, teamcity');
        try {
            this._results.forEach(function(test, index) {
                console.log(`test ${index}`);

                var testName = this._getTestName(test);

                console.log('get test name');

                if (test.pending) {
                    console.log('test is pending');
                    tsm.testIgnored({name: testName});
                    return;
                }

                console.log('test started');
                tsm.testStarted({name: testName});

                if (test.state === 'failed') {
                    console.log('test failed');
                    tsm.testFailed({
                        name: testName,
                        message: test.err,
                        details: test.err && test.err.stack || test.err
                    });
                }
                console.log('test finished');

                try {
                    tsm.testFinished({name: testName, duration: test.duration});
                } catch(e) {
                    console.log(e);
                    console.log("!!!!!!!");
                }

                console.log('all is fine');
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
