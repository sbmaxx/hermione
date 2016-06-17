'use strict';

var format = require('util').format,
    inherit = require('inherit'),
    FlatReporter = require('./flat'),
    tsm2 = {
        testStarted: function(obj) {
            this.escapeObj(obj);
            console.log(`##teamcity[testStarted name='${obj.name}']`);
        },

        testFinished: function(obj) {
            this.escapeObj(obj);
            console.log(`##teamcity[testFinished name='${obj.name}']`);
        },

        testFailed: function(obj) {
            this.escapeObj(obj);
            console.log(`##teamcity[testFailed name='${obj.name}']`);
        },

        testIgnored: function(obj) {
            this.escapeObj(obj);
            console.log(`##teamcity[testIgnored name='${obj.name}']`);
        },

        escapeObj: function(obj) {
            Object.keys(obj).forEach(function(key) {
                obj[key] = this.escape(obj[key]);
            }.bind(this));
        },

        escape: function(str) {

            if (!str) {
                return '';
            }

            return str
                .toString()
                .replace(/\|/g, "||")
                .replace(/\n/g, "|n")
                .replace(/\r/g, "|r")
                .replace(/\[/g, "|[")
                .replace(/\]/g, "|]")
                .replace(/\u0085/g, "|x")
                .replace(/\u2028/g, "|l")
                .replace(/\u2029/g, "|p")
                .replace(/'/g, "|'");

        }

    };

var tsm = require('teamcity-service-messages');
tsm.stdout = false;

module.exports = inherit(FlatReporter, {
    _onRunnerEnd: function() {
        var length = this._results.length;
        console.log(`Total test count: ${length}`);
        console.log('on runner end, teamcity');
        try {
            this._results.forEach(function(test, index) {
                console.log(`test ${index}`);

                var testName = this._getTestName(test);

                if (test.pending) {
                    console.log('ignored ' + tsm.testIgnored({name: testName}));
                    return;
                }

                console.log('started ' + tsm.testStarted({name: testName}));

                if (test.state === 'failed') {
                    console.log('failed ' + tsm.testFailed({
                        name: testName,
                        message: test.err,
                        details: test.err && test.err.stack || test.err
                    }));
                }
                console.log('finished ' + tsm.testFinished({name: testName, duration: test.duration}));
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
