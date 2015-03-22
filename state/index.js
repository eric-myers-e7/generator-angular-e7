'use strict';

var chalk = require('chalk');
var generators = require('yeoman-generator');
var yosay = require('yosay');
var _ = require('lodash');

module.exports = generators.Base.extend({
  constructor: function () {
    generators.Base.apply(this, arguments);
    this.argument('name', { desc: 'State name. e.g. support', required:false, type: 'String'});
    this.option('module', {desc: 'Module   e.g. consumer', type: 'String'});
    this.option('url', {desc: 'URL  e.g. /support.html', type: 'String'});
    this.option('module', {desc: 'Module name  e.g. consumer', type: 'String'});
    this.option('template', {desc:'Template name', type: 'String'});
    this.option('template-url', {desc:'Template URL', type: 'String'});
    this.option('template-provider', {desc:'Template provider', type: 'String'});
    this.option('location', {desc:'Location (namespace) of the directive (_.hf)', type: 'Boolean'});
    if (this.name && this.name.toLowerCase() !== 'ctrl' && this.name.substr(-'ctrl'.length).toLowerCase() === 'ctrl') {
      this.name = this.name.slice(0, -4);
    }

    if (this.name && this.name.toLowerCase() !== 'controller' && this.name.substr(-'controller'.length).toLowerCase() === 'controller') {
      this.name = this.name.slice(0, -10);
    }
    this.option('abstract', {desc:'abstract route', type: 'Boolean'});
  },
  initializing: function () {
    this.log(yosay('This will help you create a new state!'));
  },
  prompting: function () {
    var done = this.async();
    var _this = this;
    this.prompt([
      {
        type: 'input',
        name: 'module',
        message: 'What is the module name (e.g. consumer)',
        when: function () { return _.isUndefined(_this.options.module) },
        validate: function (answer) { return _this._validateStateName(answer) || 'Must contain only letters, numbers, and _' }
      },
      {
        type: 'confirm',
        name: 'abstract',
        default: false,
        message: 'Is this state abstract?',
        when: function () { return _.isUndefined(_this.options.abstract)}
      },
      {
        type: 'input',
        name: 'name',
        message: 'Enter state name (e.g. supportBox):',
        when: function () { return _.isUndefined(_this.name) },
        validation: function (answer) { return _this._validateStateName(answer) || 'Must contain only letters, numbers, and _'}
      },
      {
        type: 'input',
        name: 'location',
        message: 'What location would you like? (e.g. _.hf.ecu)',
        when: function () { return _.isUndefined(_this.options.location) },
        validate: function (answer) {
          return _this._validateNamespace(answer)  || 'Must contain letters, underscore, and period only.';
        }
      },
      {
        type: 'input',
        name: 'url',
        message: 'Enter state url (e.g. /help/support.html):',
        when: function () { return _.isUndefined(_this.options.url) }
      },
      {
        type: 'list',
        name: 'templateType',
        message: 'What type of template type are you using?',
        choices: ['URL', 'Template', 'Provider', 'None'],
        default: 'URL'
      },
      {
        type: 'input',
        name: 'templateUrl',
        message: 'Enter template Url (e.g. /path/to/template/template.html):',
        default: function (answers) {
          var name = _this.options.name || answers.name;
          var location = _this.options.location || answers.location;
          return _this._getDestination(_.kebabCase(name), '.html', location);

        },
        when: function (answers) { return answers.templateType == 'URL' }
      },
      {
        type: 'input',
        name: 'template',
        message: 'Enter template (e.g. <div>My Template</div>):',
        default: function (answers) {
          var name = _this.options.name || answers.name;
          return '<div id="' + _.kebabCase(name) + '"></div>';
        },
        when: function (answers) { return answers.templateType == 'Template' }
      },
      {
        type: 'input',
        name: 'controller',
        message: 'What is the name of the controller (e.g. support)',
        default: function (answers) {
          var name = _this.options.name || answers.name;
          return name + 'Controller'
        },
        validation: function (answer) { return _this._validateStateName(answer) }
      }
    ], function (answers)  {
      this.options.abstract = this.options.abstract || answers.abstract;
      this.options.name     = this.name || answers.name;
      this.options.module   = this.options.module || answers.module;
      this.options.templateUrl = this.options.templateUrl || answers.templateUrl;
      this.options.template = this.options.template || answers.template;
      this.options.location    = this.options.location || answers.location;
      this.options.controller = answers.location;
      done();
    }.bind(this));
  },
  writing: function () {
    var stateOptions = [];

    if (this.options.abstract)    { stateOptions.push("    abstract: true")};
    if (this.options.templateUrl) { stateOptions.push('    templateUrl: ' + this.options.templateUrl )};
    if (this.options.templateType == 'Provider') { stateOptions.push('    templateProvider: function () {\n    } ' )};
    if (this.options.template)    { stateOptions.push('    template: ' + this.options.template )};

    this.fs.copyTpl(
      this.templatePath('state.tmpl'),
      this.destinationPath(this._getDestination(this.options.name, '-controller.js', this.options.location)),
      {
        module: this.options.module,
        stateOptions: stateOptions.join(',\n'),
        stateName: this.options.location + '.' + _.kebabCase(this.options.name),
        name: this.option.name
      }
    );
    this.fs.copyTpl(
      this.templatePath('state-css.tmpl'),
      this.destinationPath(this._getDestination(this.options.name, '.scss', this.options.location)),
      {
        name: _.kebabCase(this.options.name)
      }
    );
    this.fs.copyTpl(
      this.templatePath('state-html.tmpl'),
      this.destinationPath(this._getDestination(this.options.name, '-view.html', this.options.location)),
      {
        name: _.kebabCase(this.options.name)
      }
    );
  },

  _validateStateName: function (name) {
    return !!name.match(/^[A-Za-z0-9_]+$/g);
  },
  _validateNamespace: function (location) {
    return !!location.match(/^[a-z_.]+$/g);
  },
  _validateRestrict: function (restrict) {
    return !!restrict.match(/^[AEC]{1,3}$/);
  },
  _getDestination: function (name, extension, location) {
    var destination = 'states';
    if(location) {
      destination += '/' + location.split('.').join('/');
    }
    return destination + '/' + _.kebabCase(name) + extension;
  }
});
