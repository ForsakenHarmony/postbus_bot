const got = require('got');

module.exports = (options) => {
  options = Object.assign({
    db: 'database',
    host: '127.0.0.1',
    port: '5984',
    user: 'admin',
    pass: 'admin'
  }, options);

  const { host, port, db, user, pass } = options;

  const baseUrl = `http://${host}:${port}/${db}/`;
  const Authorization = `Basic ${Buffer.from(user + ':' + pass).toString('base64')}`;

  const tryParseJSON = (string) => {
    try {
      return JSON.parse(string);
    } catch (_) {
      return string;
    }
  };

  const makeRequest = async (method = 'get', path = '', options = {}) => {
    const response = await got[method](baseUrl + path, Object.assign({ headers: { Authorization, Accept: 'application/json', 'Content-Type': 'application/json'} }, options));
    response.body = tryParseJSON(response.body);
    return response;
  };

  const makeRequestNoError = async (method = 'get', path = '', options = {}) => {
    try {
      return await makeRequest(method, path, options)
    } catch (e) {
      e.body = tryParseJSON(e.body);
      return e;
    }
  };

  const createDb = async () => {
    const check = await makeRequestNoError('head');
    if (check.statusCode === 404) {
      await makeRequest('put')
    }
  };

  const self = {
    find: async (query) => {
      const response = await makeRequest('post', '_find', {
        body: JSON.stringify({ selector: query })
      });
      return response.body.docs;
    },
    insert: async (obj) => {
      const response = await makeRequest('post', '', {
        body: JSON.stringify(obj)
      });
      return response.body;
    },
    get: async id => {
      const response = await makeRequest('get', id);
      return response.body;
    },
    delete: async id => {
      const { _rev } = await self.get(id);
      const response = await makeRequest('delete', id, { query: { rev: _rev } });
      return response.body;
    },
    init: async () => {
      await createDb();
    }
  };

  return self;
};
