'use strict';

var _ = require('lodash'),
    inherit = require('inherit'),
    EventEmitter = require('events').EventEmitter,
    RunnerEvents = require('../constants/runner-events'),
    Matcher = require('./matcher');

var RetryManager = inherit(EventEmitter, {
    __constructor: function(config) {
        this._retriesLeft = _.mapValues(config.browsers, 'retry');
        this._matchers = [];
    },

    handleTestFail: function(failedTest) {
        var retriesLeft = this._retriesLeft[failedTest.browserId];
        if (!retriesLeft) {
            this.emit(RunnerEvents.TEST_FAIL, failedTest);
            return;
        }

        this.emit(RunnerEvents.RETRY, _.extend(failedTest, {
            retriesLeft: retriesLeft - 1
        }));

        var failedRunnable = failedTest.hook ? failedTest.hook.parent : failedTest;
        this._registerFail(failedRunnable, failedTest.browserId);
    },

    handleError: function(error, failedRunnable) {
        if (!failedRunnable || !failedRunnable.parent || !this._retriesLeft[failedRunnable.browserId]) {
            this.emit(RunnerEvents.ERROR, error, failedRunnable);
            return;
        }

        this.emit(RunnerEvents.RETRY, _.extend(failedRunnable, {
            retriesLeft: this._retriesLeft[failedRunnable.browserId] - 1,
            err: error
        }));

        this._registerFail(failedRunnable.parent, failedRunnable.browserId);
    },

    _registerFail: function(runnable, browser) {
        if (runnable.type === 'test') {
            this._matchers.push(Matcher.create(runnable, browser));
        } else {
            _.union(runnable.suites, runnable.tests).forEach(_.bind(this._registerFail, this, _, browser));
        }
    },

    retry: function(runFn) {
        if (_.isEmpty(this._matchers)) {
            return;
        }

        this._retriesLeft = _.mapValues(this._retriesLeft, function(retry) {
            return retry && retry - 1;
        });

        var matchers = this._matchers,
            testsToRetry = this._getTestsToRetry();

        this._matchers = [];

        return runFn(testsToRetry, function(test, browser) {
            return _.any(matchers, function(matcher) {
                return matcher.test(test, browser);
            });
        });
    },

    _getTestsToRetry: function() {
        return _(this._matchers)
            .groupBy('browser')
            .mapValues(function(matchers) {
                return _(matchers).map('file').uniq().value();
            })
            .value();
    }
});

module.exports = RetryManager;
