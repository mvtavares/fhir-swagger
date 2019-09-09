var FS = require('fs');
var getSchema = require('./schemas.js');
var getDefaultOp = require('./convert-operations-to-swagger.js');

var Converter = module.exports = {};

var DESCRIPTION = FS.readFileSync(__dirname + '/../data/description.md', 'utf8')

var URL = require('url');

var INTERACTIONS = {
  instance: ['read', 'vread', 'update', 'delete', 'history'],
  type: ['create', 'search-type', 'history-type', 'history-instance'],
}
INTERACTIONS.all = INTERACTIONS.instance.concat(INTERACTIONS.type);
var DEFAULT_INTERACTIONS = INTERACTIONS.all.map(function(i) {return {code: i}})

Converter.convert = function(baseURL, conf) {
  var swagger = {swagger: '2.0'};
  swagger.definitions = {};
  swagger.paths = {};
  swagger.info = {description: DESCRIPTION, title: conf.implementation.description || 'Untitled', version: conf.fhirVersion};
  var url = URL.parse(baseURL);
  swagger.host = url.host;
  swagger.schemes = [url.protocol.substring(0, url.protocol.length - 1)];
  swagger.basePath = url.pathname;
  var resources = conf.rest[0].resource;

  resources.forEach(function(res) {
    if (!res.searchParam) return;
    var schema = swagger.definitions[res.type] = getSchema(res);
    if (isEmpty(schema)) {
      return;
    }
    var schemaRef = '#/definitions/' + res.type;
    var typeOps = swagger.paths['/' + res.type] = {};
    var instOps = swagger.paths['/' + res.type + '/{id}'] = {parameters: [{in: 'path', required: true, name: 'id', type: 'string'}]}
    res.interaction = res.interaction || DEFAULT_INTERACTIONS;
    var interactions = res.interaction.map(s => s.code);
    if (interactions.indexOf('create') !== -1) {
      typeOps.post = getDefaultOp(res, 'create');
      typeOps.post.parameters.push({
        name: 'body',
        in: 'body',
        schema: {$ref: schemaRef},
      })
    }
    if (interactions.indexOf('search-type') !== -1) {
      typeOps.get = getDefaultOp(res, 'search-type');
      typeOps.get.parameters = res.searchParam.map(function(param) {
        var swagParam = {
          name: param.name,
          type: convertType(param.type),
          in: 'query',
          description: param.documentation
        }
        var format = getFormat(param.type);
        if (format) swagParam.format = format;
        return swagParam;
      });
      var formatParam = {
        name: '_format',
        in: 'query',
        type: 'string',
      }
      formatParam['x-consoleDefault'] = 'application/json';
      typeOps.get.parameters.push(formatParam);
      typeOps.get.responses['200'].schema = {type: 'array', items: {$ref: schemaRef}}
    };
    if (interactions.indexOf('history-instance') !== -1) {
      var histOp
          = swagger.paths['/' + res.type + '/{id}/_history']
          = {get: getDefaultOp(res, 'history-instance')}
      histOp = histOp.get;
      histOp.parameters = [
        {name: 'id', in: 'path', required: true, type: 'string'},
        {name: '_count', in: 'query', type: 'string'},
        {name: '_since', in: 'query', type: 'string'},
      ]
    }
    if (interactions.indexOf('history-type') !== -1) {
      var histOp
          = swagger.paths['/' + res.type + '/_history']
          = {get: getDefaultOp(res, 'history-type')}
      histOp = histOp.get;
      histOp.parameters = [
        {name: '_count', in: 'query', type: 'string'},
        {name: '_since', in: 'query', type: 'string'},
      ]
    }

    if (interactions.indexOf('read') !== -1) {
      instOps.get = getDefaultOp(res, 'read');
      instOps.get.responses['200'].schema = {$ref: schemaRef};
    }
    if (interactions.indexOf('vread') !== -1) {
      var versionOp = swagger.paths['/' + res.type + '/{id}/_history/{vid}'] = {get: getDefaultOp(res)};
      versionOp = versionOp.get;
      versionOp.parameters = [
        {name: 'id', in: 'path', required: true, type: 'string'},
        {name: 'vid', in: 'path', required: true, type: 'string'},
      ];
      versionOp.responses['200'].schema = {$ref: schemaRef};
    }
    if (interactions.indexOf('update') !== -1) {
      instOps.put = getDefaultOp(res, 'update');
      instOps.put.parameters.push({
        in: 'body',
        name: 'body',
        schema: {$ref: schemaRef}
      })
    }
    if (interactions.indexOf('delete') !== -1) {
      instOps.delete = getDefaultOp(res, 'delete');
    }
  });

  swagger.tags = resources.filter(res => res.interactions)
    .map(function(res) {
    return {name: res.type};
  })

  return swagger;
}

const SWAGGER_TYPES = ['integer', 'number', 'string', 'boolean', 'array', 'object'];

var convertType = function(type) {
  if (SWAGGER_TYPES.indexOf(type) !== -1) return type;
  if (type === 'quantity') return 'integer';
  return 'string';
}

var getFormat = function(type) {
  if (type === 'date') return 'date';
}

var isEmpty = function(obj) {
  for(var key in obj) {
      if(obj.hasOwnProperty(key))
          return false;
  }
  return true;
}
