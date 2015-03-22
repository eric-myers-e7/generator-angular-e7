'use strict';

var chalk = require('chalk');
var generators = require('yeoman-generator');
var yosay = require('yosay');
var _ = require('lodash');

module.exports = generators.Base.extend({
  constructor: function () {
    generators.Base.apply(this, arguments);
    this.argument('name', { desc: 'Directive name. e.g. supportBox', required:false, type: 'String'});
    this.option('module', {desc: 'Module   e.g. consumer', type: 'String'});
    this.option('restrict', {desc:'Restrict directive (A,E,C)', type: 'String'});
    this.option('templateType', {desc:'Template type (URL, Template, Provider)', type: 'String'});
    this.option('isolate', {desc:'Isolates directive scope', type: 'Boolean'});
    this.option('link', {desc:'Includes link function', type: 'Boolean'});
    this.option('controller', {desc:'Includes controller function', type: 'Boolean'});
    this.option('transclude', {desc:'Transclude directive', type: 'Boolean'});
    this.option('location', {desc:'Location (namespace) of the directive (_.ecu)', type: 'Boolean'});
  },
  intializing: function () {

    if (!_.isUndefined(this.options.restrict)) {
      this.env.error('You must use options A, E, or C');
    }
    this.log(yosay('This will help you to create a directive'));
  },
  prompting: function () {
    var done = this.async();
    var name = this.name;
    var options = this.options;
    var _this = this;
    this.prompt([
        {
          type: 'input',
          name: 'module',
          message: 'What is the module name (e.g. consumer)',
          when: function () { return _.isUndefined(_this.options.module) },
          validate: function (answer) { return _this._validateDirectiveName(answer) || 'Must contain only letters, numbers, and _'}
        },
        {
          type: 'input',
          name: 'name',
          message: "What is the directive's name? (e.g. supportBox)",
          when: function () { return !name; },
          validate: function (answer) {
            return _this._validateDirectiveName(answer) || chalk.red('Must only contain letters.');
          }
        },
        {
          type: 'input',
          name: 'location',
          message: 'What location would you like? (e.g. _.hf.ecu)',
          when: function () { return _.isUndefined(options.location) },
          validate: function (answer) {
            return _this._validateNamespace(answer)  || 'Must contain letters, underscore, and period only.';
          }
        },
        {
          type: 'checkbox',
          name: 'restrict',
          message: 'What restriction type would you like?',
          choices: [
            {name:'A - only matches attribute name', value: 'A'},
            {name: 'E - only matches element name', value: 'E'},
            {name: 'C - only matches class name ', value: 'C'}],
          default: ['A'],
          when: function () { return _.isUndefined(options.restrict) },
          validate: function (answer) {
            return _this._validateRestrict(answer.join('')) || 'Must contain the values A, E, or C only.';
          }
        },
        {
          type: 'confirm',
          name: 'isolate',
          message: 'Do you want an isolated scope?',
          when: function () { return _.isUndefined(options.isolate) }
        },
        {
          type: 'confirm',
          name: 'transclude',
          default: false,
          message: 'Would you like to transclude',
          when: function () { return _.isUndefined(options.transclude) }
        },
        {
          type: 'list',
          name: 'templateType',
          message: 'What type of template type are you using?',
          choices: ['URL', 'Template', 'None'],
          when: function () { return _.isUndefined(options.templateType) }
        },
        {
          type: 'input',
          name: 'templateUrl',
          message: 'Enter template Url (e.g. /path/to/template/template.html):',
          when: function (answers) { return answers.templateType == 'URL' }
        },
        {
          type: 'input',
          name: 'template',
          message: 'Enter template (e.g. <div>My Name Is {{ test }}</div>):',
          when: function (answers) { return answers.templateType == 'Template' }
        },
        {
          type: 'confirm',
          name: 'link',
          message: 'Will you need a link function?',
          when: function () { return _.isUndefined(options.link) }
        },
        {
          type: 'confirm',
          name: 'controller',
          message: 'Would you like a controller?',
          when: function (answers) { return _.isUndefined(options.controller) && !answers.link }
        },
        {
          type: 'confirm',
          name: 'addRequire',
          default: false,
          message: 'Would you like to require other directives?',
          when: function (answers) { return answers.link }
        },
        {
          type: 'input',
          name: 'require',
          message: 'Enter the directives you require? (e.g. ^MyController, MyController2)',
          when: function (answers) { return _.isUndefined(options.controller) && answers.addRequire },
          validate: function (answer) {
            if (_.isUndefined(answer) || answer === null) {
              return
            }
            return _this._validateList(answer.split(','), _this._validateControllerName);
          }
        }
      ],
      function (answers) {
        this.options.transclude = this.options.transclude || answers.transclude;
        this.options.module     = this.options.module || answers.module;
        this.options.link       = this.options.link || answers.link;
        this.options.restrict   = this.options.restrict || answers.restrict;
        this.options.name       = this.name || answers.name;
        this.options.isolate    = this.options.isolate || answers.isolate;
        this.options.templateUrl = this.options.templateUrl || answers.templateUrl;
        this.options.template = this.options.template || answers.template;
        this.options.location    = this.options.location || answers.location;
        this.options.controller = this.options.controller || answers.controller;
        this.options.require = this.options.require || answers.require;
        done();
      }.bind(this));
  },
  writing: function () {
    var templateOptions = [];
    var destination = 'common/directive';
    if (this.options.restrict)    { templateOptions.push("    restrict: '" + this.options.restrict + "'")};
    if (this.options.require)     { templateOptions.push("    require: " + this.options.require.split(',').join(', ') )};
    if (this.options.isolate)     { templateOptions.push('    scope: {\n\n    }')};
    if (this.options.templateUrl) { templateOptions.push('    templateUrl: ' + this.options.templateUrl )};
    if (this.options.template)    { templateOptions.push('    template: ' + this.options.template )};
    if (this.options.transclude)  { templateOptions.push('    transclude: true')};
    if (this.options.controller)  { templateOptions.push("    controller: function ($scope, $log) {\n\n    }")};
    if (this.options.link)        { templateOptions.push('    link: function (scope, element, attr) {\n\n    }')};
    if(this.options.location) {
      destination = this.options.location.split('.').join('/');
    }
    this.fs.copyTpl(
      this.templatePath('directive.tmpl'),
      this.destinationPath(destination + '/' + this.options.name + '.js'),
      {
        module: this.options.module,
        options: templateOptions.join(',\n'),
        name: this.options.name
      }
    );
  },
  _validateDirectiveName: function (name) {
    return !!name.match(/^[A-Za-z_]+$/g);
  },
  _validateControllerName: function (name) {
    return !!name.match(/^[A-Za-z]+$/g);
  },
  _validateNamespace: function (location) {
    return !!location.match(/^[a-z_.]+$/g);
  },
  _validateRestrict: function (restrict) {
    return !!restrict.match(/^[AEC]{1,3}$/);
  },
  _validateList: function (list, validator) {
    var result = true;
    _.forEach(list, function (value) {
      if (validator(_.trim(value, '^ ')) == false) {
        result = false;
      }
    });
    return result;
  },
  _getDestination: function (name, extension, location) {
    var destination = 'state';
    if(location) {
      destination += location.split('.').join('/');
    }
    return destination + '/' + _.kebabCase(name) + extension;
  }
});
