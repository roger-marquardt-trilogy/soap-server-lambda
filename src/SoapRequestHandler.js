'use strict';

const parser = require('fast-xml-parser');
const SoapError = require('./SoapError.js');

/**
 * Soap request handler
 *
 * This class is reponsible for parsing the soap request
 */
class SoapRequestHandler {
  /**
   * Get the operation from the soap request
   *
   * @param {String} body a soap request in xml format
   */
  async getOperation(body) {
    if (parser.XMLValidator.validate(body) === true) {
      const parsed = (new parser.XMLParser()).parse(body);
      const envelopeKey = Object.keys(parsed).find((attr) =>
        attr.endsWith(':Envelope'),
      );
      const envelope = parsed[envelopeKey];
      const headerKey = this.findKey(envelope, ':Header');
      const headers = [];
      if (envelope && headerKey && envelope[headerKey]) {
        const header = envelope[headerKey];
        if (header && Object.keys(header).length > 0) {
          for (const [key, value] of Object.entries(header)) {
            if (!key.startsWith('@')) {
              headers.push({
                name: key.substring(
                  key.indexOf(':') !== -1 ? key.indexOf(':') + 1 : 0,
                ),
                value,
              });
            }
          }
        }
      }

      const bodyKey = this.findKey(envelope, ':Body');
      if (envelope && envelope[bodyKey]) {
        const soapBody = envelope[bodyKey];
        if (soapBody && Object.keys(soapBody).length > 0) {
          const operation = Object.keys(soapBody).find(
              (attr) => !attr.startsWith('@'),
          );
          const inputs = [];
          for (const [key, value] of Object.entries(soapBody[operation])) {
            // skip the attribute keys
            if (!key.startsWith('@')) {
              inputs.push({
                name: key.substring(
                  key.indexOf(':') !== -1 ? key.indexOf(':') + 1 : 0,
                ),
                value,
              });
            }
          }
          return {
            operation: operation.substring(
              operation.indexOf(':') !== -1 ? operation.indexOf(':') + 1 : 0,
            ),
            inputs,
            headers,
          };
        }
      }
    }
    throw new SoapError(
        400,
        'Couldn\'t parse the message or correct operation.',
    );
  }

  findKey(obj, key) {
    return Object.keys(obj).find((attr) => attr.endsWith(key));
  }
}

module.exports = SoapRequestHandler;
