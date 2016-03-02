
import test from 'zopf'

const Store = function () {}

Store.subscribe = () => null

module.exports = test.module(Store)
