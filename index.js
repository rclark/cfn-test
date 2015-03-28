var crypto = require('crypto');
var AWS = require('aws-sdk');
var test = require('tape');

module.exports = function(projectName, region) {
  var cfnTest = {};
  var cfn = new AWS.CloudFormation({ region: region });

  cfnTest.stackName = [
    'test',
    projectName,
    crypto.randomBytes(4).toString('hex')
  ].join('-');

  cfnTest.start = function(template) {
    test('[cfn-test] start stack', function(assert) {
      assert.timeoutAfter(300000);

      check(cfn, cfnTest.stackName, function(err, status) {
        if (err) throw err;
        if (status) return assert.end();

        assert.pass('Creating CloudFormation stack: ' + cfnTest.stackName);
        create(cfn, cfnTest.stackName, template, function(err) {
          if (err) throw err;

          describe(cfn, cfnTest.stackName, function(err, description) {
            if (err) throw err;

            cfnTest.description = description;
            assert.end();
          });
        });
      });
    });
  };

  cfnTest.delete = function() {
    test('[cfn-test] delete stack', function(assert) {
      assert.timeoutAfter(300000);

      remove(cfn, cfnTest.stackName, function(err) {
        if (err) throw err;
        assert.end();
      });
    });
  };

  return cfnTest;
};

function check(cfn, stackName, callback) {
  cfn.describeStacks({ StackName: stackName }, function(err, data) {
    if (err && err.message === 'Stack:' + stackName + ' does not exist')
      return callback();
    if (err) return callback(err);
    if (!data.Stacks.length) return callback();
    callback(null, data.Stacks[0].StackStatus);
  });
}

function describe(cfn, stackName, callback) {
  cfn.describeStacks({ StackName: stackName }, function(err, data) {
    if (err && err.message === 'Stack:' + stackName + ' does not exist')
      return callback();
    if (err) return callback(err);
    if (!data.Stacks.length) return callback();
    callback(null, data.Stacks[0]);
  });
}

function create(cfn, stackName, template, callback) {
  var params = {
    StackName: stackName,
    Capabilities: ['CAPABILITY_IAM'],
    OnFailure: 'DELETE'
  };

  if (typeof template === 'object') template = JSON.stringify(template);

  try {
    JSON.parse(template);
    params.TemplateBody = template;
  } catch (err) {
    params.TemplateUrl = template;
  }

  function done(err, status) {
    if (err) return callback(err);
    if (!status) return callback(new Error('Stack creation failed'));
    if (status !== 'CREATE_COMPLETE') return setTimeout(check, 10000, cfn, stackName, done);
    return callback();
  }

  cfn.createStack(params, function(err) {
    if (err) return callback(err);
    check(cfn, stackName, done);
  });
}

function remove(cfn, stackName, callback) {
  cfn.deleteStack({ StackName: stackName }, function(err, data) {
    if (err) return callback(err);

    function done(err, status) {
      if (err) return callback(err);
      if (!status) return callback();
      if (status !== 'DELETE_COMPLETE') return setTimeout(check, 10000, cfn, stackName, done);
      return callback();
    }

    check(cfn, stackName, done);
  });
}
