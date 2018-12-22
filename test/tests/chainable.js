'use strict';

describe('Chainable', function() {

  Sugar.createNamespace('Number');
  Sugar.createNamespace('String');
  Sugar.createNamespace('Object');
  Sugar.createNamespace('Array');

  describe('Constructor', function() {

    it('should instantiate with new keyword', function() {
      assertEqual(new Sugar.Number(1).raw, 1);
    });

    it('should throw an error without new keyword', function() {
      assertError(function() {
        Sugar.Number(1);
      });
    });

  });

  describe('Instance Methods', function() {

    it('should be able to define instance methods', function() {
      Sugar.Number.defineInstance('add', add);
      assertEqual(new Sugar.Number(5).add(5).raw, 10);
      delete Sugar.Number.add;
    });

    it('should be able to accept an arbitrary number of arguments', function() {
      Sugar.Number.defineInstance('add', function() {
        var args = Array.prototype.slice.call(arguments);
        return args.reduce(function(sum, n) {
          return sum + n;
        }, 0);
      });
      assertEqual(new Sugar.Number(5).add(1,2,3,4,5,6,7,8,9,10).raw, 60);
      delete Sugar.Number.add;
    });

    it('should throw an error when trying overwrite method', function() {
      Sugar.Number.defineInstance('add', add);
      assertError(function overwriteInstance() {
        Sugar.Number.defineInstance('add', mult);
      });
      delete Sugar.Number.add;
    });

    it('should allow chaining', function() {
      Sugar.Number.defineInstance('add', add);
      Sugar.Number.defineInstance('mult', mult);
      assertEqual(new Sugar.Number(5).add(5).mult(5).raw, 50);
      delete Sugar.Number.add;
      delete Sugar.Number.mult;
    });

    it('should allow chaining across namespaces', function() {
      // Note that Object is being used here as a safeguard as
      // it's behavior differs slightly when extending.
      Sugar.Number.defineInstance('argObject', arg);
      Sugar.Object.defineInstance('argNumber', arg);
      assertEqual(new Sugar.Number().argObject({}).argNumber(1).raw, 1);
      delete Sugar.Number.argObject;
      delete Sugar.Object.argNumber;
    });

  });

  describe('Wrapping Behavior', function() {

    beforeEach(function() {
      Sugar.Number.defineInstance('arg', arg);
    });

    afterEach(function() {
      delete Sugar.Number.arg;
    });

    it('should not wrap boolean result', function() {
      assertFalse(new Sugar.Number(1).arg(false));
      assertTrue(new Sugar.Number(2).arg(true));
    });

    it('should not wrap null', function() {
      assertNull(new Sugar.Number(1).arg(null));
    });

    it('should not wrap undefined', function() {
      assertUndefined(new Sugar.Number(1).arg(undefined));
    });

    it('should wrap empty string', function() {
      assertEqual(new Sugar.Number(1).arg('').raw, '');
    });

    it('should wrap 0', function() {
      assertEqual(new Sugar.Number(1).arg(0).raw, 0);
    });

    it('should wrap NaN', function() {
      assertNaN(new Sugar.Number(1).arg(NaN).raw);
    });

    it('should wrap object result and initialize namespace', function() {
      ensureNamespaceNotInitialized('Object', function() {
        var obj = {};
        assertEqual(new Sugar.Number(1).arg(obj).raw, obj);
        assertTrue(!!Sugar.Object);
      });
    });

    it('should not initialize namespace for custom classes', function() {
      function Foo() {}
      new Sugar.Number(1).arg(new Foo());
      assertTrue(!Sugar.Foo);
    });

    it('should not initialize namespace for custom classes with same name as built-ins', function() {
      ensureNamespaceNotInitialized('Array', function() {
        function Array() {}
        new Sugar.Number(1).arg(new Array());
        assertTrue(!Sugar.Array);
      });
    });

    it('should not fail when object has no prototype', function() {
      if (Object.create) {
        var obj = Object.create(null);
        assertEqual(new Sugar.Number(1).arg(obj).raw, obj);
      }
    });

  });

  describe('Native Mapping', function() {

    it('should map native methods to chainable prototype', function() {
      assertEqual(new Sugar.Number(5).toFixed(2).raw, '5.00');
    });

    it('should chain defined methods alongside native', function() {
      Sugar.Number.defineInstance('add', add);
      Sugar.String.defineInstance('add', add);
      assertEqual(new Sugar.Number(5).add(5).toFixed(2).add('px').raw, '10.00px');
      delete Sugar.Number.add;
      delete Sugar.String.add;
    });

    it('should not coerce non-primitives', function() {
      assertEqual(typeof new Sugar.Number(new Number(1)).valueOf(), 'object');
    });

  });

  describe('Operators', function() {

    var zero = new Sugar.Number(0);
    var two  = new Sugar.Number(2);
    var a    = new Sugar.String('a');

    it('should coerce double equals', function() {
      assertTrue(two == 2);
      assertTrue(2 == two);
      assertTrue(a == 'a');
      assertTrue('a' == a);
    });

    it('should coerce comparison operators', function() {
      assertEqual(two > 1, true);
      assertEqual(two > 3, false);
      assertEqual(1 < two, true);
      assertEqual(3 < two, false);
    });

    it('should coerce arithmetic operators', function() {
      assertEqual(two + 1, 3);
      assertEqual(2 + two, 4);
      assertEqual(two - 1, 1);
      assertEqual(5 - two, 3);
      assertEqual(two * 3, 6);
      assertEqual(4 * two, 8);
      assertEqual(two / 2, 1);
      assertEqual(6 / two, 3);
      assertEqual(two % 1, 0);
      assertEqual(7 % two, 1);
    });

    it('should coerce incrment operator', function() {
      var val = new Sugar.Number(1); val++;
      assertEqual(val, 2);
    });

    it('should coerce assignment operators', function() {
      var val = new Sugar.Number(1);
      val += 5;
      assertEqual(val, 6);
    });

    it('should coerce bitwise operators', function() {
      assertEqual(two | 1, 3);
      assertEqual(1 | two, 3);
    });

    it('should coerce unary operators', function() {
      assertEqual(+two,  2);
      assertEqual(-two, -2);
    });

    it('should coerce string concatenation operator', function() {
      assertEqual(a + 'b', 'ab');
      assertEqual('b' + a, 'ba');
    });

    it('should not coerce conditional operators', function() {
      assertTrue(zero ? true : false);
    });

    it('should not coerce logical operators', function() {
      assertFalse(zero && false);
    });

  });

  describe('toString', function() {

    it('should return a chainable', function() {
      assertEqual(new Sugar.Number(1).toString().raw, '1');
    });

    it('should match its built-in class', function() {
      assertEqual(new Sugar.Array([1,2,3]).toString().raw, '1,2,3');
    });

    it('should be equivalent to calling prototype.toString', function() {
      assertEqual(
        new Sugar.Object(null).toString().raw,
        Object.prototype.toString.call(null)
      );
      assertEqual(
        new Sugar.Object(undefined).toString().raw,
        Object.prototype.toString.call(undefined)
      );
    });

  });

});