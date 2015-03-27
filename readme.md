# cfn-test

Simple create/delete functions for managing CloudFormation templates while testing with [tape](https://github.com/substack/tape)

## Usage

Wraps ansychronous create / delete calls in tape test functions so that you can execute them before and after your own tests easily.

```js
var test = require('tape');
var cfnTest = require('cfn-test')('my-test-project', 'us-east-1');
var myCfnTemplate = require('./template.json');

cfnTest.start(myCfnTemplate);

test('my test', function(assert) {
  // .. interact with your stack and make assertions
  assert.end();
});

cfnTest.delete();
```

## API

**var cfnTest = require('cfn-test')(projectName, region)**

Configure the `cfnTest` object by providing an arbitrary name for your project and the region to run the stack in.

**cfnTest.stackName**

Returns the name of your test stack.

**cfnTest.start(template)**

Start your stack by either providing the template body (as a JavaScript object or a JSON string), or the template's URL on S3.

**cfnTest.description**

After starting your stack, `description` will provide the output from performing a `DescribeStacks` operation on your test stack.

**cfnTest.delete()**

Shuts down your test stack.
