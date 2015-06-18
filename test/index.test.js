var test = require('tape');
var crypto = require('crypto');
var project = crypto.randomBytes(4).toString('hex');
var cfnTest = require('..')(test, project, 'us-east-1');
var template = require('./template.json');
var AWS = require('aws-sdk');
var cfn = new AWS.CloudFormation({ region: 'us-east-1' });

cfnTest.start(template, { TestParameter: 'test-indeed' });

test('stack name', function(assert) {
  var re = new RegExp('test-' + project + '-[a-zA-Z0-9]{8}');
  assert.ok(re.test(cfnTest.stackName), 'properly named stack');
  assert.end();
});

test('starts the stack', function(assert) {
  cfn.describeStacks({ StackName: cfnTest.stackName }, function(err, data) {
    assert.ifError(err, 'stack exists');
    assert.deepEqual(cfnTest.description, data.Stacks[0], 'cached stack description');
    assert.equal(data.Stacks[0].StackStatus, 'CREATE_COMPLETE', 'stack is created');
    assert.end();
  });
});

cfnTest.delete();

test('deletes the stack', function(assert) {
  cfn.describeStacks({ StackName: cfnTest.stackName }, function(err, data) {
    assert.ok(err, 'expected error when looking for the stack');
    assert.equal(err.message, 'Stack with id ' + cfnTest.stackName + ' does not exist', 'expected error message');
    assert.equal(err.code, 'ValidationError', 'expected error code');
    if (!err) console.log(data);
    assert.end();
  });
});
