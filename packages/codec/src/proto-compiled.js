/*eslint-disable block-scoped-var, id-length, no-control-regex, no-magic-numbers, no-prototype-builtins, no-redeclare, no-shadow, no-var, sort-vars*/
import * as $protobuf from "protobufjs/minimal";

// Common aliases
const $Reader = $protobuf.Reader, $Writer = $protobuf.Writer, $util = $protobuf.util;

// Exported root namespace
const $root = $protobuf.roots["default"] || ($protobuf.roots["default"] = {});

export const org = $root.org = (() => {

    /**
     * Namespace org.
     * @exports org
     * @namespace
     */
    const org = {};

    org.eclipse = (function() {

        /**
         * Namespace eclipse.
         * @memberof org
         * @namespace
         */
        const eclipse = {};

        eclipse.tahu = (function() {

            /**
             * Namespace tahu.
             * @memberof org.eclipse
             * @namespace
             */
            const tahu = {};

            tahu.protobuf = (function() {

                /**
                 * Namespace protobuf.
                 * @memberof org.eclipse.tahu
                 * @namespace
                 */
                const protobuf = {};

                protobuf.Payload = (function() {

                    /**
                     * Properties of a Payload.
                     * @memberof org.eclipse.tahu.protobuf
                     * @interface IPayload
                     * @property {number|Long|null} [timestamp] Payload timestamp
                     * @property {Array.<org.eclipse.tahu.protobuf.Payload.IMetric>|null} [metrics] Payload metrics
                     * @property {number|Long|null} [seq] Payload seq
                     * @property {string|null} [uuid] Payload uuid
                     * @property {Uint8Array|null} [body] Payload body
                     */

                    /**
                     * Constructs a new Payload.
                     * @memberof org.eclipse.tahu.protobuf
                     * @classdesc Represents a Payload.
                     * @implements IPayload
                     * @constructor
                     * @param {org.eclipse.tahu.protobuf.IPayload=} [properties] Properties to set
                     */
                    function Payload(properties) {
                        this.metrics = [];
                        if (properties)
                            for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                if (properties[keys[i]] != null)
                                    this[keys[i]] = properties[keys[i]];
                    }

                    /**
                     * Payload timestamp.
                     * @member {number|Long} timestamp
                     * @memberof org.eclipse.tahu.protobuf.Payload
                     * @instance
                     */
                    Payload.prototype.timestamp = $util.Long ? $util.Long.fromBits(0,0,true) : 0;

                    /**
                     * Payload metrics.
                     * @member {Array.<org.eclipse.tahu.protobuf.Payload.IMetric>} metrics
                     * @memberof org.eclipse.tahu.protobuf.Payload
                     * @instance
                     */
                    Payload.prototype.metrics = $util.emptyArray;

                    /**
                     * Payload seq.
                     * @member {number|Long} seq
                     * @memberof org.eclipse.tahu.protobuf.Payload
                     * @instance
                     */
                    Payload.prototype.seq = $util.Long ? $util.Long.fromBits(0,0,true) : 0;

                    /**
                     * Payload uuid.
                     * @member {string} uuid
                     * @memberof org.eclipse.tahu.protobuf.Payload
                     * @instance
                     */
                    Payload.prototype.uuid = "";

                    /**
                     * Payload body.
                     * @member {Uint8Array} body
                     * @memberof org.eclipse.tahu.protobuf.Payload
                     * @instance
                     */
                    Payload.prototype.body = $util.newBuffer([]);

                    /**
                     * Creates a new Payload instance using the specified properties.
                     * @function create
                     * @memberof org.eclipse.tahu.protobuf.Payload
                     * @static
                     * @param {org.eclipse.tahu.protobuf.IPayload=} [properties] Properties to set
                     * @returns {org.eclipse.tahu.protobuf.Payload} Payload instance
                     */
                    Payload.create = function create(properties) {
                        return new Payload(properties);
                    };

                    /**
                     * Encodes the specified Payload message. Does not implicitly {@link org.eclipse.tahu.protobuf.Payload.verify|verify} messages.
                     * @function encode
                     * @memberof org.eclipse.tahu.protobuf.Payload
                     * @static
                     * @param {org.eclipse.tahu.protobuf.IPayload} message Payload message or plain object to encode
                     * @param {$protobuf.Writer} [writer] Writer to encode to
                     * @returns {$protobuf.Writer} Writer
                     */
                    Payload.encode = function encode(message, writer) {
                        if (!writer)
                            writer = $Writer.create();
                        if (message.timestamp != null && Object.hasOwnProperty.call(message, "timestamp"))
                            writer.uint32(/* id 1, wireType 0 =*/8).uint64(message.timestamp);
                        if (message.metrics != null && message.metrics.length)
                            for (let i = 0; i < message.metrics.length; ++i)
                                $root.org.eclipse.tahu.protobuf.Payload.Metric.encode(message.metrics[i], writer.uint32(/* id 2, wireType 2 =*/18).fork()).ldelim();
                        if (message.seq != null && Object.hasOwnProperty.call(message, "seq"))
                            writer.uint32(/* id 3, wireType 0 =*/24).uint64(message.seq);
                        if (message.uuid != null && Object.hasOwnProperty.call(message, "uuid"))
                            writer.uint32(/* id 4, wireType 2 =*/34).string(message.uuid);
                        if (message.body != null && Object.hasOwnProperty.call(message, "body"))
                            writer.uint32(/* id 5, wireType 2 =*/42).bytes(message.body);
                        return writer;
                    };

                    /**
                     * Encodes the specified Payload message, length delimited. Does not implicitly {@link org.eclipse.tahu.protobuf.Payload.verify|verify} messages.
                     * @function encodeDelimited
                     * @memberof org.eclipse.tahu.protobuf.Payload
                     * @static
                     * @param {org.eclipse.tahu.protobuf.IPayload} message Payload message or plain object to encode
                     * @param {$protobuf.Writer} [writer] Writer to encode to
                     * @returns {$protobuf.Writer} Writer
                     */
                    Payload.encodeDelimited = function encodeDelimited(message, writer) {
                        return this.encode(message, writer).ldelim();
                    };

                    /**
                     * Decodes a Payload message from the specified reader or buffer.
                     * @function decode
                     * @memberof org.eclipse.tahu.protobuf.Payload
                     * @static
                     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                     * @param {number} [length] Message length if known beforehand
                     * @returns {org.eclipse.tahu.protobuf.Payload} Payload
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    Payload.decode = function decode(reader, length, error) {
                        if (!(reader instanceof $Reader))
                            reader = $Reader.create(reader);
                        let end = length === undefined ? reader.len : reader.pos + length, message = new $root.org.eclipse.tahu.protobuf.Payload();
                        while (reader.pos < end) {
                            let tag = reader.uint32();
                            if (tag === error)
                                break;
                            switch (tag >>> 3) {
                            case 1: {
                                    message.timestamp = reader.uint64();
                                    break;
                                }
                            case 2: {
                                    if (!(message.metrics && message.metrics.length))
                                        message.metrics = [];
                                    message.metrics.push($root.org.eclipse.tahu.protobuf.Payload.Metric.decode(reader, reader.uint32()));
                                    break;
                                }
                            case 3: {
                                    message.seq = reader.uint64();
                                    break;
                                }
                            case 4: {
                                    message.uuid = reader.string();
                                    break;
                                }
                            case 5: {
                                    message.body = reader.bytes();
                                    break;
                                }
                            default:
                                reader.skipType(tag & 7);
                                break;
                            }
                        }
                        return message;
                    };

                    /**
                     * Decodes a Payload message from the specified reader or buffer, length delimited.
                     * @function decodeDelimited
                     * @memberof org.eclipse.tahu.protobuf.Payload
                     * @static
                     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                     * @returns {org.eclipse.tahu.protobuf.Payload} Payload
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    Payload.decodeDelimited = function decodeDelimited(reader) {
                        if (!(reader instanceof $Reader))
                            reader = new $Reader(reader);
                        return this.decode(reader, reader.uint32());
                    };

                    /**
                     * Creates a Payload message from a plain object. Also converts values to their respective internal types.
                     * @function fromObject
                     * @memberof org.eclipse.tahu.protobuf.Payload
                     * @static
                     * @param {Object.<string,*>} object Plain object
                     * @returns {org.eclipse.tahu.protobuf.Payload} Payload
                     */
                    Payload.fromObject = function fromObject(object) {
                        if (object instanceof $root.org.eclipse.tahu.protobuf.Payload)
                            return object;
                        let message = new $root.org.eclipse.tahu.protobuf.Payload();
                        if (object.timestamp != null)
                            if ($util.Long)
                                (message.timestamp = $util.Long.fromValue(object.timestamp)).unsigned = true;
                            else if (typeof object.timestamp === "string")
                                message.timestamp = parseInt(object.timestamp, 10);
                            else if (typeof object.timestamp === "number")
                                message.timestamp = object.timestamp;
                            else if (typeof object.timestamp === "object")
                                message.timestamp = new $util.LongBits(object.timestamp.low >>> 0, object.timestamp.high >>> 0).toNumber(true);
                        if (object.metrics) {
                            if (!Array.isArray(object.metrics))
                                throw TypeError(".org.eclipse.tahu.protobuf.Payload.metrics: array expected");
                            message.metrics = [];
                            for (let i = 0; i < object.metrics.length; ++i) {
                                if (typeof object.metrics[i] !== "object")
                                    throw TypeError(".org.eclipse.tahu.protobuf.Payload.metrics: object expected");
                                message.metrics[i] = $root.org.eclipse.tahu.protobuf.Payload.Metric.fromObject(object.metrics[i]);
                            }
                        }
                        if (object.seq != null)
                            if ($util.Long)
                                (message.seq = $util.Long.fromValue(object.seq)).unsigned = true;
                            else if (typeof object.seq === "string")
                                message.seq = parseInt(object.seq, 10);
                            else if (typeof object.seq === "number")
                                message.seq = object.seq;
                            else if (typeof object.seq === "object")
                                message.seq = new $util.LongBits(object.seq.low >>> 0, object.seq.high >>> 0).toNumber(true);
                        if (object.uuid != null)
                            message.uuid = String(object.uuid);
                        if (object.body != null)
                            if (typeof object.body === "string")
                                $util.base64.decode(object.body, message.body = $util.newBuffer($util.base64.length(object.body)), 0);
                            else if (object.body.length >= 0)
                                message.body = object.body;
                        return message;
                    };

                    /**
                     * Creates a plain object from a Payload message. Also converts values to other types if specified.
                     * @function toObject
                     * @memberof org.eclipse.tahu.protobuf.Payload
                     * @static
                     * @param {org.eclipse.tahu.protobuf.Payload} message Payload
                     * @param {$protobuf.IConversionOptions} [options] Conversion options
                     * @returns {Object.<string,*>} Plain object
                     */
                    Payload.toObject = function toObject(message, options) {
                        if (!options)
                            options = {};
                        let object = {};
                        if (options.arrays || options.defaults)
                            object.metrics = [];
                        if (options.defaults) {
                            if ($util.Long) {
                                let long = new $util.Long(0, 0, true);
                                object.timestamp = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                            } else
                                object.timestamp = options.longs === String ? "0" : 0;
                            if ($util.Long) {
                                let long = new $util.Long(0, 0, true);
                                object.seq = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                            } else
                                object.seq = options.longs === String ? "0" : 0;
                            object.uuid = "";
                            if (options.bytes === String)
                                object.body = "";
                            else {
                                object.body = [];
                                if (options.bytes !== Array)
                                    object.body = $util.newBuffer(object.body);
                            }
                        }
                        if (message.timestamp != null && message.hasOwnProperty("timestamp"))
                            if (typeof message.timestamp === "number")
                                object.timestamp = options.longs === String ? String(message.timestamp) : message.timestamp;
                            else
                                object.timestamp = options.longs === String ? $util.Long.prototype.toString.call(message.timestamp) : options.longs === Number ? new $util.LongBits(message.timestamp.low >>> 0, message.timestamp.high >>> 0).toNumber(true) : message.timestamp;
                        if (message.metrics && message.metrics.length) {
                            object.metrics = [];
                            for (let j = 0; j < message.metrics.length; ++j)
                                object.metrics[j] = $root.org.eclipse.tahu.protobuf.Payload.Metric.toObject(message.metrics[j], options);
                        }
                        if (message.seq != null && message.hasOwnProperty("seq"))
                            if (typeof message.seq === "number")
                                object.seq = options.longs === String ? String(message.seq) : message.seq;
                            else
                                object.seq = options.longs === String ? $util.Long.prototype.toString.call(message.seq) : options.longs === Number ? new $util.LongBits(message.seq.low >>> 0, message.seq.high >>> 0).toNumber(true) : message.seq;
                        if (message.uuid != null && message.hasOwnProperty("uuid"))
                            object.uuid = message.uuid;
                        if (message.body != null && message.hasOwnProperty("body"))
                            object.body = options.bytes === String ? $util.base64.encode(message.body, 0, message.body.length) : options.bytes === Array ? Array.prototype.slice.call(message.body) : message.body;
                        return object;
                    };

                    /**
                     * Converts this Payload to JSON.
                     * @function toJSON
                     * @memberof org.eclipse.tahu.protobuf.Payload
                     * @instance
                     * @returns {Object.<string,*>} JSON object
                     */
                    Payload.prototype.toJSON = function toJSON() {
                        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                    };

                    /**
                     * Gets the default type url for Payload
                     * @function getTypeUrl
                     * @memberof org.eclipse.tahu.protobuf.Payload
                     * @static
                     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                     * @returns {string} The default type url
                     */
                    Payload.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                        if (typeUrlPrefix === undefined) {
                            typeUrlPrefix = "type.googleapis.com";
                        }
                        return typeUrlPrefix + "/org.eclipse.tahu.protobuf.Payload";
                    };

                    Payload.Template = (function() {

                        /**
                         * Properties of a Template.
                         * @memberof org.eclipse.tahu.protobuf.Payload
                         * @interface ITemplate
                         * @property {string|null} [version] Template version
                         * @property {Array.<org.eclipse.tahu.protobuf.Payload.IMetric>|null} [metrics] Template metrics
                         * @property {org.eclipse.tahu.protobuf.Payload.IParameterSet|null} [parameters] Template parameters
                         * @property {string|null} [templateRef] Template templateRef
                         * @property {boolean|null} [isDefinition] Template isDefinition
                         */

                        /**
                         * Constructs a new Template.
                         * @memberof org.eclipse.tahu.protobuf.Payload
                         * @classdesc Represents a Template.
                         * @implements ITemplate
                         * @constructor
                         * @param {org.eclipse.tahu.protobuf.Payload.ITemplate=} [properties] Properties to set
                         */
                        function Template(properties) {
                            this.metrics = [];
                            if (properties)
                                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                    if (properties[keys[i]] != null)
                                        this[keys[i]] = properties[keys[i]];
                        }

                        /**
                         * Template version.
                         * @member {string} version
                         * @memberof org.eclipse.tahu.protobuf.Payload.Template
                         * @instance
                         */
                        Template.prototype.version = "";

                        /**
                         * Template metrics.
                         * @member {Array.<org.eclipse.tahu.protobuf.Payload.IMetric>} metrics
                         * @memberof org.eclipse.tahu.protobuf.Payload.Template
                         * @instance
                         */
                        Template.prototype.metrics = $util.emptyArray;

                        /**
                         * Template parameters.
                         * @member {org.eclipse.tahu.protobuf.Payload.IParameterSet|null|undefined} parameters
                         * @memberof org.eclipse.tahu.protobuf.Payload.Template
                         * @instance
                         */
                        Template.prototype.parameters = null;

                        /**
                         * Template templateRef.
                         * @member {string} templateRef
                         * @memberof org.eclipse.tahu.protobuf.Payload.Template
                         * @instance
                         */
                        Template.prototype.templateRef = "";

                        /**
                         * Template isDefinition.
                         * @member {boolean} isDefinition
                         * @memberof org.eclipse.tahu.protobuf.Payload.Template
                         * @instance
                         */
                        Template.prototype.isDefinition = false;

                        /**
                         * Creates a new Template instance using the specified properties.
                         * @function create
                         * @memberof org.eclipse.tahu.protobuf.Payload.Template
                         * @static
                         * @param {org.eclipse.tahu.protobuf.Payload.ITemplate=} [properties] Properties to set
                         * @returns {org.eclipse.tahu.protobuf.Payload.Template} Template instance
                         */
                        Template.create = function create(properties) {
                            return new Template(properties);
                        };

                        /**
                         * Encodes the specified Template message. Does not implicitly {@link org.eclipse.tahu.protobuf.Payload.Template.verify|verify} messages.
                         * @function encode
                         * @memberof org.eclipse.tahu.protobuf.Payload.Template
                         * @static
                         * @param {org.eclipse.tahu.protobuf.Payload.ITemplate} message Template message or plain object to encode
                         * @param {$protobuf.Writer} [writer] Writer to encode to
                         * @returns {$protobuf.Writer} Writer
                         */
                        Template.encode = function encode(message, writer) {
                            if (!writer)
                                writer = $Writer.create();
                            if (message.version != null && Object.hasOwnProperty.call(message, "version"))
                                writer.uint32(/* id 1, wireType 2 =*/10).string(message.version);
                            if (message.metrics != null && message.metrics.length)
                                for (let i = 0; i < message.metrics.length; ++i)
                                    $root.org.eclipse.tahu.protobuf.Payload.Metric.encode(message.metrics[i], writer.uint32(/* id 2, wireType 2 =*/18).fork()).ldelim();
                            if (message.parameters != null && Object.hasOwnProperty.call(message, "parameters"))
                                $root.org.eclipse.tahu.protobuf.Payload.ParameterSet.encode(message.parameters, writer.uint32(/* id 3, wireType 2 =*/26).fork()).ldelim();
                            if (message.templateRef != null && Object.hasOwnProperty.call(message, "templateRef"))
                                writer.uint32(/* id 4, wireType 2 =*/34).string(message.templateRef);
                            if (message.isDefinition != null && Object.hasOwnProperty.call(message, "isDefinition"))
                                writer.uint32(/* id 5, wireType 0 =*/40).bool(message.isDefinition);
                            return writer;
                        };

                        /**
                         * Encodes the specified Template message, length delimited. Does not implicitly {@link org.eclipse.tahu.protobuf.Payload.Template.verify|verify} messages.
                         * @function encodeDelimited
                         * @memberof org.eclipse.tahu.protobuf.Payload.Template
                         * @static
                         * @param {org.eclipse.tahu.protobuf.Payload.ITemplate} message Template message or plain object to encode
                         * @param {$protobuf.Writer} [writer] Writer to encode to
                         * @returns {$protobuf.Writer} Writer
                         */
                        Template.encodeDelimited = function encodeDelimited(message, writer) {
                            return this.encode(message, writer).ldelim();
                        };

                        /**
                         * Decodes a Template message from the specified reader or buffer.
                         * @function decode
                         * @memberof org.eclipse.tahu.protobuf.Payload.Template
                         * @static
                         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                         * @param {number} [length] Message length if known beforehand
                         * @returns {org.eclipse.tahu.protobuf.Payload.Template} Template
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        Template.decode = function decode(reader, length, error) {
                            if (!(reader instanceof $Reader))
                                reader = $Reader.create(reader);
                            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.org.eclipse.tahu.protobuf.Payload.Template();
                            while (reader.pos < end) {
                                let tag = reader.uint32();
                                if (tag === error)
                                    break;
                                switch (tag >>> 3) {
                                case 1: {
                                        message.version = reader.string();
                                        break;
                                    }
                                case 2: {
                                        if (!(message.metrics && message.metrics.length))
                                            message.metrics = [];
                                        message.metrics.push($root.org.eclipse.tahu.protobuf.Payload.Metric.decode(reader, reader.uint32()));
                                        break;
                                    }
                                case 3: {
                                        message.parameters = $root.org.eclipse.tahu.protobuf.Payload.ParameterSet.decode(reader, reader.uint32());
                                        break;
                                    }
                                case 4: {
                                        message.templateRef = reader.string();
                                        break;
                                    }
                                case 5: {
                                        message.isDefinition = reader.bool();
                                        break;
                                    }
                                default:
                                    reader.skipType(tag & 7);
                                    break;
                                }
                            }
                            return message;
                        };

                        /**
                         * Decodes a Template message from the specified reader or buffer, length delimited.
                         * @function decodeDelimited
                         * @memberof org.eclipse.tahu.protobuf.Payload.Template
                         * @static
                         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                         * @returns {org.eclipse.tahu.protobuf.Payload.Template} Template
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        Template.decodeDelimited = function decodeDelimited(reader) {
                            if (!(reader instanceof $Reader))
                                reader = new $Reader(reader);
                            return this.decode(reader, reader.uint32());
                        };

                        /**
                         * Creates a Template message from a plain object. Also converts values to their respective internal types.
                         * @function fromObject
                         * @memberof org.eclipse.tahu.protobuf.Payload.Template
                         * @static
                         * @param {Object.<string,*>} object Plain object
                         * @returns {org.eclipse.tahu.protobuf.Payload.Template} Template
                         */
                        Template.fromObject = function fromObject(object) {
                            if (object instanceof $root.org.eclipse.tahu.protobuf.Payload.Template)
                                return object;
                            let message = new $root.org.eclipse.tahu.protobuf.Payload.Template();
                            if (object.version != null)
                                message.version = String(object.version);
                            if (object.metrics) {
                                if (!Array.isArray(object.metrics))
                                    throw TypeError(".org.eclipse.tahu.protobuf.Payload.Template.metrics: array expected");
                                message.metrics = [];
                                for (let i = 0; i < object.metrics.length; ++i) {
                                    if (typeof object.metrics[i] !== "object")
                                        throw TypeError(".org.eclipse.tahu.protobuf.Payload.Template.metrics: object expected");
                                    message.metrics[i] = $root.org.eclipse.tahu.protobuf.Payload.Metric.fromObject(object.metrics[i]);
                                }
                            }
                            if (object.parameters != null) {
                                if (typeof object.parameters !== "object")
                                    throw TypeError(".org.eclipse.tahu.protobuf.Payload.Template.parameters: object expected");
                                message.parameters = $root.org.eclipse.tahu.protobuf.Payload.ParameterSet.fromObject(object.parameters);
                            }
                            if (object.templateRef != null)
                                message.templateRef = String(object.templateRef);
                            if (object.isDefinition != null)
                                message.isDefinition = Boolean(object.isDefinition);
                            return message;
                        };

                        /**
                         * Creates a plain object from a Template message. Also converts values to other types if specified.
                         * @function toObject
                         * @memberof org.eclipse.tahu.protobuf.Payload.Template
                         * @static
                         * @param {org.eclipse.tahu.protobuf.Payload.Template} message Template
                         * @param {$protobuf.IConversionOptions} [options] Conversion options
                         * @returns {Object.<string,*>} Plain object
                         */
                        Template.toObject = function toObject(message, options) {
                            if (!options)
                                options = {};
                            let object = {};
                            if (options.arrays || options.defaults)
                                object.metrics = [];
                            if (options.defaults) {
                                object.version = "";
                                object.parameters = null;
                                object.templateRef = "";
                                object.isDefinition = false;
                            }
                            if (message.version != null && message.hasOwnProperty("version"))
                                object.version = message.version;
                            if (message.metrics && message.metrics.length) {
                                object.metrics = [];
                                for (let j = 0; j < message.metrics.length; ++j)
                                    object.metrics[j] = $root.org.eclipse.tahu.protobuf.Payload.Metric.toObject(message.metrics[j], options);
                            }
                            if (message.parameters != null && message.hasOwnProperty("parameters"))
                                object.parameters = $root.org.eclipse.tahu.protobuf.Payload.ParameterSet.toObject(message.parameters, options);
                            if (message.templateRef != null && message.hasOwnProperty("templateRef"))
                                object.templateRef = message.templateRef;
                            if (message.isDefinition != null && message.hasOwnProperty("isDefinition"))
                                object.isDefinition = message.isDefinition;
                            return object;
                        };

                        /**
                         * Converts this Template to JSON.
                         * @function toJSON
                         * @memberof org.eclipse.tahu.protobuf.Payload.Template
                         * @instance
                         * @returns {Object.<string,*>} JSON object
                         */
                        Template.prototype.toJSON = function toJSON() {
                            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                        };

                        /**
                         * Gets the default type url for Template
                         * @function getTypeUrl
                         * @memberof org.eclipse.tahu.protobuf.Payload.Template
                         * @static
                         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                         * @returns {string} The default type url
                         */
                        Template.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                            if (typeUrlPrefix === undefined) {
                                typeUrlPrefix = "type.googleapis.com";
                            }
                            return typeUrlPrefix + "/org.eclipse.tahu.protobuf.Payload.Template";
                        };

                        return Template;
                    })();

                    Payload.DataSet = (function() {

                        /**
                         * Properties of a DataSet.
                         * @memberof org.eclipse.tahu.protobuf.Payload
                         * @interface IDataSet
                         * @property {number|Long|null} [numOfColumns] DataSet numOfColumns
                         * @property {Array.<string>|null} [columns] DataSet columns
                         * @property {Array.<number>|null} [types] DataSet types
                         * @property {Array.<org.eclipse.tahu.protobuf.Payload.DataSet.IRow>|null} [rows] DataSet rows
                         */

                        /**
                         * Constructs a new DataSet.
                         * @memberof org.eclipse.tahu.protobuf.Payload
                         * @classdesc Represents a DataSet.
                         * @implements IDataSet
                         * @constructor
                         * @param {org.eclipse.tahu.protobuf.Payload.IDataSet=} [properties] Properties to set
                         */
                        function DataSet(properties) {
                            this.columns = [];
                            this.types = [];
                            this.rows = [];
                            if (properties)
                                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                    if (properties[keys[i]] != null)
                                        this[keys[i]] = properties[keys[i]];
                        }

                        /**
                         * DataSet numOfColumns.
                         * @member {number|Long} numOfColumns
                         * @memberof org.eclipse.tahu.protobuf.Payload.DataSet
                         * @instance
                         */
                        DataSet.prototype.numOfColumns = $util.Long ? $util.Long.fromBits(0,0,true) : 0;

                        /**
                         * DataSet columns.
                         * @member {Array.<string>} columns
                         * @memberof org.eclipse.tahu.protobuf.Payload.DataSet
                         * @instance
                         */
                        DataSet.prototype.columns = $util.emptyArray;

                        /**
                         * DataSet types.
                         * @member {Array.<number>} types
                         * @memberof org.eclipse.tahu.protobuf.Payload.DataSet
                         * @instance
                         */
                        DataSet.prototype.types = $util.emptyArray;

                        /**
                         * DataSet rows.
                         * @member {Array.<org.eclipse.tahu.protobuf.Payload.DataSet.IRow>} rows
                         * @memberof org.eclipse.tahu.protobuf.Payload.DataSet
                         * @instance
                         */
                        DataSet.prototype.rows = $util.emptyArray;

                        /**
                         * Creates a new DataSet instance using the specified properties.
                         * @function create
                         * @memberof org.eclipse.tahu.protobuf.Payload.DataSet
                         * @static
                         * @param {org.eclipse.tahu.protobuf.Payload.IDataSet=} [properties] Properties to set
                         * @returns {org.eclipse.tahu.protobuf.Payload.DataSet} DataSet instance
                         */
                        DataSet.create = function create(properties) {
                            return new DataSet(properties);
                        };

                        /**
                         * Encodes the specified DataSet message. Does not implicitly {@link org.eclipse.tahu.protobuf.Payload.DataSet.verify|verify} messages.
                         * @function encode
                         * @memberof org.eclipse.tahu.protobuf.Payload.DataSet
                         * @static
                         * @param {org.eclipse.tahu.protobuf.Payload.IDataSet} message DataSet message or plain object to encode
                         * @param {$protobuf.Writer} [writer] Writer to encode to
                         * @returns {$protobuf.Writer} Writer
                         */
                        DataSet.encode = function encode(message, writer) {
                            if (!writer)
                                writer = $Writer.create();
                            if (message.numOfColumns != null && Object.hasOwnProperty.call(message, "numOfColumns"))
                                writer.uint32(/* id 1, wireType 0 =*/8).uint64(message.numOfColumns);
                            if (message.columns != null && message.columns.length)
                                for (let i = 0; i < message.columns.length; ++i)
                                    writer.uint32(/* id 2, wireType 2 =*/18).string(message.columns[i]);
                            if (message.types != null && message.types.length)
                                for (let i = 0; i < message.types.length; ++i)
                                    writer.uint32(/* id 3, wireType 0 =*/24).uint32(message.types[i]);
                            if (message.rows != null && message.rows.length)
                                for (let i = 0; i < message.rows.length; ++i)
                                    $root.org.eclipse.tahu.protobuf.Payload.DataSet.Row.encode(message.rows[i], writer.uint32(/* id 4, wireType 2 =*/34).fork()).ldelim();
                            return writer;
                        };

                        /**
                         * Encodes the specified DataSet message, length delimited. Does not implicitly {@link org.eclipse.tahu.protobuf.Payload.DataSet.verify|verify} messages.
                         * @function encodeDelimited
                         * @memberof org.eclipse.tahu.protobuf.Payload.DataSet
                         * @static
                         * @param {org.eclipse.tahu.protobuf.Payload.IDataSet} message DataSet message or plain object to encode
                         * @param {$protobuf.Writer} [writer] Writer to encode to
                         * @returns {$protobuf.Writer} Writer
                         */
                        DataSet.encodeDelimited = function encodeDelimited(message, writer) {
                            return this.encode(message, writer).ldelim();
                        };

                        /**
                         * Decodes a DataSet message from the specified reader or buffer.
                         * @function decode
                         * @memberof org.eclipse.tahu.protobuf.Payload.DataSet
                         * @static
                         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                         * @param {number} [length] Message length if known beforehand
                         * @returns {org.eclipse.tahu.protobuf.Payload.DataSet} DataSet
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        DataSet.decode = function decode(reader, length, error) {
                            if (!(reader instanceof $Reader))
                                reader = $Reader.create(reader);
                            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.org.eclipse.tahu.protobuf.Payload.DataSet();
                            while (reader.pos < end) {
                                let tag = reader.uint32();
                                if (tag === error)
                                    break;
                                switch (tag >>> 3) {
                                case 1: {
                                        message.numOfColumns = reader.uint64();
                                        break;
                                    }
                                case 2: {
                                        if (!(message.columns && message.columns.length))
                                            message.columns = [];
                                        message.columns.push(reader.string());
                                        break;
                                    }
                                case 3: {
                                        if (!(message.types && message.types.length))
                                            message.types = [];
                                        if ((tag & 7) === 2) {
                                            let end2 = reader.uint32() + reader.pos;
                                            while (reader.pos < end2)
                                                message.types.push(reader.uint32());
                                        } else
                                            message.types.push(reader.uint32());
                                        break;
                                    }
                                case 4: {
                                        if (!(message.rows && message.rows.length))
                                            message.rows = [];
                                        message.rows.push($root.org.eclipse.tahu.protobuf.Payload.DataSet.Row.decode(reader, reader.uint32()));
                                        break;
                                    }
                                default:
                                    reader.skipType(tag & 7);
                                    break;
                                }
                            }
                            return message;
                        };

                        /**
                         * Decodes a DataSet message from the specified reader or buffer, length delimited.
                         * @function decodeDelimited
                         * @memberof org.eclipse.tahu.protobuf.Payload.DataSet
                         * @static
                         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                         * @returns {org.eclipse.tahu.protobuf.Payload.DataSet} DataSet
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        DataSet.decodeDelimited = function decodeDelimited(reader) {
                            if (!(reader instanceof $Reader))
                                reader = new $Reader(reader);
                            return this.decode(reader, reader.uint32());
                        };

                        /**
                         * Creates a DataSet message from a plain object. Also converts values to their respective internal types.
                         * @function fromObject
                         * @memberof org.eclipse.tahu.protobuf.Payload.DataSet
                         * @static
                         * @param {Object.<string,*>} object Plain object
                         * @returns {org.eclipse.tahu.protobuf.Payload.DataSet} DataSet
                         */
                        DataSet.fromObject = function fromObject(object) {
                            if (object instanceof $root.org.eclipse.tahu.protobuf.Payload.DataSet)
                                return object;
                            let message = new $root.org.eclipse.tahu.protobuf.Payload.DataSet();
                            if (object.numOfColumns != null)
                                if ($util.Long)
                                    (message.numOfColumns = $util.Long.fromValue(object.numOfColumns)).unsigned = true;
                                else if (typeof object.numOfColumns === "string")
                                    message.numOfColumns = parseInt(object.numOfColumns, 10);
                                else if (typeof object.numOfColumns === "number")
                                    message.numOfColumns = object.numOfColumns;
                                else if (typeof object.numOfColumns === "object")
                                    message.numOfColumns = new $util.LongBits(object.numOfColumns.low >>> 0, object.numOfColumns.high >>> 0).toNumber(true);
                            if (object.columns) {
                                if (!Array.isArray(object.columns))
                                    throw TypeError(".org.eclipse.tahu.protobuf.Payload.DataSet.columns: array expected");
                                message.columns = [];
                                for (let i = 0; i < object.columns.length; ++i)
                                    message.columns[i] = String(object.columns[i]);
                            }
                            if (object.types) {
                                if (!Array.isArray(object.types))
                                    throw TypeError(".org.eclipse.tahu.protobuf.Payload.DataSet.types: array expected");
                                message.types = [];
                                for (let i = 0; i < object.types.length; ++i)
                                    message.types[i] = object.types[i] >>> 0;
                            }
                            if (object.rows) {
                                if (!Array.isArray(object.rows))
                                    throw TypeError(".org.eclipse.tahu.protobuf.Payload.DataSet.rows: array expected");
                                message.rows = [];
                                for (let i = 0; i < object.rows.length; ++i) {
                                    if (typeof object.rows[i] !== "object")
                                        throw TypeError(".org.eclipse.tahu.protobuf.Payload.DataSet.rows: object expected");
                                    message.rows[i] = $root.org.eclipse.tahu.protobuf.Payload.DataSet.Row.fromObject(object.rows[i]);
                                }
                            }
                            return message;
                        };

                        /**
                         * Creates a plain object from a DataSet message. Also converts values to other types if specified.
                         * @function toObject
                         * @memberof org.eclipse.tahu.protobuf.Payload.DataSet
                         * @static
                         * @param {org.eclipse.tahu.protobuf.Payload.DataSet} message DataSet
                         * @param {$protobuf.IConversionOptions} [options] Conversion options
                         * @returns {Object.<string,*>} Plain object
                         */
                        DataSet.toObject = function toObject(message, options) {
                            if (!options)
                                options = {};
                            let object = {};
                            if (options.arrays || options.defaults) {
                                object.columns = [];
                                object.types = [];
                                object.rows = [];
                            }
                            if (options.defaults)
                                if ($util.Long) {
                                    let long = new $util.Long(0, 0, true);
                                    object.numOfColumns = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                                } else
                                    object.numOfColumns = options.longs === String ? "0" : 0;
                            if (message.numOfColumns != null && message.hasOwnProperty("numOfColumns"))
                                if (typeof message.numOfColumns === "number")
                                    object.numOfColumns = options.longs === String ? String(message.numOfColumns) : message.numOfColumns;
                                else
                                    object.numOfColumns = options.longs === String ? $util.Long.prototype.toString.call(message.numOfColumns) : options.longs === Number ? new $util.LongBits(message.numOfColumns.low >>> 0, message.numOfColumns.high >>> 0).toNumber(true) : message.numOfColumns;
                            if (message.columns && message.columns.length) {
                                object.columns = [];
                                for (let j = 0; j < message.columns.length; ++j)
                                    object.columns[j] = message.columns[j];
                            }
                            if (message.types && message.types.length) {
                                object.types = [];
                                for (let j = 0; j < message.types.length; ++j)
                                    object.types[j] = message.types[j];
                            }
                            if (message.rows && message.rows.length) {
                                object.rows = [];
                                for (let j = 0; j < message.rows.length; ++j)
                                    object.rows[j] = $root.org.eclipse.tahu.protobuf.Payload.DataSet.Row.toObject(message.rows[j], options);
                            }
                            return object;
                        };

                        /**
                         * Converts this DataSet to JSON.
                         * @function toJSON
                         * @memberof org.eclipse.tahu.protobuf.Payload.DataSet
                         * @instance
                         * @returns {Object.<string,*>} JSON object
                         */
                        DataSet.prototype.toJSON = function toJSON() {
                            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                        };

                        /**
                         * Gets the default type url for DataSet
                         * @function getTypeUrl
                         * @memberof org.eclipse.tahu.protobuf.Payload.DataSet
                         * @static
                         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                         * @returns {string} The default type url
                         */
                        DataSet.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                            if (typeUrlPrefix === undefined) {
                                typeUrlPrefix = "type.googleapis.com";
                            }
                            return typeUrlPrefix + "/org.eclipse.tahu.protobuf.Payload.DataSet";
                        };

                        DataSet.Row = (function() {

                            /**
                             * Properties of a Row.
                             * @memberof org.eclipse.tahu.protobuf.Payload.DataSet
                             * @interface IRow
                             * @property {Array.<org.eclipse.tahu.protobuf.Payload.DataSet.IDataSetValue>|null} [elements] Row elements
                             */

                            /**
                             * Constructs a new Row.
                             * @memberof org.eclipse.tahu.protobuf.Payload.DataSet
                             * @classdesc Represents a Row.
                             * @implements IRow
                             * @constructor
                             * @param {org.eclipse.tahu.protobuf.Payload.DataSet.IRow=} [properties] Properties to set
                             */
                            function Row(properties) {
                                this.elements = [];
                                if (properties)
                                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                        if (properties[keys[i]] != null)
                                            this[keys[i]] = properties[keys[i]];
                            }

                            /**
                             * Row elements.
                             * @member {Array.<org.eclipse.tahu.protobuf.Payload.DataSet.IDataSetValue>} elements
                             * @memberof org.eclipse.tahu.protobuf.Payload.DataSet.Row
                             * @instance
                             */
                            Row.prototype.elements = $util.emptyArray;

                            /**
                             * Creates a new Row instance using the specified properties.
                             * @function create
                             * @memberof org.eclipse.tahu.protobuf.Payload.DataSet.Row
                             * @static
                             * @param {org.eclipse.tahu.protobuf.Payload.DataSet.IRow=} [properties] Properties to set
                             * @returns {org.eclipse.tahu.protobuf.Payload.DataSet.Row} Row instance
                             */
                            Row.create = function create(properties) {
                                return new Row(properties);
                            };

                            /**
                             * Encodes the specified Row message. Does not implicitly {@link org.eclipse.tahu.protobuf.Payload.DataSet.Row.verify|verify} messages.
                             * @function encode
                             * @memberof org.eclipse.tahu.protobuf.Payload.DataSet.Row
                             * @static
                             * @param {org.eclipse.tahu.protobuf.Payload.DataSet.IRow} message Row message or plain object to encode
                             * @param {$protobuf.Writer} [writer] Writer to encode to
                             * @returns {$protobuf.Writer} Writer
                             */
                            Row.encode = function encode(message, writer) {
                                if (!writer)
                                    writer = $Writer.create();
                                if (message.elements != null && message.elements.length)
                                    for (let i = 0; i < message.elements.length; ++i)
                                        $root.org.eclipse.tahu.protobuf.Payload.DataSet.DataSetValue.encode(message.elements[i], writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
                                return writer;
                            };

                            /**
                             * Encodes the specified Row message, length delimited. Does not implicitly {@link org.eclipse.tahu.protobuf.Payload.DataSet.Row.verify|verify} messages.
                             * @function encodeDelimited
                             * @memberof org.eclipse.tahu.protobuf.Payload.DataSet.Row
                             * @static
                             * @param {org.eclipse.tahu.protobuf.Payload.DataSet.IRow} message Row message or plain object to encode
                             * @param {$protobuf.Writer} [writer] Writer to encode to
                             * @returns {$protobuf.Writer} Writer
                             */
                            Row.encodeDelimited = function encodeDelimited(message, writer) {
                                return this.encode(message, writer).ldelim();
                            };

                            /**
                             * Decodes a Row message from the specified reader or buffer.
                             * @function decode
                             * @memberof org.eclipse.tahu.protobuf.Payload.DataSet.Row
                             * @static
                             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                             * @param {number} [length] Message length if known beforehand
                             * @returns {org.eclipse.tahu.protobuf.Payload.DataSet.Row} Row
                             * @throws {Error} If the payload is not a reader or valid buffer
                             * @throws {$protobuf.util.ProtocolError} If required fields are missing
                             */
                            Row.decode = function decode(reader, length, error) {
                                if (!(reader instanceof $Reader))
                                    reader = $Reader.create(reader);
                                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.org.eclipse.tahu.protobuf.Payload.DataSet.Row();
                                while (reader.pos < end) {
                                    let tag = reader.uint32();
                                    if (tag === error)
                                        break;
                                    switch (tag >>> 3) {
                                    case 1: {
                                            if (!(message.elements && message.elements.length))
                                                message.elements = [];
                                            message.elements.push($root.org.eclipse.tahu.protobuf.Payload.DataSet.DataSetValue.decode(reader, reader.uint32()));
                                            break;
                                        }
                                    default:
                                        reader.skipType(tag & 7);
                                        break;
                                    }
                                }
                                return message;
                            };

                            /**
                             * Decodes a Row message from the specified reader or buffer, length delimited.
                             * @function decodeDelimited
                             * @memberof org.eclipse.tahu.protobuf.Payload.DataSet.Row
                             * @static
                             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                             * @returns {org.eclipse.tahu.protobuf.Payload.DataSet.Row} Row
                             * @throws {Error} If the payload is not a reader or valid buffer
                             * @throws {$protobuf.util.ProtocolError} If required fields are missing
                             */
                            Row.decodeDelimited = function decodeDelimited(reader) {
                                if (!(reader instanceof $Reader))
                                    reader = new $Reader(reader);
                                return this.decode(reader, reader.uint32());
                            };

                            /**
                             * Creates a Row message from a plain object. Also converts values to their respective internal types.
                             * @function fromObject
                             * @memberof org.eclipse.tahu.protobuf.Payload.DataSet.Row
                             * @static
                             * @param {Object.<string,*>} object Plain object
                             * @returns {org.eclipse.tahu.protobuf.Payload.DataSet.Row} Row
                             */
                            Row.fromObject = function fromObject(object) {
                                if (object instanceof $root.org.eclipse.tahu.protobuf.Payload.DataSet.Row)
                                    return object;
                                let message = new $root.org.eclipse.tahu.protobuf.Payload.DataSet.Row();
                                if (object.elements) {
                                    if (!Array.isArray(object.elements))
                                        throw TypeError(".org.eclipse.tahu.protobuf.Payload.DataSet.Row.elements: array expected");
                                    message.elements = [];
                                    for (let i = 0; i < object.elements.length; ++i) {
                                        if (typeof object.elements[i] !== "object")
                                            throw TypeError(".org.eclipse.tahu.protobuf.Payload.DataSet.Row.elements: object expected");
                                        message.elements[i] = $root.org.eclipse.tahu.protobuf.Payload.DataSet.DataSetValue.fromObject(object.elements[i]);
                                    }
                                }
                                return message;
                            };

                            /**
                             * Creates a plain object from a Row message. Also converts values to other types if specified.
                             * @function toObject
                             * @memberof org.eclipse.tahu.protobuf.Payload.DataSet.Row
                             * @static
                             * @param {org.eclipse.tahu.protobuf.Payload.DataSet.Row} message Row
                             * @param {$protobuf.IConversionOptions} [options] Conversion options
                             * @returns {Object.<string,*>} Plain object
                             */
                            Row.toObject = function toObject(message, options) {
                                if (!options)
                                    options = {};
                                let object = {};
                                if (options.arrays || options.defaults)
                                    object.elements = [];
                                if (message.elements && message.elements.length) {
                                    object.elements = [];
                                    for (let j = 0; j < message.elements.length; ++j)
                                        object.elements[j] = $root.org.eclipse.tahu.protobuf.Payload.DataSet.DataSetValue.toObject(message.elements[j], options);
                                }
                                return object;
                            };

                            /**
                             * Converts this Row to JSON.
                             * @function toJSON
                             * @memberof org.eclipse.tahu.protobuf.Payload.DataSet.Row
                             * @instance
                             * @returns {Object.<string,*>} JSON object
                             */
                            Row.prototype.toJSON = function toJSON() {
                                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                            };

                            /**
                             * Gets the default type url for Row
                             * @function getTypeUrl
                             * @memberof org.eclipse.tahu.protobuf.Payload.DataSet.Row
                             * @static
                             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                             * @returns {string} The default type url
                             */
                            Row.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                                if (typeUrlPrefix === undefined) {
                                    typeUrlPrefix = "type.googleapis.com";
                                }
                                return typeUrlPrefix + "/org.eclipse.tahu.protobuf.Payload.DataSet.Row";
                            };

                            return Row;
                        })();

                        DataSet.DataSetValue = (function() {

                            /**
                             * Properties of a DataSetValue.
                             * @memberof org.eclipse.tahu.protobuf.Payload.DataSet
                             * @interface IDataSetValue
                             * @property {number|null} [intValue] DataSetValue intValue
                             * @property {number|Long|null} [longValue] DataSetValue longValue
                             * @property {number|null} [floatValue] DataSetValue floatValue
                             * @property {number|null} [doubleValue] DataSetValue doubleValue
                             * @property {boolean|null} [booleanValue] DataSetValue booleanValue
                             * @property {string|null} [stringValue] DataSetValue stringValue
                             * @property {org.eclipse.tahu.protobuf.Payload.DataSet.IDataSetValue|null} [extensionValue] DataSetValue extensionValue
                             */

                            /**
                             * Constructs a new DataSetValue.
                             * @memberof org.eclipse.tahu.protobuf.Payload.DataSet
                             * @classdesc Represents a DataSetValue.
                             * @implements IDataSetValue
                             * @constructor
                             * @param {org.eclipse.tahu.protobuf.Payload.DataSet.IDataSetValue=} [properties] Properties to set
                             */
                            function DataSetValue(properties) {
                                if (properties)
                                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                        if (properties[keys[i]] != null)
                                            this[keys[i]] = properties[keys[i]];
                            }

                            /**
                             * DataSetValue intValue.
                             * @member {number|null|undefined} intValue
                             * @memberof org.eclipse.tahu.protobuf.Payload.DataSet.DataSetValue
                             * @instance
                             */
                            DataSetValue.prototype.intValue = null;

                            /**
                             * DataSetValue longValue.
                             * @member {number|Long|null|undefined} longValue
                             * @memberof org.eclipse.tahu.protobuf.Payload.DataSet.DataSetValue
                             * @instance
                             */
                            DataSetValue.prototype.longValue = null;

                            /**
                             * DataSetValue floatValue.
                             * @member {number|null|undefined} floatValue
                             * @memberof org.eclipse.tahu.protobuf.Payload.DataSet.DataSetValue
                             * @instance
                             */
                            DataSetValue.prototype.floatValue = null;

                            /**
                             * DataSetValue doubleValue.
                             * @member {number|null|undefined} doubleValue
                             * @memberof org.eclipse.tahu.protobuf.Payload.DataSet.DataSetValue
                             * @instance
                             */
                            DataSetValue.prototype.doubleValue = null;

                            /**
                             * DataSetValue booleanValue.
                             * @member {boolean|null|undefined} booleanValue
                             * @memberof org.eclipse.tahu.protobuf.Payload.DataSet.DataSetValue
                             * @instance
                             */
                            DataSetValue.prototype.booleanValue = null;

                            /**
                             * DataSetValue stringValue.
                             * @member {string|null|undefined} stringValue
                             * @memberof org.eclipse.tahu.protobuf.Payload.DataSet.DataSetValue
                             * @instance
                             */
                            DataSetValue.prototype.stringValue = null;

                            /**
                             * DataSetValue extensionValue.
                             * @member {org.eclipse.tahu.protobuf.Payload.DataSet.IDataSetValue|null|undefined} extensionValue
                             * @memberof org.eclipse.tahu.protobuf.Payload.DataSet.DataSetValue
                             * @instance
                             */
                            DataSetValue.prototype.extensionValue = null;

                            // OneOf field names bound to virtual getters and setters
                            let $oneOfFields;

                            /**
                             * DataSetValue value.
                             * @member {"intValue"|"longValue"|"floatValue"|"doubleValue"|"booleanValue"|"stringValue"|"extensionValue"|undefined} value
                             * @memberof org.eclipse.tahu.protobuf.Payload.DataSet.DataSetValue
                             * @instance
                             */
                            Object.defineProperty(DataSetValue.prototype, "value", {
                                get: $util.oneOfGetter($oneOfFields = ["intValue", "longValue", "floatValue", "doubleValue", "booleanValue", "stringValue", "extensionValue"]),
                                set: $util.oneOfSetter($oneOfFields)
                            });

                            /**
                             * Creates a new DataSetValue instance using the specified properties.
                             * @function create
                             * @memberof org.eclipse.tahu.protobuf.Payload.DataSet.DataSetValue
                             * @static
                             * @param {org.eclipse.tahu.protobuf.Payload.DataSet.IDataSetValue=} [properties] Properties to set
                             * @returns {org.eclipse.tahu.protobuf.Payload.DataSet.DataSetValue} DataSetValue instance
                             */
                            DataSetValue.create = function create(properties) {
                                return new DataSetValue(properties);
                            };

                            /**
                             * Encodes the specified DataSetValue message. Does not implicitly {@link org.eclipse.tahu.protobuf.Payload.DataSet.DataSetValue.verify|verify} messages.
                             * @function encode
                             * @memberof org.eclipse.tahu.protobuf.Payload.DataSet.DataSetValue
                             * @static
                             * @param {org.eclipse.tahu.protobuf.Payload.DataSet.IDataSetValue} message DataSetValue message or plain object to encode
                             * @param {$protobuf.Writer} [writer] Writer to encode to
                             * @returns {$protobuf.Writer} Writer
                             */
                            DataSetValue.encode = function encode(message, writer) {
                                if (!writer)
                                    writer = $Writer.create();
                                if (message.intValue != null && Object.hasOwnProperty.call(message, "intValue"))
                                    writer.uint32(/* id 1, wireType 0 =*/8).uint32(message.intValue);
                                if (message.longValue != null && Object.hasOwnProperty.call(message, "longValue"))
                                    writer.uint32(/* id 2, wireType 0 =*/16).uint64(message.longValue);
                                if (message.floatValue != null && Object.hasOwnProperty.call(message, "floatValue"))
                                    writer.uint32(/* id 3, wireType 5 =*/29).float(message.floatValue);
                                if (message.doubleValue != null && Object.hasOwnProperty.call(message, "doubleValue"))
                                    writer.uint32(/* id 4, wireType 1 =*/33).double(message.doubleValue);
                                if (message.booleanValue != null && Object.hasOwnProperty.call(message, "booleanValue"))
                                    writer.uint32(/* id 5, wireType 0 =*/40).bool(message.booleanValue);
                                if (message.stringValue != null && Object.hasOwnProperty.call(message, "stringValue"))
                                    writer.uint32(/* id 6, wireType 2 =*/50).string(message.stringValue);
                                if (message.extensionValue != null && Object.hasOwnProperty.call(message, "extensionValue"))
                                    $root.org.eclipse.tahu.protobuf.Payload.DataSet.DataSetValue.encode(message.extensionValue, writer.uint32(/* id 7, wireType 2 =*/58).fork()).ldelim();
                                return writer;
                            };

                            /**
                             * Encodes the specified DataSetValue message, length delimited. Does not implicitly {@link org.eclipse.tahu.protobuf.Payload.DataSet.DataSetValue.verify|verify} messages.
                             * @function encodeDelimited
                             * @memberof org.eclipse.tahu.protobuf.Payload.DataSet.DataSetValue
                             * @static
                             * @param {org.eclipse.tahu.protobuf.Payload.DataSet.IDataSetValue} message DataSetValue message or plain object to encode
                             * @param {$protobuf.Writer} [writer] Writer to encode to
                             * @returns {$protobuf.Writer} Writer
                             */
                            DataSetValue.encodeDelimited = function encodeDelimited(message, writer) {
                                return this.encode(message, writer).ldelim();
                            };

                            /**
                             * Decodes a DataSetValue message from the specified reader or buffer.
                             * @function decode
                             * @memberof org.eclipse.tahu.protobuf.Payload.DataSet.DataSetValue
                             * @static
                             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                             * @param {number} [length] Message length if known beforehand
                             * @returns {org.eclipse.tahu.protobuf.Payload.DataSet.DataSetValue} DataSetValue
                             * @throws {Error} If the payload is not a reader or valid buffer
                             * @throws {$protobuf.util.ProtocolError} If required fields are missing
                             */
                            DataSetValue.decode = function decode(reader, length, error) {
                                if (!(reader instanceof $Reader))
                                    reader = $Reader.create(reader);
                                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.org.eclipse.tahu.protobuf.Payload.DataSet.DataSetValue();
                                while (reader.pos < end) {
                                    let tag = reader.uint32();
                                    if (tag === error)
                                        break;
                                    switch (tag >>> 3) {
                                    case 1: {
                                            message.intValue = reader.uint32();
                                            break;
                                        }
                                    case 2: {
                                            message.longValue = reader.uint64();
                                            break;
                                        }
                                    case 3: {
                                            message.floatValue = reader.float();
                                            break;
                                        }
                                    case 4: {
                                            message.doubleValue = reader.double();
                                            break;
                                        }
                                    case 5: {
                                            message.booleanValue = reader.bool();
                                            break;
                                        }
                                    case 6: {
                                            message.stringValue = reader.string();
                                            break;
                                        }
                                    case 7: {
                                            message.extensionValue = $root.org.eclipse.tahu.protobuf.Payload.DataSet.DataSetValue.decode(reader, reader.uint32());
                                            break;
                                        }
                                    default:
                                        reader.skipType(tag & 7);
                                        break;
                                    }
                                }
                                return message;
                            };

                            /**
                             * Decodes a DataSetValue message from the specified reader or buffer, length delimited.
                             * @function decodeDelimited
                             * @memberof org.eclipse.tahu.protobuf.Payload.DataSet.DataSetValue
                             * @static
                             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                             * @returns {org.eclipse.tahu.protobuf.Payload.DataSet.DataSetValue} DataSetValue
                             * @throws {Error} If the payload is not a reader or valid buffer
                             * @throws {$protobuf.util.ProtocolError} If required fields are missing
                             */
                            DataSetValue.decodeDelimited = function decodeDelimited(reader) {
                                if (!(reader instanceof $Reader))
                                    reader = new $Reader(reader);
                                return this.decode(reader, reader.uint32());
                            };

                            /**
                             * Creates a DataSetValue message from a plain object. Also converts values to their respective internal types.
                             * @function fromObject
                             * @memberof org.eclipse.tahu.protobuf.Payload.DataSet.DataSetValue
                             * @static
                             * @param {Object.<string,*>} object Plain object
                             * @returns {org.eclipse.tahu.protobuf.Payload.DataSet.DataSetValue} DataSetValue
                             */
                            DataSetValue.fromObject = function fromObject(object) {
                                if (object instanceof $root.org.eclipse.tahu.protobuf.Payload.DataSet.DataSetValue)
                                    return object;
                                let message = new $root.org.eclipse.tahu.protobuf.Payload.DataSet.DataSetValue();
                                if (object.intValue != null)
                                    message.intValue = object.intValue >>> 0;
                                if (object.longValue != null)
                                    if ($util.Long)
                                        (message.longValue = $util.Long.fromValue(object.longValue)).unsigned = true;
                                    else if (typeof object.longValue === "string")
                                        message.longValue = parseInt(object.longValue, 10);
                                    else if (typeof object.longValue === "number")
                                        message.longValue = object.longValue;
                                    else if (typeof object.longValue === "object")
                                        message.longValue = new $util.LongBits(object.longValue.low >>> 0, object.longValue.high >>> 0).toNumber(true);
                                if (object.floatValue != null)
                                    message.floatValue = Number(object.floatValue);
                                if (object.doubleValue != null)
                                    message.doubleValue = Number(object.doubleValue);
                                if (object.booleanValue != null)
                                    message.booleanValue = Boolean(object.booleanValue);
                                if (object.stringValue != null)
                                    message.stringValue = String(object.stringValue);
                                if (object.extensionValue != null) {
                                    if (typeof object.extensionValue !== "object")
                                        throw TypeError(".org.eclipse.tahu.protobuf.Payload.DataSet.DataSetValue.extensionValue: object expected");
                                    message.extensionValue = $root.org.eclipse.tahu.protobuf.Payload.DataSet.DataSetValue.fromObject(object.extensionValue);
                                }
                                return message;
                            };

                            /**
                             * Creates a plain object from a DataSetValue message. Also converts values to other types if specified.
                             * @function toObject
                             * @memberof org.eclipse.tahu.protobuf.Payload.DataSet.DataSetValue
                             * @static
                             * @param {org.eclipse.tahu.protobuf.Payload.DataSet.DataSetValue} message DataSetValue
                             * @param {$protobuf.IConversionOptions} [options] Conversion options
                             * @returns {Object.<string,*>} Plain object
                             */
                            DataSetValue.toObject = function toObject(message, options) {
                                if (!options)
                                    options = {};
                                let object = {};
                                if (message.intValue != null && message.hasOwnProperty("intValue")) {
                                    object.intValue = message.intValue;
                                    if (options.oneofs)
                                        object.value = "intValue";
                                }
                                if (message.longValue != null && message.hasOwnProperty("longValue")) {
                                    if (typeof message.longValue === "number")
                                        object.longValue = options.longs === String ? String(message.longValue) : message.longValue;
                                    else
                                        object.longValue = options.longs === String ? $util.Long.prototype.toString.call(message.longValue) : options.longs === Number ? new $util.LongBits(message.longValue.low >>> 0, message.longValue.high >>> 0).toNumber(true) : message.longValue;
                                    if (options.oneofs)
                                        object.value = "longValue";
                                }
                                if (message.floatValue != null && message.hasOwnProperty("floatValue")) {
                                    object.floatValue = options.json && !isFinite(message.floatValue) ? String(message.floatValue) : message.floatValue;
                                    if (options.oneofs)
                                        object.value = "floatValue";
                                }
                                if (message.doubleValue != null && message.hasOwnProperty("doubleValue")) {
                                    object.doubleValue = options.json && !isFinite(message.doubleValue) ? String(message.doubleValue) : message.doubleValue;
                                    if (options.oneofs)
                                        object.value = "doubleValue";
                                }
                                if (message.booleanValue != null && message.hasOwnProperty("booleanValue")) {
                                    object.booleanValue = message.booleanValue;
                                    if (options.oneofs)
                                        object.value = "booleanValue";
                                }
                                if (message.stringValue != null && message.hasOwnProperty("stringValue")) {
                                    object.stringValue = message.stringValue;
                                    if (options.oneofs)
                                        object.value = "stringValue";
                                }
                                if (message.extensionValue != null && message.hasOwnProperty("extensionValue")) {
                                    object.extensionValue = $root.org.eclipse.tahu.protobuf.Payload.DataSet.DataSetValue.toObject(message.extensionValue, options);
                                    if (options.oneofs)
                                        object.value = "extensionValue";
                                }
                                return object;
                            };

                            /**
                             * Converts this DataSetValue to JSON.
                             * @function toJSON
                             * @memberof org.eclipse.tahu.protobuf.Payload.DataSet.DataSetValue
                             * @instance
                             * @returns {Object.<string,*>} JSON object
                             */
                            DataSetValue.prototype.toJSON = function toJSON() {
                                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                            };

                            /**
                             * Gets the default type url for DataSetValue
                             * @function getTypeUrl
                             * @memberof org.eclipse.tahu.protobuf.Payload.DataSet.DataSetValue
                             * @static
                             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                             * @returns {string} The default type url
                             */
                            DataSetValue.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                                if (typeUrlPrefix === undefined) {
                                    typeUrlPrefix = "type.googleapis.com";
                                }
                                return typeUrlPrefix + "/org.eclipse.tahu.protobuf.Payload.DataSet.DataSetValue";
                            };

                            return DataSetValue;
                        })();

                        return DataSet;
                    })();

                    Payload.PropertyValue = (function() {

                        /**
                         * Properties of a PropertyValue.
                         * @memberof org.eclipse.tahu.protobuf.Payload
                         * @interface IPropertyValue
                         * @property {number|null} [type] PropertyValue type
                         * @property {boolean|null} [isNull] PropertyValue isNull
                         * @property {number|null} [intValue] PropertyValue intValue
                         * @property {number|Long|null} [longValue] PropertyValue longValue
                         * @property {number|null} [floatValue] PropertyValue floatValue
                         * @property {number|null} [doubleValue] PropertyValue doubleValue
                         * @property {boolean|null} [booleanValue] PropertyValue booleanValue
                         * @property {string|null} [stringValue] PropertyValue stringValue
                         * @property {org.eclipse.tahu.protobuf.Payload.IPropertySet|null} [propertysetValue] PropertyValue propertysetValue
                         * @property {org.eclipse.tahu.protobuf.Payload.IPropertySetList|null} [propertysetsValue] PropertyValue propertysetsValue
                         * @property {Uint8Array|null} [extensionValue] PropertyValue extensionValue
                         */

                        /**
                         * Constructs a new PropertyValue.
                         * @memberof org.eclipse.tahu.protobuf.Payload
                         * @classdesc Represents a PropertyValue.
                         * @implements IPropertyValue
                         * @constructor
                         * @param {org.eclipse.tahu.protobuf.Payload.IPropertyValue=} [properties] Properties to set
                         */
                        function PropertyValue(properties) {
                            if (properties)
                                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                    if (properties[keys[i]] != null)
                                        this[keys[i]] = properties[keys[i]];
                        }

                        /**
                         * PropertyValue type.
                         * @member {number} type
                         * @memberof org.eclipse.tahu.protobuf.Payload.PropertyValue
                         * @instance
                         */
                        PropertyValue.prototype.type = 0;

                        /**
                         * PropertyValue isNull.
                         * @member {boolean} isNull
                         * @memberof org.eclipse.tahu.protobuf.Payload.PropertyValue
                         * @instance
                         */
                        PropertyValue.prototype.isNull = false;

                        /**
                         * PropertyValue intValue.
                         * @member {number|null|undefined} intValue
                         * @memberof org.eclipse.tahu.protobuf.Payload.PropertyValue
                         * @instance
                         */
                        PropertyValue.prototype.intValue = null;

                        /**
                         * PropertyValue longValue.
                         * @member {number|Long|null|undefined} longValue
                         * @memberof org.eclipse.tahu.protobuf.Payload.PropertyValue
                         * @instance
                         */
                        PropertyValue.prototype.longValue = null;

                        /**
                         * PropertyValue floatValue.
                         * @member {number|null|undefined} floatValue
                         * @memberof org.eclipse.tahu.protobuf.Payload.PropertyValue
                         * @instance
                         */
                        PropertyValue.prototype.floatValue = null;

                        /**
                         * PropertyValue doubleValue.
                         * @member {number|null|undefined} doubleValue
                         * @memberof org.eclipse.tahu.protobuf.Payload.PropertyValue
                         * @instance
                         */
                        PropertyValue.prototype.doubleValue = null;

                        /**
                         * PropertyValue booleanValue.
                         * @member {boolean|null|undefined} booleanValue
                         * @memberof org.eclipse.tahu.protobuf.Payload.PropertyValue
                         * @instance
                         */
                        PropertyValue.prototype.booleanValue = null;

                        /**
                         * PropertyValue stringValue.
                         * @member {string|null|undefined} stringValue
                         * @memberof org.eclipse.tahu.protobuf.Payload.PropertyValue
                         * @instance
                         */
                        PropertyValue.prototype.stringValue = null;

                        /**
                         * PropertyValue propertysetValue.
                         * @member {org.eclipse.tahu.protobuf.Payload.IPropertySet|null|undefined} propertysetValue
                         * @memberof org.eclipse.tahu.protobuf.Payload.PropertyValue
                         * @instance
                         */
                        PropertyValue.prototype.propertysetValue = null;

                        /**
                         * PropertyValue propertysetsValue.
                         * @member {org.eclipse.tahu.protobuf.Payload.IPropertySetList|null|undefined} propertysetsValue
                         * @memberof org.eclipse.tahu.protobuf.Payload.PropertyValue
                         * @instance
                         */
                        PropertyValue.prototype.propertysetsValue = null;

                        /**
                         * PropertyValue extensionValue.
                         * @member {Uint8Array|null|undefined} extensionValue
                         * @memberof org.eclipse.tahu.protobuf.Payload.PropertyValue
                         * @instance
                         */
                        PropertyValue.prototype.extensionValue = null;

                        // OneOf field names bound to virtual getters and setters
                        let $oneOfFields;

                        /**
                         * PropertyValue value.
                         * @member {"intValue"|"longValue"|"floatValue"|"doubleValue"|"booleanValue"|"stringValue"|"propertysetValue"|"propertysetsValue"|"extensionValue"|undefined} value
                         * @memberof org.eclipse.tahu.protobuf.Payload.PropertyValue
                         * @instance
                         */
                        Object.defineProperty(PropertyValue.prototype, "value", {
                            get: $util.oneOfGetter($oneOfFields = ["intValue", "longValue", "floatValue", "doubleValue", "booleanValue", "stringValue", "propertysetValue", "propertysetsValue", "extensionValue"]),
                            set: $util.oneOfSetter($oneOfFields)
                        });

                        /**
                         * Creates a new PropertyValue instance using the specified properties.
                         * @function create
                         * @memberof org.eclipse.tahu.protobuf.Payload.PropertyValue
                         * @static
                         * @param {org.eclipse.tahu.protobuf.Payload.IPropertyValue=} [properties] Properties to set
                         * @returns {org.eclipse.tahu.protobuf.Payload.PropertyValue} PropertyValue instance
                         */
                        PropertyValue.create = function create(properties) {
                            return new PropertyValue(properties);
                        };

                        /**
                         * Encodes the specified PropertyValue message. Does not implicitly {@link org.eclipse.tahu.protobuf.Payload.PropertyValue.verify|verify} messages.
                         * @function encode
                         * @memberof org.eclipse.tahu.protobuf.Payload.PropertyValue
                         * @static
                         * @param {org.eclipse.tahu.protobuf.Payload.IPropertyValue} message PropertyValue message or plain object to encode
                         * @param {$protobuf.Writer} [writer] Writer to encode to
                         * @returns {$protobuf.Writer} Writer
                         */
                        PropertyValue.encode = function encode(message, writer) {
                            if (!writer)
                                writer = $Writer.create();
                            if (message.type != null && Object.hasOwnProperty.call(message, "type"))
                                writer.uint32(/* id 1, wireType 0 =*/8).uint32(message.type);
                            if (message.isNull != null && Object.hasOwnProperty.call(message, "isNull"))
                                writer.uint32(/* id 2, wireType 0 =*/16).bool(message.isNull);
                            if (message.intValue != null && Object.hasOwnProperty.call(message, "intValue"))
                                writer.uint32(/* id 3, wireType 0 =*/24).uint32(message.intValue);
                            if (message.longValue != null && Object.hasOwnProperty.call(message, "longValue"))
                                writer.uint32(/* id 4, wireType 0 =*/32).uint64(message.longValue);
                            if (message.floatValue != null && Object.hasOwnProperty.call(message, "floatValue"))
                                writer.uint32(/* id 5, wireType 5 =*/45).float(message.floatValue);
                            if (message.doubleValue != null && Object.hasOwnProperty.call(message, "doubleValue"))
                                writer.uint32(/* id 6, wireType 1 =*/49).double(message.doubleValue);
                            if (message.booleanValue != null && Object.hasOwnProperty.call(message, "booleanValue"))
                                writer.uint32(/* id 7, wireType 0 =*/56).bool(message.booleanValue);
                            if (message.stringValue != null && Object.hasOwnProperty.call(message, "stringValue"))
                                writer.uint32(/* id 8, wireType 2 =*/66).string(message.stringValue);
                            if (message.propertysetValue != null && Object.hasOwnProperty.call(message, "propertysetValue"))
                                $root.org.eclipse.tahu.protobuf.Payload.PropertySet.encode(message.propertysetValue, writer.uint32(/* id 9, wireType 2 =*/74).fork()).ldelim();
                            if (message.propertysetsValue != null && Object.hasOwnProperty.call(message, "propertysetsValue"))
                                $root.org.eclipse.tahu.protobuf.Payload.PropertySetList.encode(message.propertysetsValue, writer.uint32(/* id 10, wireType 2 =*/82).fork()).ldelim();
                            if (message.extensionValue != null && Object.hasOwnProperty.call(message, "extensionValue"))
                                writer.uint32(/* id 11, wireType 2 =*/90).bytes(message.extensionValue);
                            return writer;
                        };

                        /**
                         * Encodes the specified PropertyValue message, length delimited. Does not implicitly {@link org.eclipse.tahu.protobuf.Payload.PropertyValue.verify|verify} messages.
                         * @function encodeDelimited
                         * @memberof org.eclipse.tahu.protobuf.Payload.PropertyValue
                         * @static
                         * @param {org.eclipse.tahu.protobuf.Payload.IPropertyValue} message PropertyValue message or plain object to encode
                         * @param {$protobuf.Writer} [writer] Writer to encode to
                         * @returns {$protobuf.Writer} Writer
                         */
                        PropertyValue.encodeDelimited = function encodeDelimited(message, writer) {
                            return this.encode(message, writer).ldelim();
                        };

                        /**
                         * Decodes a PropertyValue message from the specified reader or buffer.
                         * @function decode
                         * @memberof org.eclipse.tahu.protobuf.Payload.PropertyValue
                         * @static
                         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                         * @param {number} [length] Message length if known beforehand
                         * @returns {org.eclipse.tahu.protobuf.Payload.PropertyValue} PropertyValue
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        PropertyValue.decode = function decode(reader, length, error) {
                            if (!(reader instanceof $Reader))
                                reader = $Reader.create(reader);
                            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.org.eclipse.tahu.protobuf.Payload.PropertyValue();
                            while (reader.pos < end) {
                                let tag = reader.uint32();
                                if (tag === error)
                                    break;
                                switch (tag >>> 3) {
                                case 1: {
                                        message.type = reader.uint32();
                                        break;
                                    }
                                case 2: {
                                        message.isNull = reader.bool();
                                        break;
                                    }
                                case 3: {
                                        message.intValue = reader.uint32();
                                        break;
                                    }
                                case 4: {
                                        message.longValue = reader.uint64();
                                        break;
                                    }
                                case 5: {
                                        message.floatValue = reader.float();
                                        break;
                                    }
                                case 6: {
                                        message.doubleValue = reader.double();
                                        break;
                                    }
                                case 7: {
                                        message.booleanValue = reader.bool();
                                        break;
                                    }
                                case 8: {
                                        message.stringValue = reader.string();
                                        break;
                                    }
                                case 9: {
                                        message.propertysetValue = $root.org.eclipse.tahu.protobuf.Payload.PropertySet.decode(reader, reader.uint32());
                                        break;
                                    }
                                case 10: {
                                        message.propertysetsValue = $root.org.eclipse.tahu.protobuf.Payload.PropertySetList.decode(reader, reader.uint32());
                                        break;
                                    }
                                case 11: {
                                        message.extensionValue = reader.bytes();
                                        break;
                                    }
                                default:
                                    reader.skipType(tag & 7);
                                    break;
                                }
                            }
                            return message;
                        };

                        /**
                         * Decodes a PropertyValue message from the specified reader or buffer, length delimited.
                         * @function decodeDelimited
                         * @memberof org.eclipse.tahu.protobuf.Payload.PropertyValue
                         * @static
                         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                         * @returns {org.eclipse.tahu.protobuf.Payload.PropertyValue} PropertyValue
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        PropertyValue.decodeDelimited = function decodeDelimited(reader) {
                            if (!(reader instanceof $Reader))
                                reader = new $Reader(reader);
                            return this.decode(reader, reader.uint32());
                        };

                        /**
                         * Creates a PropertyValue message from a plain object. Also converts values to their respective internal types.
                         * @function fromObject
                         * @memberof org.eclipse.tahu.protobuf.Payload.PropertyValue
                         * @static
                         * @param {Object.<string,*>} object Plain object
                         * @returns {org.eclipse.tahu.protobuf.Payload.PropertyValue} PropertyValue
                         */
                        PropertyValue.fromObject = function fromObject(object) {
                            if (object instanceof $root.org.eclipse.tahu.protobuf.Payload.PropertyValue)
                                return object;
                            let message = new $root.org.eclipse.tahu.protobuf.Payload.PropertyValue();
                            if (object.type != null)
                                message.type = object.type >>> 0;
                            if (object.isNull != null)
                                message.isNull = Boolean(object.isNull);
                            if (object.intValue != null)
                                message.intValue = object.intValue >>> 0;
                            if (object.longValue != null)
                                if ($util.Long)
                                    (message.longValue = $util.Long.fromValue(object.longValue)).unsigned = true;
                                else if (typeof object.longValue === "string")
                                    message.longValue = parseInt(object.longValue, 10);
                                else if (typeof object.longValue === "number")
                                    message.longValue = object.longValue;
                                else if (typeof object.longValue === "object")
                                    message.longValue = new $util.LongBits(object.longValue.low >>> 0, object.longValue.high >>> 0).toNumber(true);
                            if (object.floatValue != null)
                                message.floatValue = Number(object.floatValue);
                            if (object.doubleValue != null)
                                message.doubleValue = Number(object.doubleValue);
                            if (object.booleanValue != null)
                                message.booleanValue = Boolean(object.booleanValue);
                            if (object.stringValue != null)
                                message.stringValue = String(object.stringValue);
                            if (object.propertysetValue != null) {
                                if (typeof object.propertysetValue !== "object")
                                    throw TypeError(".org.eclipse.tahu.protobuf.Payload.PropertyValue.propertysetValue: object expected");
                                message.propertysetValue = $root.org.eclipse.tahu.protobuf.Payload.PropertySet.fromObject(object.propertysetValue);
                            }
                            if (object.propertysetsValue != null) {
                                if (typeof object.propertysetsValue !== "object")
                                    throw TypeError(".org.eclipse.tahu.protobuf.Payload.PropertyValue.propertysetsValue: object expected");
                                message.propertysetsValue = $root.org.eclipse.tahu.protobuf.Payload.PropertySetList.fromObject(object.propertysetsValue);
                            }
                            if (object.extensionValue != null)
                                if (typeof object.extensionValue === "string")
                                    $util.base64.decode(object.extensionValue, message.extensionValue = $util.newBuffer($util.base64.length(object.extensionValue)), 0);
                                else if (object.extensionValue.length >= 0)
                                    message.extensionValue = object.extensionValue;
                            return message;
                        };

                        /**
                         * Creates a plain object from a PropertyValue message. Also converts values to other types if specified.
                         * @function toObject
                         * @memberof org.eclipse.tahu.protobuf.Payload.PropertyValue
                         * @static
                         * @param {org.eclipse.tahu.protobuf.Payload.PropertyValue} message PropertyValue
                         * @param {$protobuf.IConversionOptions} [options] Conversion options
                         * @returns {Object.<string,*>} Plain object
                         */
                        PropertyValue.toObject = function toObject(message, options) {
                            if (!options)
                                options = {};
                            let object = {};
                            if (options.defaults) {
                                object.type = 0;
                                object.isNull = false;
                            }
                            if (message.type != null && message.hasOwnProperty("type"))
                                object.type = message.type;
                            if (message.isNull != null && message.hasOwnProperty("isNull"))
                                object.isNull = message.isNull;
                            if (message.intValue != null && message.hasOwnProperty("intValue")) {
                                object.intValue = message.intValue;
                                if (options.oneofs)
                                    object.value = "intValue";
                            }
                            if (message.longValue != null && message.hasOwnProperty("longValue")) {
                                if (typeof message.longValue === "number")
                                    object.longValue = options.longs === String ? String(message.longValue) : message.longValue;
                                else
                                    object.longValue = options.longs === String ? $util.Long.prototype.toString.call(message.longValue) : options.longs === Number ? new $util.LongBits(message.longValue.low >>> 0, message.longValue.high >>> 0).toNumber(true) : message.longValue;
                                if (options.oneofs)
                                    object.value = "longValue";
                            }
                            if (message.floatValue != null && message.hasOwnProperty("floatValue")) {
                                object.floatValue = options.json && !isFinite(message.floatValue) ? String(message.floatValue) : message.floatValue;
                                if (options.oneofs)
                                    object.value = "floatValue";
                            }
                            if (message.doubleValue != null && message.hasOwnProperty("doubleValue")) {
                                object.doubleValue = options.json && !isFinite(message.doubleValue) ? String(message.doubleValue) : message.doubleValue;
                                if (options.oneofs)
                                    object.value = "doubleValue";
                            }
                            if (message.booleanValue != null && message.hasOwnProperty("booleanValue")) {
                                object.booleanValue = message.booleanValue;
                                if (options.oneofs)
                                    object.value = "booleanValue";
                            }
                            if (message.stringValue != null && message.hasOwnProperty("stringValue")) {
                                object.stringValue = message.stringValue;
                                if (options.oneofs)
                                    object.value = "stringValue";
                            }
                            if (message.propertysetValue != null && message.hasOwnProperty("propertysetValue")) {
                                object.propertysetValue = $root.org.eclipse.tahu.protobuf.Payload.PropertySet.toObject(message.propertysetValue, options);
                                if (options.oneofs)
                                    object.value = "propertysetValue";
                            }
                            if (message.propertysetsValue != null && message.hasOwnProperty("propertysetsValue")) {
                                object.propertysetsValue = $root.org.eclipse.tahu.protobuf.Payload.PropertySetList.toObject(message.propertysetsValue, options);
                                if (options.oneofs)
                                    object.value = "propertysetsValue";
                            }
                            if (message.extensionValue != null && message.hasOwnProperty("extensionValue")) {
                                object.extensionValue = options.bytes === String ? $util.base64.encode(message.extensionValue, 0, message.extensionValue.length) : options.bytes === Array ? Array.prototype.slice.call(message.extensionValue) : message.extensionValue;
                                if (options.oneofs)
                                    object.value = "extensionValue";
                            }
                            return object;
                        };

                        /**
                         * Converts this PropertyValue to JSON.
                         * @function toJSON
                         * @memberof org.eclipse.tahu.protobuf.Payload.PropertyValue
                         * @instance
                         * @returns {Object.<string,*>} JSON object
                         */
                        PropertyValue.prototype.toJSON = function toJSON() {
                            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                        };

                        /**
                         * Gets the default type url for PropertyValue
                         * @function getTypeUrl
                         * @memberof org.eclipse.tahu.protobuf.Payload.PropertyValue
                         * @static
                         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                         * @returns {string} The default type url
                         */
                        PropertyValue.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                            if (typeUrlPrefix === undefined) {
                                typeUrlPrefix = "type.googleapis.com";
                            }
                            return typeUrlPrefix + "/org.eclipse.tahu.protobuf.Payload.PropertyValue";
                        };

                        return PropertyValue;
                    })();

                    Payload.PropertySet = (function() {

                        /**
                         * Properties of a PropertySet.
                         * @memberof org.eclipse.tahu.protobuf.Payload
                         * @interface IPropertySet
                         * @property {Array.<string>|null} [keys] PropertySet keys
                         * @property {Array.<org.eclipse.tahu.protobuf.Payload.IPropertyValue>|null} [values] PropertySet values
                         */

                        /**
                         * Constructs a new PropertySet.
                         * @memberof org.eclipse.tahu.protobuf.Payload
                         * @classdesc Represents a PropertySet.
                         * @implements IPropertySet
                         * @constructor
                         * @param {org.eclipse.tahu.protobuf.Payload.IPropertySet=} [properties] Properties to set
                         */
                        function PropertySet(properties) {
                            this.keys = [];
                            this.values = [];
                            if (properties)
                                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                    if (properties[keys[i]] != null)
                                        this[keys[i]] = properties[keys[i]];
                        }

                        /**
                         * PropertySet keys.
                         * @member {Array.<string>} keys
                         * @memberof org.eclipse.tahu.protobuf.Payload.PropertySet
                         * @instance
                         */
                        PropertySet.prototype.keys = $util.emptyArray;

                        /**
                         * PropertySet values.
                         * @member {Array.<org.eclipse.tahu.protobuf.Payload.IPropertyValue>} values
                         * @memberof org.eclipse.tahu.protobuf.Payload.PropertySet
                         * @instance
                         */
                        PropertySet.prototype.values = $util.emptyArray;

                        /**
                         * Creates a new PropertySet instance using the specified properties.
                         * @function create
                         * @memberof org.eclipse.tahu.protobuf.Payload.PropertySet
                         * @static
                         * @param {org.eclipse.tahu.protobuf.Payload.IPropertySet=} [properties] Properties to set
                         * @returns {org.eclipse.tahu.protobuf.Payload.PropertySet} PropertySet instance
                         */
                        PropertySet.create = function create(properties) {
                            return new PropertySet(properties);
                        };

                        /**
                         * Encodes the specified PropertySet message. Does not implicitly {@link org.eclipse.tahu.protobuf.Payload.PropertySet.verify|verify} messages.
                         * @function encode
                         * @memberof org.eclipse.tahu.protobuf.Payload.PropertySet
                         * @static
                         * @param {org.eclipse.tahu.protobuf.Payload.IPropertySet} message PropertySet message or plain object to encode
                         * @param {$protobuf.Writer} [writer] Writer to encode to
                         * @returns {$protobuf.Writer} Writer
                         */
                        PropertySet.encode = function encode(message, writer) {
                            if (!writer)
                                writer = $Writer.create();
                            if (message.keys != null && message.keys.length)
                                for (let i = 0; i < message.keys.length; ++i)
                                    writer.uint32(/* id 1, wireType 2 =*/10).string(message.keys[i]);
                            if (message.values != null && message.values.length)
                                for (let i = 0; i < message.values.length; ++i)
                                    $root.org.eclipse.tahu.protobuf.Payload.PropertyValue.encode(message.values[i], writer.uint32(/* id 2, wireType 2 =*/18).fork()).ldelim();
                            return writer;
                        };

                        /**
                         * Encodes the specified PropertySet message, length delimited. Does not implicitly {@link org.eclipse.tahu.protobuf.Payload.PropertySet.verify|verify} messages.
                         * @function encodeDelimited
                         * @memberof org.eclipse.tahu.protobuf.Payload.PropertySet
                         * @static
                         * @param {org.eclipse.tahu.protobuf.Payload.IPropertySet} message PropertySet message or plain object to encode
                         * @param {$protobuf.Writer} [writer] Writer to encode to
                         * @returns {$protobuf.Writer} Writer
                         */
                        PropertySet.encodeDelimited = function encodeDelimited(message, writer) {
                            return this.encode(message, writer).ldelim();
                        };

                        /**
                         * Decodes a PropertySet message from the specified reader or buffer.
                         * @function decode
                         * @memberof org.eclipse.tahu.protobuf.Payload.PropertySet
                         * @static
                         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                         * @param {number} [length] Message length if known beforehand
                         * @returns {org.eclipse.tahu.protobuf.Payload.PropertySet} PropertySet
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        PropertySet.decode = function decode(reader, length, error) {
                            if (!(reader instanceof $Reader))
                                reader = $Reader.create(reader);
                            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.org.eclipse.tahu.protobuf.Payload.PropertySet();
                            while (reader.pos < end) {
                                let tag = reader.uint32();
                                if (tag === error)
                                    break;
                                switch (tag >>> 3) {
                                case 1: {
                                        if (!(message.keys && message.keys.length))
                                            message.keys = [];
                                        message.keys.push(reader.string());
                                        break;
                                    }
                                case 2: {
                                        if (!(message.values && message.values.length))
                                            message.values = [];
                                        message.values.push($root.org.eclipse.tahu.protobuf.Payload.PropertyValue.decode(reader, reader.uint32()));
                                        break;
                                    }
                                default:
                                    reader.skipType(tag & 7);
                                    break;
                                }
                            }
                            return message;
                        };

                        /**
                         * Decodes a PropertySet message from the specified reader or buffer, length delimited.
                         * @function decodeDelimited
                         * @memberof org.eclipse.tahu.protobuf.Payload.PropertySet
                         * @static
                         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                         * @returns {org.eclipse.tahu.protobuf.Payload.PropertySet} PropertySet
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        PropertySet.decodeDelimited = function decodeDelimited(reader) {
                            if (!(reader instanceof $Reader))
                                reader = new $Reader(reader);
                            return this.decode(reader, reader.uint32());
                        };

                        /**
                         * Creates a PropertySet message from a plain object. Also converts values to their respective internal types.
                         * @function fromObject
                         * @memberof org.eclipse.tahu.protobuf.Payload.PropertySet
                         * @static
                         * @param {Object.<string,*>} object Plain object
                         * @returns {org.eclipse.tahu.protobuf.Payload.PropertySet} PropertySet
                         */
                        PropertySet.fromObject = function fromObject(object) {
                            if (object instanceof $root.org.eclipse.tahu.protobuf.Payload.PropertySet)
                                return object;
                            let message = new $root.org.eclipse.tahu.protobuf.Payload.PropertySet();
                            if (object.keys) {
                                if (!Array.isArray(object.keys))
                                    throw TypeError(".org.eclipse.tahu.protobuf.Payload.PropertySet.keys: array expected");
                                message.keys = [];
                                for (let i = 0; i < object.keys.length; ++i)
                                    message.keys[i] = String(object.keys[i]);
                            }
                            if (object.values) {
                                if (!Array.isArray(object.values))
                                    throw TypeError(".org.eclipse.tahu.protobuf.Payload.PropertySet.values: array expected");
                                message.values = [];
                                for (let i = 0; i < object.values.length; ++i) {
                                    if (typeof object.values[i] !== "object")
                                        throw TypeError(".org.eclipse.tahu.protobuf.Payload.PropertySet.values: object expected");
                                    message.values[i] = $root.org.eclipse.tahu.protobuf.Payload.PropertyValue.fromObject(object.values[i]);
                                }
                            }
                            return message;
                        };

                        /**
                         * Creates a plain object from a PropertySet message. Also converts values to other types if specified.
                         * @function toObject
                         * @memberof org.eclipse.tahu.protobuf.Payload.PropertySet
                         * @static
                         * @param {org.eclipse.tahu.protobuf.Payload.PropertySet} message PropertySet
                         * @param {$protobuf.IConversionOptions} [options] Conversion options
                         * @returns {Object.<string,*>} Plain object
                         */
                        PropertySet.toObject = function toObject(message, options) {
                            if (!options)
                                options = {};
                            let object = {};
                            if (options.arrays || options.defaults) {
                                object.keys = [];
                                object.values = [];
                            }
                            if (message.keys && message.keys.length) {
                                object.keys = [];
                                for (let j = 0; j < message.keys.length; ++j)
                                    object.keys[j] = message.keys[j];
                            }
                            if (message.values && message.values.length) {
                                object.values = [];
                                for (let j = 0; j < message.values.length; ++j)
                                    object.values[j] = $root.org.eclipse.tahu.protobuf.Payload.PropertyValue.toObject(message.values[j], options);
                            }
                            return object;
                        };

                        /**
                         * Converts this PropertySet to JSON.
                         * @function toJSON
                         * @memberof org.eclipse.tahu.protobuf.Payload.PropertySet
                         * @instance
                         * @returns {Object.<string,*>} JSON object
                         */
                        PropertySet.prototype.toJSON = function toJSON() {
                            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                        };

                        /**
                         * Gets the default type url for PropertySet
                         * @function getTypeUrl
                         * @memberof org.eclipse.tahu.protobuf.Payload.PropertySet
                         * @static
                         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                         * @returns {string} The default type url
                         */
                        PropertySet.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                            if (typeUrlPrefix === undefined) {
                                typeUrlPrefix = "type.googleapis.com";
                            }
                            return typeUrlPrefix + "/org.eclipse.tahu.protobuf.Payload.PropertySet";
                        };

                        return PropertySet;
                    })();

                    Payload.PropertySetList = (function() {

                        /**
                         * Properties of a PropertySetList.
                         * @memberof org.eclipse.tahu.protobuf.Payload
                         * @interface IPropertySetList
                         * @property {Array.<org.eclipse.tahu.protobuf.Payload.IPropertySet>|null} [propertyset] PropertySetList propertyset
                         */

                        /**
                         * Constructs a new PropertySetList.
                         * @memberof org.eclipse.tahu.protobuf.Payload
                         * @classdesc Represents a PropertySetList.
                         * @implements IPropertySetList
                         * @constructor
                         * @param {org.eclipse.tahu.protobuf.Payload.IPropertySetList=} [properties] Properties to set
                         */
                        function PropertySetList(properties) {
                            this.propertyset = [];
                            if (properties)
                                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                    if (properties[keys[i]] != null)
                                        this[keys[i]] = properties[keys[i]];
                        }

                        /**
                         * PropertySetList propertyset.
                         * @member {Array.<org.eclipse.tahu.protobuf.Payload.IPropertySet>} propertyset
                         * @memberof org.eclipse.tahu.protobuf.Payload.PropertySetList
                         * @instance
                         */
                        PropertySetList.prototype.propertyset = $util.emptyArray;

                        /**
                         * Creates a new PropertySetList instance using the specified properties.
                         * @function create
                         * @memberof org.eclipse.tahu.protobuf.Payload.PropertySetList
                         * @static
                         * @param {org.eclipse.tahu.protobuf.Payload.IPropertySetList=} [properties] Properties to set
                         * @returns {org.eclipse.tahu.protobuf.Payload.PropertySetList} PropertySetList instance
                         */
                        PropertySetList.create = function create(properties) {
                            return new PropertySetList(properties);
                        };

                        /**
                         * Encodes the specified PropertySetList message. Does not implicitly {@link org.eclipse.tahu.protobuf.Payload.PropertySetList.verify|verify} messages.
                         * @function encode
                         * @memberof org.eclipse.tahu.protobuf.Payload.PropertySetList
                         * @static
                         * @param {org.eclipse.tahu.protobuf.Payload.IPropertySetList} message PropertySetList message or plain object to encode
                         * @param {$protobuf.Writer} [writer] Writer to encode to
                         * @returns {$protobuf.Writer} Writer
                         */
                        PropertySetList.encode = function encode(message, writer) {
                            if (!writer)
                                writer = $Writer.create();
                            if (message.propertyset != null && message.propertyset.length)
                                for (let i = 0; i < message.propertyset.length; ++i)
                                    $root.org.eclipse.tahu.protobuf.Payload.PropertySet.encode(message.propertyset[i], writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
                            return writer;
                        };

                        /**
                         * Encodes the specified PropertySetList message, length delimited. Does not implicitly {@link org.eclipse.tahu.protobuf.Payload.PropertySetList.verify|verify} messages.
                         * @function encodeDelimited
                         * @memberof org.eclipse.tahu.protobuf.Payload.PropertySetList
                         * @static
                         * @param {org.eclipse.tahu.protobuf.Payload.IPropertySetList} message PropertySetList message or plain object to encode
                         * @param {$protobuf.Writer} [writer] Writer to encode to
                         * @returns {$protobuf.Writer} Writer
                         */
                        PropertySetList.encodeDelimited = function encodeDelimited(message, writer) {
                            return this.encode(message, writer).ldelim();
                        };

                        /**
                         * Decodes a PropertySetList message from the specified reader or buffer.
                         * @function decode
                         * @memberof org.eclipse.tahu.protobuf.Payload.PropertySetList
                         * @static
                         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                         * @param {number} [length] Message length if known beforehand
                         * @returns {org.eclipse.tahu.protobuf.Payload.PropertySetList} PropertySetList
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        PropertySetList.decode = function decode(reader, length, error) {
                            if (!(reader instanceof $Reader))
                                reader = $Reader.create(reader);
                            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.org.eclipse.tahu.protobuf.Payload.PropertySetList();
                            while (reader.pos < end) {
                                let tag = reader.uint32();
                                if (tag === error)
                                    break;
                                switch (tag >>> 3) {
                                case 1: {
                                        if (!(message.propertyset && message.propertyset.length))
                                            message.propertyset = [];
                                        message.propertyset.push($root.org.eclipse.tahu.protobuf.Payload.PropertySet.decode(reader, reader.uint32()));
                                        break;
                                    }
                                default:
                                    reader.skipType(tag & 7);
                                    break;
                                }
                            }
                            return message;
                        };

                        /**
                         * Decodes a PropertySetList message from the specified reader or buffer, length delimited.
                         * @function decodeDelimited
                         * @memberof org.eclipse.tahu.protobuf.Payload.PropertySetList
                         * @static
                         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                         * @returns {org.eclipse.tahu.protobuf.Payload.PropertySetList} PropertySetList
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        PropertySetList.decodeDelimited = function decodeDelimited(reader) {
                            if (!(reader instanceof $Reader))
                                reader = new $Reader(reader);
                            return this.decode(reader, reader.uint32());
                        };

                        /**
                         * Creates a PropertySetList message from a plain object. Also converts values to their respective internal types.
                         * @function fromObject
                         * @memberof org.eclipse.tahu.protobuf.Payload.PropertySetList
                         * @static
                         * @param {Object.<string,*>} object Plain object
                         * @returns {org.eclipse.tahu.protobuf.Payload.PropertySetList} PropertySetList
                         */
                        PropertySetList.fromObject = function fromObject(object) {
                            if (object instanceof $root.org.eclipse.tahu.protobuf.Payload.PropertySetList)
                                return object;
                            let message = new $root.org.eclipse.tahu.protobuf.Payload.PropertySetList();
                            if (object.propertyset) {
                                if (!Array.isArray(object.propertyset))
                                    throw TypeError(".org.eclipse.tahu.protobuf.Payload.PropertySetList.propertyset: array expected");
                                message.propertyset = [];
                                for (let i = 0; i < object.propertyset.length; ++i) {
                                    if (typeof object.propertyset[i] !== "object")
                                        throw TypeError(".org.eclipse.tahu.protobuf.Payload.PropertySetList.propertyset: object expected");
                                    message.propertyset[i] = $root.org.eclipse.tahu.protobuf.Payload.PropertySet.fromObject(object.propertyset[i]);
                                }
                            }
                            return message;
                        };

                        /**
                         * Creates a plain object from a PropertySetList message. Also converts values to other types if specified.
                         * @function toObject
                         * @memberof org.eclipse.tahu.protobuf.Payload.PropertySetList
                         * @static
                         * @param {org.eclipse.tahu.protobuf.Payload.PropertySetList} message PropertySetList
                         * @param {$protobuf.IConversionOptions} [options] Conversion options
                         * @returns {Object.<string,*>} Plain object
                         */
                        PropertySetList.toObject = function toObject(message, options) {
                            if (!options)
                                options = {};
                            let object = {};
                            if (options.arrays || options.defaults)
                                object.propertyset = [];
                            if (message.propertyset && message.propertyset.length) {
                                object.propertyset = [];
                                for (let j = 0; j < message.propertyset.length; ++j)
                                    object.propertyset[j] = $root.org.eclipse.tahu.protobuf.Payload.PropertySet.toObject(message.propertyset[j], options);
                            }
                            return object;
                        };

                        /**
                         * Converts this PropertySetList to JSON.
                         * @function toJSON
                         * @memberof org.eclipse.tahu.protobuf.Payload.PropertySetList
                         * @instance
                         * @returns {Object.<string,*>} JSON object
                         */
                        PropertySetList.prototype.toJSON = function toJSON() {
                            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                        };

                        /**
                         * Gets the default type url for PropertySetList
                         * @function getTypeUrl
                         * @memberof org.eclipse.tahu.protobuf.Payload.PropertySetList
                         * @static
                         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                         * @returns {string} The default type url
                         */
                        PropertySetList.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                            if (typeUrlPrefix === undefined) {
                                typeUrlPrefix = "type.googleapis.com";
                            }
                            return typeUrlPrefix + "/org.eclipse.tahu.protobuf.Payload.PropertySetList";
                        };

                        return PropertySetList;
                    })();

                    Payload.MetaData = (function() {

                        /**
                         * Properties of a MetaData.
                         * @memberof org.eclipse.tahu.protobuf.Payload
                         * @interface IMetaData
                         * @property {boolean|null} [isMultiPart] MetaData isMultiPart
                         * @property {string|null} [contentType] MetaData contentType
                         * @property {number|Long|null} [size] MetaData size
                         * @property {number|Long|null} [seq] MetaData seq
                         * @property {string|null} [fileName] MetaData fileName
                         * @property {string|null} [fileType] MetaData fileType
                         * @property {string|null} [md5] MetaData md5
                         * @property {string|null} [description] MetaData description
                         */

                        /**
                         * Constructs a new MetaData.
                         * @memberof org.eclipse.tahu.protobuf.Payload
                         * @classdesc Represents a MetaData.
                         * @implements IMetaData
                         * @constructor
                         * @param {org.eclipse.tahu.protobuf.Payload.IMetaData=} [properties] Properties to set
                         */
                        function MetaData(properties) {
                            if (properties)
                                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                    if (properties[keys[i]] != null)
                                        this[keys[i]] = properties[keys[i]];
                        }

                        /**
                         * MetaData isMultiPart.
                         * @member {boolean} isMultiPart
                         * @memberof org.eclipse.tahu.protobuf.Payload.MetaData
                         * @instance
                         */
                        MetaData.prototype.isMultiPart = false;

                        /**
                         * MetaData contentType.
                         * @member {string} contentType
                         * @memberof org.eclipse.tahu.protobuf.Payload.MetaData
                         * @instance
                         */
                        MetaData.prototype.contentType = "";

                        /**
                         * MetaData size.
                         * @member {number|Long} size
                         * @memberof org.eclipse.tahu.protobuf.Payload.MetaData
                         * @instance
                         */
                        MetaData.prototype.size = $util.Long ? $util.Long.fromBits(0,0,true) : 0;

                        /**
                         * MetaData seq.
                         * @member {number|Long} seq
                         * @memberof org.eclipse.tahu.protobuf.Payload.MetaData
                         * @instance
                         */
                        MetaData.prototype.seq = $util.Long ? $util.Long.fromBits(0,0,true) : 0;

                        /**
                         * MetaData fileName.
                         * @member {string} fileName
                         * @memberof org.eclipse.tahu.protobuf.Payload.MetaData
                         * @instance
                         */
                        MetaData.prototype.fileName = "";

                        /**
                         * MetaData fileType.
                         * @member {string} fileType
                         * @memberof org.eclipse.tahu.protobuf.Payload.MetaData
                         * @instance
                         */
                        MetaData.prototype.fileType = "";

                        /**
                         * MetaData md5.
                         * @member {string} md5
                         * @memberof org.eclipse.tahu.protobuf.Payload.MetaData
                         * @instance
                         */
                        MetaData.prototype.md5 = "";

                        /**
                         * MetaData description.
                         * @member {string} description
                         * @memberof org.eclipse.tahu.protobuf.Payload.MetaData
                         * @instance
                         */
                        MetaData.prototype.description = "";

                        /**
                         * Creates a new MetaData instance using the specified properties.
                         * @function create
                         * @memberof org.eclipse.tahu.protobuf.Payload.MetaData
                         * @static
                         * @param {org.eclipse.tahu.protobuf.Payload.IMetaData=} [properties] Properties to set
                         * @returns {org.eclipse.tahu.protobuf.Payload.MetaData} MetaData instance
                         */
                        MetaData.create = function create(properties) {
                            return new MetaData(properties);
                        };

                        /**
                         * Encodes the specified MetaData message. Does not implicitly {@link org.eclipse.tahu.protobuf.Payload.MetaData.verify|verify} messages.
                         * @function encode
                         * @memberof org.eclipse.tahu.protobuf.Payload.MetaData
                         * @static
                         * @param {org.eclipse.tahu.protobuf.Payload.IMetaData} message MetaData message or plain object to encode
                         * @param {$protobuf.Writer} [writer] Writer to encode to
                         * @returns {$protobuf.Writer} Writer
                         */
                        MetaData.encode = function encode(message, writer) {
                            if (!writer)
                                writer = $Writer.create();
                            if (message.isMultiPart != null && Object.hasOwnProperty.call(message, "isMultiPart"))
                                writer.uint32(/* id 1, wireType 0 =*/8).bool(message.isMultiPart);
                            if (message.contentType != null && Object.hasOwnProperty.call(message, "contentType"))
                                writer.uint32(/* id 2, wireType 2 =*/18).string(message.contentType);
                            if (message.size != null && Object.hasOwnProperty.call(message, "size"))
                                writer.uint32(/* id 3, wireType 0 =*/24).uint64(message.size);
                            if (message.seq != null && Object.hasOwnProperty.call(message, "seq"))
                                writer.uint32(/* id 4, wireType 0 =*/32).uint64(message.seq);
                            if (message.fileName != null && Object.hasOwnProperty.call(message, "fileName"))
                                writer.uint32(/* id 5, wireType 2 =*/42).string(message.fileName);
                            if (message.fileType != null && Object.hasOwnProperty.call(message, "fileType"))
                                writer.uint32(/* id 6, wireType 2 =*/50).string(message.fileType);
                            if (message.md5 != null && Object.hasOwnProperty.call(message, "md5"))
                                writer.uint32(/* id 7, wireType 2 =*/58).string(message.md5);
                            if (message.description != null && Object.hasOwnProperty.call(message, "description"))
                                writer.uint32(/* id 8, wireType 2 =*/66).string(message.description);
                            return writer;
                        };

                        /**
                         * Encodes the specified MetaData message, length delimited. Does not implicitly {@link org.eclipse.tahu.protobuf.Payload.MetaData.verify|verify} messages.
                         * @function encodeDelimited
                         * @memberof org.eclipse.tahu.protobuf.Payload.MetaData
                         * @static
                         * @param {org.eclipse.tahu.protobuf.Payload.IMetaData} message MetaData message or plain object to encode
                         * @param {$protobuf.Writer} [writer] Writer to encode to
                         * @returns {$protobuf.Writer} Writer
                         */
                        MetaData.encodeDelimited = function encodeDelimited(message, writer) {
                            return this.encode(message, writer).ldelim();
                        };

                        /**
                         * Decodes a MetaData message from the specified reader or buffer.
                         * @function decode
                         * @memberof org.eclipse.tahu.protobuf.Payload.MetaData
                         * @static
                         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                         * @param {number} [length] Message length if known beforehand
                         * @returns {org.eclipse.tahu.protobuf.Payload.MetaData} MetaData
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        MetaData.decode = function decode(reader, length, error) {
                            if (!(reader instanceof $Reader))
                                reader = $Reader.create(reader);
                            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.org.eclipse.tahu.protobuf.Payload.MetaData();
                            while (reader.pos < end) {
                                let tag = reader.uint32();
                                if (tag === error)
                                    break;
                                switch (tag >>> 3) {
                                case 1: {
                                        message.isMultiPart = reader.bool();
                                        break;
                                    }
                                case 2: {
                                        message.contentType = reader.string();
                                        break;
                                    }
                                case 3: {
                                        message.size = reader.uint64();
                                        break;
                                    }
                                case 4: {
                                        message.seq = reader.uint64();
                                        break;
                                    }
                                case 5: {
                                        message.fileName = reader.string();
                                        break;
                                    }
                                case 6: {
                                        message.fileType = reader.string();
                                        break;
                                    }
                                case 7: {
                                        message.md5 = reader.string();
                                        break;
                                    }
                                case 8: {
                                        message.description = reader.string();
                                        break;
                                    }
                                default:
                                    reader.skipType(tag & 7);
                                    break;
                                }
                            }
                            return message;
                        };

                        /**
                         * Decodes a MetaData message from the specified reader or buffer, length delimited.
                         * @function decodeDelimited
                         * @memberof org.eclipse.tahu.protobuf.Payload.MetaData
                         * @static
                         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                         * @returns {org.eclipse.tahu.protobuf.Payload.MetaData} MetaData
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        MetaData.decodeDelimited = function decodeDelimited(reader) {
                            if (!(reader instanceof $Reader))
                                reader = new $Reader(reader);
                            return this.decode(reader, reader.uint32());
                        };

                        /**
                         * Creates a MetaData message from a plain object. Also converts values to their respective internal types.
                         * @function fromObject
                         * @memberof org.eclipse.tahu.protobuf.Payload.MetaData
                         * @static
                         * @param {Object.<string,*>} object Plain object
                         * @returns {org.eclipse.tahu.protobuf.Payload.MetaData} MetaData
                         */
                        MetaData.fromObject = function fromObject(object) {
                            if (object instanceof $root.org.eclipse.tahu.protobuf.Payload.MetaData)
                                return object;
                            let message = new $root.org.eclipse.tahu.protobuf.Payload.MetaData();
                            if (object.isMultiPart != null)
                                message.isMultiPart = Boolean(object.isMultiPart);
                            if (object.contentType != null)
                                message.contentType = String(object.contentType);
                            if (object.size != null)
                                if ($util.Long)
                                    (message.size = $util.Long.fromValue(object.size)).unsigned = true;
                                else if (typeof object.size === "string")
                                    message.size = parseInt(object.size, 10);
                                else if (typeof object.size === "number")
                                    message.size = object.size;
                                else if (typeof object.size === "object")
                                    message.size = new $util.LongBits(object.size.low >>> 0, object.size.high >>> 0).toNumber(true);
                            if (object.seq != null)
                                if ($util.Long)
                                    (message.seq = $util.Long.fromValue(object.seq)).unsigned = true;
                                else if (typeof object.seq === "string")
                                    message.seq = parseInt(object.seq, 10);
                                else if (typeof object.seq === "number")
                                    message.seq = object.seq;
                                else if (typeof object.seq === "object")
                                    message.seq = new $util.LongBits(object.seq.low >>> 0, object.seq.high >>> 0).toNumber(true);
                            if (object.fileName != null)
                                message.fileName = String(object.fileName);
                            if (object.fileType != null)
                                message.fileType = String(object.fileType);
                            if (object.md5 != null)
                                message.md5 = String(object.md5);
                            if (object.description != null)
                                message.description = String(object.description);
                            return message;
                        };

                        /**
                         * Creates a plain object from a MetaData message. Also converts values to other types if specified.
                         * @function toObject
                         * @memberof org.eclipse.tahu.protobuf.Payload.MetaData
                         * @static
                         * @param {org.eclipse.tahu.protobuf.Payload.MetaData} message MetaData
                         * @param {$protobuf.IConversionOptions} [options] Conversion options
                         * @returns {Object.<string,*>} Plain object
                         */
                        MetaData.toObject = function toObject(message, options) {
                            if (!options)
                                options = {};
                            let object = {};
                            if (options.defaults) {
                                object.isMultiPart = false;
                                object.contentType = "";
                                if ($util.Long) {
                                    let long = new $util.Long(0, 0, true);
                                    object.size = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                                } else
                                    object.size = options.longs === String ? "0" : 0;
                                if ($util.Long) {
                                    let long = new $util.Long(0, 0, true);
                                    object.seq = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                                } else
                                    object.seq = options.longs === String ? "0" : 0;
                                object.fileName = "";
                                object.fileType = "";
                                object.md5 = "";
                                object.description = "";
                            }
                            if (message.isMultiPart != null && message.hasOwnProperty("isMultiPart"))
                                object.isMultiPart = message.isMultiPart;
                            if (message.contentType != null && message.hasOwnProperty("contentType"))
                                object.contentType = message.contentType;
                            if (message.size != null && message.hasOwnProperty("size"))
                                if (typeof message.size === "number")
                                    object.size = options.longs === String ? String(message.size) : message.size;
                                else
                                    object.size = options.longs === String ? $util.Long.prototype.toString.call(message.size) : options.longs === Number ? new $util.LongBits(message.size.low >>> 0, message.size.high >>> 0).toNumber(true) : message.size;
                            if (message.seq != null && message.hasOwnProperty("seq"))
                                if (typeof message.seq === "number")
                                    object.seq = options.longs === String ? String(message.seq) : message.seq;
                                else
                                    object.seq = options.longs === String ? $util.Long.prototype.toString.call(message.seq) : options.longs === Number ? new $util.LongBits(message.seq.low >>> 0, message.seq.high >>> 0).toNumber(true) : message.seq;
                            if (message.fileName != null && message.hasOwnProperty("fileName"))
                                object.fileName = message.fileName;
                            if (message.fileType != null && message.hasOwnProperty("fileType"))
                                object.fileType = message.fileType;
                            if (message.md5 != null && message.hasOwnProperty("md5"))
                                object.md5 = message.md5;
                            if (message.description != null && message.hasOwnProperty("description"))
                                object.description = message.description;
                            return object;
                        };

                        /**
                         * Converts this MetaData to JSON.
                         * @function toJSON
                         * @memberof org.eclipse.tahu.protobuf.Payload.MetaData
                         * @instance
                         * @returns {Object.<string,*>} JSON object
                         */
                        MetaData.prototype.toJSON = function toJSON() {
                            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                        };

                        /**
                         * Gets the default type url for MetaData
                         * @function getTypeUrl
                         * @memberof org.eclipse.tahu.protobuf.Payload.MetaData
                         * @static
                         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                         * @returns {string} The default type url
                         */
                        MetaData.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                            if (typeUrlPrefix === undefined) {
                                typeUrlPrefix = "type.googleapis.com";
                            }
                            return typeUrlPrefix + "/org.eclipse.tahu.protobuf.Payload.MetaData";
                        };

                        return MetaData;
                    })();

                    Payload.Metric = (function() {

                        /**
                         * Properties of a Metric.
                         * @memberof org.eclipse.tahu.protobuf.Payload
                         * @interface IMetric
                         * @property {string|null} [name] Metric name
                         * @property {number|Long|null} [alias] Metric alias
                         * @property {number|Long|null} [timestamp] Metric timestamp
                         * @property {number|null} [datatype] Metric datatype
                         * @property {boolean|null} [isHistorical] Metric isHistorical
                         * @property {boolean|null} [isTransient] Metric isTransient
                         * @property {boolean|null} [isNull] Metric isNull
                         * @property {org.eclipse.tahu.protobuf.Payload.IMetaData|null} [metadata] Metric metadata
                         * @property {org.eclipse.tahu.protobuf.Payload.IPropertySet|null} [properties] Metric properties
                         * @property {number|null} [intValue] Metric intValue
                         * @property {number|Long|null} [longValue] Metric longValue
                         * @property {number|null} [floatValue] Metric floatValue
                         * @property {number|null} [doubleValue] Metric doubleValue
                         * @property {boolean|null} [booleanValue] Metric booleanValue
                         * @property {string|null} [stringValue] Metric stringValue
                         * @property {Uint8Array|null} [bytesValue] Metric bytesValue
                         * @property {org.eclipse.tahu.protobuf.Payload.IDataSet|null} [datasetValue] Metric datasetValue
                         * @property {org.eclipse.tahu.protobuf.Payload.ITemplate|null} [templateValue] Metric templateValue
                         * @property {org.eclipse.tahu.protobuf.Payload.IPropertySet|null} [extensionValue] Metric extensionValue
                         */

                        /**
                         * Constructs a new Metric.
                         * @memberof org.eclipse.tahu.protobuf.Payload
                         * @classdesc Represents a Metric.
                         * @implements IMetric
                         * @constructor
                         * @param {org.eclipse.tahu.protobuf.Payload.IMetric=} [properties] Properties to set
                         */
                        function Metric(properties) {
                            if (properties)
                                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                    if (properties[keys[i]] != null)
                                        this[keys[i]] = properties[keys[i]];
                        }

                        /**
                         * Metric name.
                         * @member {string} name
                         * @memberof org.eclipse.tahu.protobuf.Payload.Metric
                         * @instance
                         */
                        Metric.prototype.name = "";

                        /**
                         * Metric alias.
                         * @member {number|Long} alias
                         * @memberof org.eclipse.tahu.protobuf.Payload.Metric
                         * @instance
                         */
                        Metric.prototype.alias = $util.Long ? $util.Long.fromBits(0,0,true) : 0;

                        /**
                         * Metric timestamp.
                         * @member {number|Long} timestamp
                         * @memberof org.eclipse.tahu.protobuf.Payload.Metric
                         * @instance
                         */
                        Metric.prototype.timestamp = $util.Long ? $util.Long.fromBits(0,0,true) : 0;

                        /**
                         * Metric datatype.
                         * @member {number} datatype
                         * @memberof org.eclipse.tahu.protobuf.Payload.Metric
                         * @instance
                         */
                        Metric.prototype.datatype = 0;

                        /**
                         * Metric isHistorical.
                         * @member {boolean} isHistorical
                         * @memberof org.eclipse.tahu.protobuf.Payload.Metric
                         * @instance
                         */
                        Metric.prototype.isHistorical = false;

                        /**
                         * Metric isTransient.
                         * @member {boolean} isTransient
                         * @memberof org.eclipse.tahu.protobuf.Payload.Metric
                         * @instance
                         */
                        Metric.prototype.isTransient = false;

                        /**
                         * Metric isNull.
                         * @member {boolean} isNull
                         * @memberof org.eclipse.tahu.protobuf.Payload.Metric
                         * @instance
                         */
                        Metric.prototype.isNull = false;

                        /**
                         * Metric metadata.
                         * @member {org.eclipse.tahu.protobuf.Payload.IMetaData|null|undefined} metadata
                         * @memberof org.eclipse.tahu.protobuf.Payload.Metric
                         * @instance
                         */
                        Metric.prototype.metadata = null;

                        /**
                         * Metric properties.
                         * @member {org.eclipse.tahu.protobuf.Payload.IPropertySet|null|undefined} properties
                         * @memberof org.eclipse.tahu.protobuf.Payload.Metric
                         * @instance
                         */
                        Metric.prototype.properties = null;

                        /**
                         * Metric intValue.
                         * @member {number|null|undefined} intValue
                         * @memberof org.eclipse.tahu.protobuf.Payload.Metric
                         * @instance
                         */
                        Metric.prototype.intValue = null;

                        /**
                         * Metric longValue.
                         * @member {number|Long|null|undefined} longValue
                         * @memberof org.eclipse.tahu.protobuf.Payload.Metric
                         * @instance
                         */
                        Metric.prototype.longValue = null;

                        /**
                         * Metric floatValue.
                         * @member {number|null|undefined} floatValue
                         * @memberof org.eclipse.tahu.protobuf.Payload.Metric
                         * @instance
                         */
                        Metric.prototype.floatValue = null;

                        /**
                         * Metric doubleValue.
                         * @member {number|null|undefined} doubleValue
                         * @memberof org.eclipse.tahu.protobuf.Payload.Metric
                         * @instance
                         */
                        Metric.prototype.doubleValue = null;

                        /**
                         * Metric booleanValue.
                         * @member {boolean|null|undefined} booleanValue
                         * @memberof org.eclipse.tahu.protobuf.Payload.Metric
                         * @instance
                         */
                        Metric.prototype.booleanValue = null;

                        /**
                         * Metric stringValue.
                         * @member {string|null|undefined} stringValue
                         * @memberof org.eclipse.tahu.protobuf.Payload.Metric
                         * @instance
                         */
                        Metric.prototype.stringValue = null;

                        /**
                         * Metric bytesValue.
                         * @member {Uint8Array|null|undefined} bytesValue
                         * @memberof org.eclipse.tahu.protobuf.Payload.Metric
                         * @instance
                         */
                        Metric.prototype.bytesValue = null;

                        /**
                         * Metric datasetValue.
                         * @member {org.eclipse.tahu.protobuf.Payload.IDataSet|null|undefined} datasetValue
                         * @memberof org.eclipse.tahu.protobuf.Payload.Metric
                         * @instance
                         */
                        Metric.prototype.datasetValue = null;

                        /**
                         * Metric templateValue.
                         * @member {org.eclipse.tahu.protobuf.Payload.ITemplate|null|undefined} templateValue
                         * @memberof org.eclipse.tahu.protobuf.Payload.Metric
                         * @instance
                         */
                        Metric.prototype.templateValue = null;

                        /**
                         * Metric extensionValue.
                         * @member {org.eclipse.tahu.protobuf.Payload.IPropertySet|null|undefined} extensionValue
                         * @memberof org.eclipse.tahu.protobuf.Payload.Metric
                         * @instance
                         */
                        Metric.prototype.extensionValue = null;

                        // OneOf field names bound to virtual getters and setters
                        let $oneOfFields;

                        /**
                         * Metric value.
                         * @member {"intValue"|"longValue"|"floatValue"|"doubleValue"|"booleanValue"|"stringValue"|"bytesValue"|"datasetValue"|"templateValue"|"extensionValue"|undefined} value
                         * @memberof org.eclipse.tahu.protobuf.Payload.Metric
                         * @instance
                         */
                        Object.defineProperty(Metric.prototype, "value", {
                            get: $util.oneOfGetter($oneOfFields = ["intValue", "longValue", "floatValue", "doubleValue", "booleanValue", "stringValue", "bytesValue", "datasetValue", "templateValue", "extensionValue"]),
                            set: $util.oneOfSetter($oneOfFields)
                        });

                        /**
                         * Creates a new Metric instance using the specified properties.
                         * @function create
                         * @memberof org.eclipse.tahu.protobuf.Payload.Metric
                         * @static
                         * @param {org.eclipse.tahu.protobuf.Payload.IMetric=} [properties] Properties to set
                         * @returns {org.eclipse.tahu.protobuf.Payload.Metric} Metric instance
                         */
                        Metric.create = function create(properties) {
                            return new Metric(properties);
                        };

                        /**
                         * Encodes the specified Metric message. Does not implicitly {@link org.eclipse.tahu.protobuf.Payload.Metric.verify|verify} messages.
                         * @function encode
                         * @memberof org.eclipse.tahu.protobuf.Payload.Metric
                         * @static
                         * @param {org.eclipse.tahu.protobuf.Payload.IMetric} message Metric message or plain object to encode
                         * @param {$protobuf.Writer} [writer] Writer to encode to
                         * @returns {$protobuf.Writer} Writer
                         */
                        Metric.encode = function encode(message, writer) {
                            if (!writer)
                                writer = $Writer.create();
                            if (message.name != null && Object.hasOwnProperty.call(message, "name"))
                                writer.uint32(/* id 1, wireType 2 =*/10).string(message.name);
                            if (message.alias != null && Object.hasOwnProperty.call(message, "alias"))
                                writer.uint32(/* id 2, wireType 0 =*/16).uint64(message.alias);
                            if (message.timestamp != null && Object.hasOwnProperty.call(message, "timestamp"))
                                writer.uint32(/* id 3, wireType 0 =*/24).uint64(message.timestamp);
                            if (message.datatype != null && Object.hasOwnProperty.call(message, "datatype"))
                                writer.uint32(/* id 4, wireType 0 =*/32).uint32(message.datatype);
                            if (message.isHistorical != null && Object.hasOwnProperty.call(message, "isHistorical"))
                                writer.uint32(/* id 5, wireType 0 =*/40).bool(message.isHistorical);
                            if (message.isTransient != null && Object.hasOwnProperty.call(message, "isTransient"))
                                writer.uint32(/* id 6, wireType 0 =*/48).bool(message.isTransient);
                            if (message.isNull != null && Object.hasOwnProperty.call(message, "isNull"))
                                writer.uint32(/* id 7, wireType 0 =*/56).bool(message.isNull);
                            if (message.metadata != null && Object.hasOwnProperty.call(message, "metadata"))
                                $root.org.eclipse.tahu.protobuf.Payload.MetaData.encode(message.metadata, writer.uint32(/* id 8, wireType 2 =*/66).fork()).ldelim();
                            if (message.properties != null && Object.hasOwnProperty.call(message, "properties"))
                                $root.org.eclipse.tahu.protobuf.Payload.PropertySet.encode(message.properties, writer.uint32(/* id 9, wireType 2 =*/74).fork()).ldelim();
                            if (message.intValue != null && Object.hasOwnProperty.call(message, "intValue"))
                                writer.uint32(/* id 10, wireType 0 =*/80).uint32(message.intValue);
                            if (message.longValue != null && Object.hasOwnProperty.call(message, "longValue"))
                                writer.uint32(/* id 11, wireType 0 =*/88).uint64(message.longValue);
                            if (message.floatValue != null && Object.hasOwnProperty.call(message, "floatValue"))
                                writer.uint32(/* id 12, wireType 5 =*/101).float(message.floatValue);
                            if (message.doubleValue != null && Object.hasOwnProperty.call(message, "doubleValue"))
                                writer.uint32(/* id 13, wireType 1 =*/105).double(message.doubleValue);
                            if (message.booleanValue != null && Object.hasOwnProperty.call(message, "booleanValue"))
                                writer.uint32(/* id 14, wireType 0 =*/112).bool(message.booleanValue);
                            if (message.stringValue != null && Object.hasOwnProperty.call(message, "stringValue"))
                                writer.uint32(/* id 15, wireType 2 =*/122).string(message.stringValue);
                            if (message.bytesValue != null && Object.hasOwnProperty.call(message, "bytesValue"))
                                writer.uint32(/* id 16, wireType 2 =*/130).bytes(message.bytesValue);
                            if (message.datasetValue != null && Object.hasOwnProperty.call(message, "datasetValue"))
                                $root.org.eclipse.tahu.protobuf.Payload.DataSet.encode(message.datasetValue, writer.uint32(/* id 17, wireType 2 =*/138).fork()).ldelim();
                            if (message.templateValue != null && Object.hasOwnProperty.call(message, "templateValue"))
                                $root.org.eclipse.tahu.protobuf.Payload.Template.encode(message.templateValue, writer.uint32(/* id 18, wireType 2 =*/146).fork()).ldelim();
                            if (message.extensionValue != null && Object.hasOwnProperty.call(message, "extensionValue"))
                                $root.org.eclipse.tahu.protobuf.Payload.PropertySet.encode(message.extensionValue, writer.uint32(/* id 19, wireType 2 =*/154).fork()).ldelim();
                            return writer;
                        };

                        /**
                         * Encodes the specified Metric message, length delimited. Does not implicitly {@link org.eclipse.tahu.protobuf.Payload.Metric.verify|verify} messages.
                         * @function encodeDelimited
                         * @memberof org.eclipse.tahu.protobuf.Payload.Metric
                         * @static
                         * @param {org.eclipse.tahu.protobuf.Payload.IMetric} message Metric message or plain object to encode
                         * @param {$protobuf.Writer} [writer] Writer to encode to
                         * @returns {$protobuf.Writer} Writer
                         */
                        Metric.encodeDelimited = function encodeDelimited(message, writer) {
                            return this.encode(message, writer).ldelim();
                        };

                        /**
                         * Decodes a Metric message from the specified reader or buffer.
                         * @function decode
                         * @memberof org.eclipse.tahu.protobuf.Payload.Metric
                         * @static
                         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                         * @param {number} [length] Message length if known beforehand
                         * @returns {org.eclipse.tahu.protobuf.Payload.Metric} Metric
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        Metric.decode = function decode(reader, length, error) {
                            if (!(reader instanceof $Reader))
                                reader = $Reader.create(reader);
                            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.org.eclipse.tahu.protobuf.Payload.Metric();
                            while (reader.pos < end) {
                                let tag = reader.uint32();
                                if (tag === error)
                                    break;
                                switch (tag >>> 3) {
                                case 1: {
                                        message.name = reader.string();
                                        break;
                                    }
                                case 2: {
                                        message.alias = reader.uint64();
                                        break;
                                    }
                                case 3: {
                                        message.timestamp = reader.uint64();
                                        break;
                                    }
                                case 4: {
                                        message.datatype = reader.uint32();
                                        break;
                                    }
                                case 5: {
                                        message.isHistorical = reader.bool();
                                        break;
                                    }
                                case 6: {
                                        message.isTransient = reader.bool();
                                        break;
                                    }
                                case 7: {
                                        message.isNull = reader.bool();
                                        break;
                                    }
                                case 8: {
                                        message.metadata = $root.org.eclipse.tahu.protobuf.Payload.MetaData.decode(reader, reader.uint32());
                                        break;
                                    }
                                case 9: {
                                        message.properties = $root.org.eclipse.tahu.protobuf.Payload.PropertySet.decode(reader, reader.uint32());
                                        break;
                                    }
                                case 10: {
                                        message.intValue = reader.uint32();
                                        break;
                                    }
                                case 11: {
                                        message.longValue = reader.uint64();
                                        break;
                                    }
                                case 12: {
                                        message.floatValue = reader.float();
                                        break;
                                    }
                                case 13: {
                                        message.doubleValue = reader.double();
                                        break;
                                    }
                                case 14: {
                                        message.booleanValue = reader.bool();
                                        break;
                                    }
                                case 15: {
                                        message.stringValue = reader.string();
                                        break;
                                    }
                                case 16: {
                                        message.bytesValue = reader.bytes();
                                        break;
                                    }
                                case 17: {
                                        message.datasetValue = $root.org.eclipse.tahu.protobuf.Payload.DataSet.decode(reader, reader.uint32());
                                        break;
                                    }
                                case 18: {
                                        message.templateValue = $root.org.eclipse.tahu.protobuf.Payload.Template.decode(reader, reader.uint32());
                                        break;
                                    }
                                case 19: {
                                        message.extensionValue = $root.org.eclipse.tahu.protobuf.Payload.PropertySet.decode(reader, reader.uint32());
                                        break;
                                    }
                                default:
                                    reader.skipType(tag & 7);
                                    break;
                                }
                            }
                            return message;
                        };

                        /**
                         * Decodes a Metric message from the specified reader or buffer, length delimited.
                         * @function decodeDelimited
                         * @memberof org.eclipse.tahu.protobuf.Payload.Metric
                         * @static
                         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                         * @returns {org.eclipse.tahu.protobuf.Payload.Metric} Metric
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        Metric.decodeDelimited = function decodeDelimited(reader) {
                            if (!(reader instanceof $Reader))
                                reader = new $Reader(reader);
                            return this.decode(reader, reader.uint32());
                        };

                        /**
                         * Creates a Metric message from a plain object. Also converts values to their respective internal types.
                         * @function fromObject
                         * @memberof org.eclipse.tahu.protobuf.Payload.Metric
                         * @static
                         * @param {Object.<string,*>} object Plain object
                         * @returns {org.eclipse.tahu.protobuf.Payload.Metric} Metric
                         */
                        Metric.fromObject = function fromObject(object) {
                            if (object instanceof $root.org.eclipse.tahu.protobuf.Payload.Metric)
                                return object;
                            let message = new $root.org.eclipse.tahu.protobuf.Payload.Metric();
                            if (object.name != null)
                                message.name = String(object.name);
                            if (object.alias != null)
                                if ($util.Long)
                                    (message.alias = $util.Long.fromValue(object.alias)).unsigned = true;
                                else if (typeof object.alias === "string")
                                    message.alias = parseInt(object.alias, 10);
                                else if (typeof object.alias === "number")
                                    message.alias = object.alias;
                                else if (typeof object.alias === "object")
                                    message.alias = new $util.LongBits(object.alias.low >>> 0, object.alias.high >>> 0).toNumber(true);
                            if (object.timestamp != null)
                                if ($util.Long)
                                    (message.timestamp = $util.Long.fromValue(object.timestamp)).unsigned = true;
                                else if (typeof object.timestamp === "string")
                                    message.timestamp = parseInt(object.timestamp, 10);
                                else if (typeof object.timestamp === "number")
                                    message.timestamp = object.timestamp;
                                else if (typeof object.timestamp === "object")
                                    message.timestamp = new $util.LongBits(object.timestamp.low >>> 0, object.timestamp.high >>> 0).toNumber(true);
                            if (object.datatype != null)
                                message.datatype = object.datatype >>> 0;
                            if (object.isHistorical != null)
                                message.isHistorical = Boolean(object.isHistorical);
                            if (object.isTransient != null)
                                message.isTransient = Boolean(object.isTransient);
                            if (object.isNull != null)
                                message.isNull = Boolean(object.isNull);
                            if (object.metadata != null) {
                                if (typeof object.metadata !== "object")
                                    throw TypeError(".org.eclipse.tahu.protobuf.Payload.Metric.metadata: object expected");
                                message.metadata = $root.org.eclipse.tahu.protobuf.Payload.MetaData.fromObject(object.metadata);
                            }
                            if (object.properties != null) {
                                if (typeof object.properties !== "object")
                                    throw TypeError(".org.eclipse.tahu.protobuf.Payload.Metric.properties: object expected");
                                message.properties = $root.org.eclipse.tahu.protobuf.Payload.PropertySet.fromObject(object.properties);
                            }
                            if (object.intValue != null)
                                message.intValue = object.intValue >>> 0;
                            if (object.longValue != null)
                                if ($util.Long)
                                    (message.longValue = $util.Long.fromValue(object.longValue)).unsigned = true;
                                else if (typeof object.longValue === "string")
                                    message.longValue = parseInt(object.longValue, 10);
                                else if (typeof object.longValue === "number")
                                    message.longValue = object.longValue;
                                else if (typeof object.longValue === "object")
                                    message.longValue = new $util.LongBits(object.longValue.low >>> 0, object.longValue.high >>> 0).toNumber(true);
                            if (object.floatValue != null)
                                message.floatValue = Number(object.floatValue);
                            if (object.doubleValue != null)
                                message.doubleValue = Number(object.doubleValue);
                            if (object.booleanValue != null)
                                message.booleanValue = Boolean(object.booleanValue);
                            if (object.stringValue != null)
                                message.stringValue = String(object.stringValue);
                            if (object.bytesValue != null)
                                if (typeof object.bytesValue === "string")
                                    $util.base64.decode(object.bytesValue, message.bytesValue = $util.newBuffer($util.base64.length(object.bytesValue)), 0);
                                else if (object.bytesValue.length >= 0)
                                    message.bytesValue = object.bytesValue;
                            if (object.datasetValue != null) {
                                if (typeof object.datasetValue !== "object")
                                    throw TypeError(".org.eclipse.tahu.protobuf.Payload.Metric.datasetValue: object expected");
                                message.datasetValue = $root.org.eclipse.tahu.protobuf.Payload.DataSet.fromObject(object.datasetValue);
                            }
                            if (object.templateValue != null) {
                                if (typeof object.templateValue !== "object")
                                    throw TypeError(".org.eclipse.tahu.protobuf.Payload.Metric.templateValue: object expected");
                                message.templateValue = $root.org.eclipse.tahu.protobuf.Payload.Template.fromObject(object.templateValue);
                            }
                            if (object.extensionValue != null) {
                                if (typeof object.extensionValue !== "object")
                                    throw TypeError(".org.eclipse.tahu.protobuf.Payload.Metric.extensionValue: object expected");
                                message.extensionValue = $root.org.eclipse.tahu.protobuf.Payload.PropertySet.fromObject(object.extensionValue);
                            }
                            return message;
                        };

                        /**
                         * Creates a plain object from a Metric message. Also converts values to other types if specified.
                         * @function toObject
                         * @memberof org.eclipse.tahu.protobuf.Payload.Metric
                         * @static
                         * @param {org.eclipse.tahu.protobuf.Payload.Metric} message Metric
                         * @param {$protobuf.IConversionOptions} [options] Conversion options
                         * @returns {Object.<string,*>} Plain object
                         */
                        Metric.toObject = function toObject(message, options) {
                            if (!options)
                                options = {};
                            let object = {};
                            if (options.defaults) {
                                object.name = "";
                                if ($util.Long) {
                                    let long = new $util.Long(0, 0, true);
                                    object.alias = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                                } else
                                    object.alias = options.longs === String ? "0" : 0;
                                if ($util.Long) {
                                    let long = new $util.Long(0, 0, true);
                                    object.timestamp = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                                } else
                                    object.timestamp = options.longs === String ? "0" : 0;
                                object.datatype = 0;
                                object.isHistorical = false;
                                object.isTransient = false;
                                object.isNull = false;
                                object.metadata = null;
                                object.properties = null;
                            }
                            if (message.name != null && message.hasOwnProperty("name"))
                                object.name = message.name;
                            if (message.alias != null && message.hasOwnProperty("alias"))
                                if (typeof message.alias === "number")
                                    object.alias = options.longs === String ? String(message.alias) : message.alias;
                                else
                                    object.alias = options.longs === String ? $util.Long.prototype.toString.call(message.alias) : options.longs === Number ? new $util.LongBits(message.alias.low >>> 0, message.alias.high >>> 0).toNumber(true) : message.alias;
                            if (message.timestamp != null && message.hasOwnProperty("timestamp"))
                                if (typeof message.timestamp === "number")
                                    object.timestamp = options.longs === String ? String(message.timestamp) : message.timestamp;
                                else
                                    object.timestamp = options.longs === String ? $util.Long.prototype.toString.call(message.timestamp) : options.longs === Number ? new $util.LongBits(message.timestamp.low >>> 0, message.timestamp.high >>> 0).toNumber(true) : message.timestamp;
                            if (message.datatype != null && message.hasOwnProperty("datatype"))
                                object.datatype = message.datatype;
                            if (message.isHistorical != null && message.hasOwnProperty("isHistorical"))
                                object.isHistorical = message.isHistorical;
                            if (message.isTransient != null && message.hasOwnProperty("isTransient"))
                                object.isTransient = message.isTransient;
                            if (message.isNull != null && message.hasOwnProperty("isNull"))
                                object.isNull = message.isNull;
                            if (message.metadata != null && message.hasOwnProperty("metadata"))
                                object.metadata = $root.org.eclipse.tahu.protobuf.Payload.MetaData.toObject(message.metadata, options);
                            if (message.properties != null && message.hasOwnProperty("properties"))
                                object.properties = $root.org.eclipse.tahu.protobuf.Payload.PropertySet.toObject(message.properties, options);
                            if (message.intValue != null && message.hasOwnProperty("intValue")) {
                                object.intValue = message.intValue;
                                if (options.oneofs)
                                    object.value = "intValue";
                            }
                            if (message.longValue != null && message.hasOwnProperty("longValue")) {
                                if (typeof message.longValue === "number")
                                    object.longValue = options.longs === String ? String(message.longValue) : message.longValue;
                                else
                                    object.longValue = options.longs === String ? $util.Long.prototype.toString.call(message.longValue) : options.longs === Number ? new $util.LongBits(message.longValue.low >>> 0, message.longValue.high >>> 0).toNumber(true) : message.longValue;
                                if (options.oneofs)
                                    object.value = "longValue";
                            }
                            if (message.floatValue != null && message.hasOwnProperty("floatValue")) {
                                object.floatValue = options.json && !isFinite(message.floatValue) ? String(message.floatValue) : message.floatValue;
                                if (options.oneofs)
                                    object.value = "floatValue";
                            }
                            if (message.doubleValue != null && message.hasOwnProperty("doubleValue")) {
                                object.doubleValue = options.json && !isFinite(message.doubleValue) ? String(message.doubleValue) : message.doubleValue;
                                if (options.oneofs)
                                    object.value = "doubleValue";
                            }
                            if (message.booleanValue != null && message.hasOwnProperty("booleanValue")) {
                                object.booleanValue = message.booleanValue;
                                if (options.oneofs)
                                    object.value = "booleanValue";
                            }
                            if (message.stringValue != null && message.hasOwnProperty("stringValue")) {
                                object.stringValue = message.stringValue;
                                if (options.oneofs)
                                    object.value = "stringValue";
                            }
                            if (message.bytesValue != null && message.hasOwnProperty("bytesValue")) {
                                object.bytesValue = options.bytes === String ? $util.base64.encode(message.bytesValue, 0, message.bytesValue.length) : options.bytes === Array ? Array.prototype.slice.call(message.bytesValue) : message.bytesValue;
                                if (options.oneofs)
                                    object.value = "bytesValue";
                            }
                            if (message.datasetValue != null && message.hasOwnProperty("datasetValue")) {
                                object.datasetValue = $root.org.eclipse.tahu.protobuf.Payload.DataSet.toObject(message.datasetValue, options);
                                if (options.oneofs)
                                    object.value = "datasetValue";
                            }
                            if (message.templateValue != null && message.hasOwnProperty("templateValue")) {
                                object.templateValue = $root.org.eclipse.tahu.protobuf.Payload.Template.toObject(message.templateValue, options);
                                if (options.oneofs)
                                    object.value = "templateValue";
                            }
                            if (message.extensionValue != null && message.hasOwnProperty("extensionValue")) {
                                object.extensionValue = $root.org.eclipse.tahu.protobuf.Payload.PropertySet.toObject(message.extensionValue, options);
                                if (options.oneofs)
                                    object.value = "extensionValue";
                            }
                            return object;
                        };

                        /**
                         * Converts this Metric to JSON.
                         * @function toJSON
                         * @memberof org.eclipse.tahu.protobuf.Payload.Metric
                         * @instance
                         * @returns {Object.<string,*>} JSON object
                         */
                        Metric.prototype.toJSON = function toJSON() {
                            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                        };

                        /**
                         * Gets the default type url for Metric
                         * @function getTypeUrl
                         * @memberof org.eclipse.tahu.protobuf.Payload.Metric
                         * @static
                         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                         * @returns {string} The default type url
                         */
                        Metric.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                            if (typeUrlPrefix === undefined) {
                                typeUrlPrefix = "type.googleapis.com";
                            }
                            return typeUrlPrefix + "/org.eclipse.tahu.protobuf.Payload.Metric";
                        };

                        return Metric;
                    })();

                    Payload.ParameterSet = (function() {

                        /**
                         * Properties of a ParameterSet.
                         * @memberof org.eclipse.tahu.protobuf.Payload
                         * @interface IParameterSet
                         * @property {Array.<string>|null} [keys] ParameterSet keys
                         * @property {Array.<org.eclipse.tahu.protobuf.Payload.IParameterValue>|null} [values] ParameterSet values
                         */

                        /**
                         * Constructs a new ParameterSet.
                         * @memberof org.eclipse.tahu.protobuf.Payload
                         * @classdesc Represents a ParameterSet.
                         * @implements IParameterSet
                         * @constructor
                         * @param {org.eclipse.tahu.protobuf.Payload.IParameterSet=} [properties] Properties to set
                         */
                        function ParameterSet(properties) {
                            this.keys = [];
                            this.values = [];
                            if (properties)
                                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                    if (properties[keys[i]] != null)
                                        this[keys[i]] = properties[keys[i]];
                        }

                        /**
                         * ParameterSet keys.
                         * @member {Array.<string>} keys
                         * @memberof org.eclipse.tahu.protobuf.Payload.ParameterSet
                         * @instance
                         */
                        ParameterSet.prototype.keys = $util.emptyArray;

                        /**
                         * ParameterSet values.
                         * @member {Array.<org.eclipse.tahu.protobuf.Payload.IParameterValue>} values
                         * @memberof org.eclipse.tahu.protobuf.Payload.ParameterSet
                         * @instance
                         */
                        ParameterSet.prototype.values = $util.emptyArray;

                        /**
                         * Creates a new ParameterSet instance using the specified properties.
                         * @function create
                         * @memberof org.eclipse.tahu.protobuf.Payload.ParameterSet
                         * @static
                         * @param {org.eclipse.tahu.protobuf.Payload.IParameterSet=} [properties] Properties to set
                         * @returns {org.eclipse.tahu.protobuf.Payload.ParameterSet} ParameterSet instance
                         */
                        ParameterSet.create = function create(properties) {
                            return new ParameterSet(properties);
                        };

                        /**
                         * Encodes the specified ParameterSet message. Does not implicitly {@link org.eclipse.tahu.protobuf.Payload.ParameterSet.verify|verify} messages.
                         * @function encode
                         * @memberof org.eclipse.tahu.protobuf.Payload.ParameterSet
                         * @static
                         * @param {org.eclipse.tahu.protobuf.Payload.IParameterSet} message ParameterSet message or plain object to encode
                         * @param {$protobuf.Writer} [writer] Writer to encode to
                         * @returns {$protobuf.Writer} Writer
                         */
                        ParameterSet.encode = function encode(message, writer) {
                            if (!writer)
                                writer = $Writer.create();
                            if (message.keys != null && message.keys.length)
                                for (let i = 0; i < message.keys.length; ++i)
                                    writer.uint32(/* id 1, wireType 2 =*/10).string(message.keys[i]);
                            if (message.values != null && message.values.length)
                                for (let i = 0; i < message.values.length; ++i)
                                    $root.org.eclipse.tahu.protobuf.Payload.ParameterValue.encode(message.values[i], writer.uint32(/* id 2, wireType 2 =*/18).fork()).ldelim();
                            return writer;
                        };

                        /**
                         * Encodes the specified ParameterSet message, length delimited. Does not implicitly {@link org.eclipse.tahu.protobuf.Payload.ParameterSet.verify|verify} messages.
                         * @function encodeDelimited
                         * @memberof org.eclipse.tahu.protobuf.Payload.ParameterSet
                         * @static
                         * @param {org.eclipse.tahu.protobuf.Payload.IParameterSet} message ParameterSet message or plain object to encode
                         * @param {$protobuf.Writer} [writer] Writer to encode to
                         * @returns {$protobuf.Writer} Writer
                         */
                        ParameterSet.encodeDelimited = function encodeDelimited(message, writer) {
                            return this.encode(message, writer).ldelim();
                        };

                        /**
                         * Decodes a ParameterSet message from the specified reader or buffer.
                         * @function decode
                         * @memberof org.eclipse.tahu.protobuf.Payload.ParameterSet
                         * @static
                         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                         * @param {number} [length] Message length if known beforehand
                         * @returns {org.eclipse.tahu.protobuf.Payload.ParameterSet} ParameterSet
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        ParameterSet.decode = function decode(reader, length, error) {
                            if (!(reader instanceof $Reader))
                                reader = $Reader.create(reader);
                            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.org.eclipse.tahu.protobuf.Payload.ParameterSet();
                            while (reader.pos < end) {
                                let tag = reader.uint32();
                                if (tag === error)
                                    break;
                                switch (tag >>> 3) {
                                case 1: {
                                        if (!(message.keys && message.keys.length))
                                            message.keys = [];
                                        message.keys.push(reader.string());
                                        break;
                                    }
                                case 2: {
                                        if (!(message.values && message.values.length))
                                            message.values = [];
                                        message.values.push($root.org.eclipse.tahu.protobuf.Payload.ParameterValue.decode(reader, reader.uint32()));
                                        break;
                                    }
                                default:
                                    reader.skipType(tag & 7);
                                    break;
                                }
                            }
                            return message;
                        };

                        /**
                         * Decodes a ParameterSet message from the specified reader or buffer, length delimited.
                         * @function decodeDelimited
                         * @memberof org.eclipse.tahu.protobuf.Payload.ParameterSet
                         * @static
                         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                         * @returns {org.eclipse.tahu.protobuf.Payload.ParameterSet} ParameterSet
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        ParameterSet.decodeDelimited = function decodeDelimited(reader) {
                            if (!(reader instanceof $Reader))
                                reader = new $Reader(reader);
                            return this.decode(reader, reader.uint32());
                        };

                        /**
                         * Creates a ParameterSet message from a plain object. Also converts values to their respective internal types.
                         * @function fromObject
                         * @memberof org.eclipse.tahu.protobuf.Payload.ParameterSet
                         * @static
                         * @param {Object.<string,*>} object Plain object
                         * @returns {org.eclipse.tahu.protobuf.Payload.ParameterSet} ParameterSet
                         */
                        ParameterSet.fromObject = function fromObject(object) {
                            if (object instanceof $root.org.eclipse.tahu.protobuf.Payload.ParameterSet)
                                return object;
                            let message = new $root.org.eclipse.tahu.protobuf.Payload.ParameterSet();
                            if (object.keys) {
                                if (!Array.isArray(object.keys))
                                    throw TypeError(".org.eclipse.tahu.protobuf.Payload.ParameterSet.keys: array expected");
                                message.keys = [];
                                for (let i = 0; i < object.keys.length; ++i)
                                    message.keys[i] = String(object.keys[i]);
                            }
                            if (object.values) {
                                if (!Array.isArray(object.values))
                                    throw TypeError(".org.eclipse.tahu.protobuf.Payload.ParameterSet.values: array expected");
                                message.values = [];
                                for (let i = 0; i < object.values.length; ++i) {
                                    if (typeof object.values[i] !== "object")
                                        throw TypeError(".org.eclipse.tahu.protobuf.Payload.ParameterSet.values: object expected");
                                    message.values[i] = $root.org.eclipse.tahu.protobuf.Payload.ParameterValue.fromObject(object.values[i]);
                                }
                            }
                            return message;
                        };

                        /**
                         * Creates a plain object from a ParameterSet message. Also converts values to other types if specified.
                         * @function toObject
                         * @memberof org.eclipse.tahu.protobuf.Payload.ParameterSet
                         * @static
                         * @param {org.eclipse.tahu.protobuf.Payload.ParameterSet} message ParameterSet
                         * @param {$protobuf.IConversionOptions} [options] Conversion options
                         * @returns {Object.<string,*>} Plain object
                         */
                        ParameterSet.toObject = function toObject(message, options) {
                            if (!options)
                                options = {};
                            let object = {};
                            if (options.arrays || options.defaults) {
                                object.keys = [];
                                object.values = [];
                            }
                            if (message.keys && message.keys.length) {
                                object.keys = [];
                                for (let j = 0; j < message.keys.length; ++j)
                                    object.keys[j] = message.keys[j];
                            }
                            if (message.values && message.values.length) {
                                object.values = [];
                                for (let j = 0; j < message.values.length; ++j)
                                    object.values[j] = $root.org.eclipse.tahu.protobuf.Payload.ParameterValue.toObject(message.values[j], options);
                            }
                            return object;
                        };

                        /**
                         * Converts this ParameterSet to JSON.
                         * @function toJSON
                         * @memberof org.eclipse.tahu.protobuf.Payload.ParameterSet
                         * @instance
                         * @returns {Object.<string,*>} JSON object
                         */
                        ParameterSet.prototype.toJSON = function toJSON() {
                            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                        };

                        /**
                         * Gets the default type url for ParameterSet
                         * @function getTypeUrl
                         * @memberof org.eclipse.tahu.protobuf.Payload.ParameterSet
                         * @static
                         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                         * @returns {string} The default type url
                         */
                        ParameterSet.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                            if (typeUrlPrefix === undefined) {
                                typeUrlPrefix = "type.googleapis.com";
                            }
                            return typeUrlPrefix + "/org.eclipse.tahu.protobuf.Payload.ParameterSet";
                        };

                        return ParameterSet;
                    })();

                    Payload.ParameterValue = (function() {

                        /**
                         * Properties of a ParameterValue.
                         * @memberof org.eclipse.tahu.protobuf.Payload
                         * @interface IParameterValue
                         * @property {number|null} [type] ParameterValue type
                         * @property {number|null} [intValue] ParameterValue intValue
                         * @property {number|Long|null} [longValue] ParameterValue longValue
                         * @property {number|null} [floatValue] ParameterValue floatValue
                         * @property {number|null} [doubleValue] ParameterValue doubleValue
                         * @property {boolean|null} [booleanValue] ParameterValue booleanValue
                         * @property {string|null} [stringValue] ParameterValue stringValue
                         * @property {org.eclipse.tahu.protobuf.Payload.IPropertySet|null} [extensionValue] ParameterValue extensionValue
                         */

                        /**
                         * Constructs a new ParameterValue.
                         * @memberof org.eclipse.tahu.protobuf.Payload
                         * @classdesc Represents a ParameterValue.
                         * @implements IParameterValue
                         * @constructor
                         * @param {org.eclipse.tahu.protobuf.Payload.IParameterValue=} [properties] Properties to set
                         */
                        function ParameterValue(properties) {
                            if (properties)
                                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                    if (properties[keys[i]] != null)
                                        this[keys[i]] = properties[keys[i]];
                        }

                        /**
                         * ParameterValue type.
                         * @member {number} type
                         * @memberof org.eclipse.tahu.protobuf.Payload.ParameterValue
                         * @instance
                         */
                        ParameterValue.prototype.type = 0;

                        /**
                         * ParameterValue intValue.
                         * @member {number|null|undefined} intValue
                         * @memberof org.eclipse.tahu.protobuf.Payload.ParameterValue
                         * @instance
                         */
                        ParameterValue.prototype.intValue = null;

                        /**
                         * ParameterValue longValue.
                         * @member {number|Long|null|undefined} longValue
                         * @memberof org.eclipse.tahu.protobuf.Payload.ParameterValue
                         * @instance
                         */
                        ParameterValue.prototype.longValue = null;

                        /**
                         * ParameterValue floatValue.
                         * @member {number|null|undefined} floatValue
                         * @memberof org.eclipse.tahu.protobuf.Payload.ParameterValue
                         * @instance
                         */
                        ParameterValue.prototype.floatValue = null;

                        /**
                         * ParameterValue doubleValue.
                         * @member {number|null|undefined} doubleValue
                         * @memberof org.eclipse.tahu.protobuf.Payload.ParameterValue
                         * @instance
                         */
                        ParameterValue.prototype.doubleValue = null;

                        /**
                         * ParameterValue booleanValue.
                         * @member {boolean|null|undefined} booleanValue
                         * @memberof org.eclipse.tahu.protobuf.Payload.ParameterValue
                         * @instance
                         */
                        ParameterValue.prototype.booleanValue = null;

                        /**
                         * ParameterValue stringValue.
                         * @member {string|null|undefined} stringValue
                         * @memberof org.eclipse.tahu.protobuf.Payload.ParameterValue
                         * @instance
                         */
                        ParameterValue.prototype.stringValue = null;

                        /**
                         * ParameterValue extensionValue.
                         * @member {org.eclipse.tahu.protobuf.Payload.IPropertySet|null|undefined} extensionValue
                         * @memberof org.eclipse.tahu.protobuf.Payload.ParameterValue
                         * @instance
                         */
                        ParameterValue.prototype.extensionValue = null;

                        // OneOf field names bound to virtual getters and setters
                        let $oneOfFields;

                        /**
                         * ParameterValue value.
                         * @member {"intValue"|"longValue"|"floatValue"|"doubleValue"|"booleanValue"|"stringValue"|"extensionValue"|undefined} value
                         * @memberof org.eclipse.tahu.protobuf.Payload.ParameterValue
                         * @instance
                         */
                        Object.defineProperty(ParameterValue.prototype, "value", {
                            get: $util.oneOfGetter($oneOfFields = ["intValue", "longValue", "floatValue", "doubleValue", "booleanValue", "stringValue", "extensionValue"]),
                            set: $util.oneOfSetter($oneOfFields)
                        });

                        /**
                         * Creates a new ParameterValue instance using the specified properties.
                         * @function create
                         * @memberof org.eclipse.tahu.protobuf.Payload.ParameterValue
                         * @static
                         * @param {org.eclipse.tahu.protobuf.Payload.IParameterValue=} [properties] Properties to set
                         * @returns {org.eclipse.tahu.protobuf.Payload.ParameterValue} ParameterValue instance
                         */
                        ParameterValue.create = function create(properties) {
                            return new ParameterValue(properties);
                        };

                        /**
                         * Encodes the specified ParameterValue message. Does not implicitly {@link org.eclipse.tahu.protobuf.Payload.ParameterValue.verify|verify} messages.
                         * @function encode
                         * @memberof org.eclipse.tahu.protobuf.Payload.ParameterValue
                         * @static
                         * @param {org.eclipse.tahu.protobuf.Payload.IParameterValue} message ParameterValue message or plain object to encode
                         * @param {$protobuf.Writer} [writer] Writer to encode to
                         * @returns {$protobuf.Writer} Writer
                         */
                        ParameterValue.encode = function encode(message, writer) {
                            if (!writer)
                                writer = $Writer.create();
                            if (message.type != null && Object.hasOwnProperty.call(message, "type"))
                                writer.uint32(/* id 1, wireType 0 =*/8).uint32(message.type);
                            if (message.intValue != null && Object.hasOwnProperty.call(message, "intValue"))
                                writer.uint32(/* id 2, wireType 0 =*/16).uint32(message.intValue);
                            if (message.longValue != null && Object.hasOwnProperty.call(message, "longValue"))
                                writer.uint32(/* id 3, wireType 0 =*/24).uint64(message.longValue);
                            if (message.floatValue != null && Object.hasOwnProperty.call(message, "floatValue"))
                                writer.uint32(/* id 4, wireType 5 =*/37).float(message.floatValue);
                            if (message.doubleValue != null && Object.hasOwnProperty.call(message, "doubleValue"))
                                writer.uint32(/* id 5, wireType 1 =*/41).double(message.doubleValue);
                            if (message.booleanValue != null && Object.hasOwnProperty.call(message, "booleanValue"))
                                writer.uint32(/* id 6, wireType 0 =*/48).bool(message.booleanValue);
                            if (message.stringValue != null && Object.hasOwnProperty.call(message, "stringValue"))
                                writer.uint32(/* id 7, wireType 2 =*/58).string(message.stringValue);
                            if (message.extensionValue != null && Object.hasOwnProperty.call(message, "extensionValue"))
                                $root.org.eclipse.tahu.protobuf.Payload.PropertySet.encode(message.extensionValue, writer.uint32(/* id 8, wireType 2 =*/66).fork()).ldelim();
                            return writer;
                        };

                        /**
                         * Encodes the specified ParameterValue message, length delimited. Does not implicitly {@link org.eclipse.tahu.protobuf.Payload.ParameterValue.verify|verify} messages.
                         * @function encodeDelimited
                         * @memberof org.eclipse.tahu.protobuf.Payload.ParameterValue
                         * @static
                         * @param {org.eclipse.tahu.protobuf.Payload.IParameterValue} message ParameterValue message or plain object to encode
                         * @param {$protobuf.Writer} [writer] Writer to encode to
                         * @returns {$protobuf.Writer} Writer
                         */
                        ParameterValue.encodeDelimited = function encodeDelimited(message, writer) {
                            return this.encode(message, writer).ldelim();
                        };

                        /**
                         * Decodes a ParameterValue message from the specified reader or buffer.
                         * @function decode
                         * @memberof org.eclipse.tahu.protobuf.Payload.ParameterValue
                         * @static
                         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                         * @param {number} [length] Message length if known beforehand
                         * @returns {org.eclipse.tahu.protobuf.Payload.ParameterValue} ParameterValue
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        ParameterValue.decode = function decode(reader, length, error) {
                            if (!(reader instanceof $Reader))
                                reader = $Reader.create(reader);
                            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.org.eclipse.tahu.protobuf.Payload.ParameterValue();
                            while (reader.pos < end) {
                                let tag = reader.uint32();
                                if (tag === error)
                                    break;
                                switch (tag >>> 3) {
                                case 1: {
                                        message.type = reader.uint32();
                                        break;
                                    }
                                case 2: {
                                        message.intValue = reader.uint32();
                                        break;
                                    }
                                case 3: {
                                        message.longValue = reader.uint64();
                                        break;
                                    }
                                case 4: {
                                        message.floatValue = reader.float();
                                        break;
                                    }
                                case 5: {
                                        message.doubleValue = reader.double();
                                        break;
                                    }
                                case 6: {
                                        message.booleanValue = reader.bool();
                                        break;
                                    }
                                case 7: {
                                        message.stringValue = reader.string();
                                        break;
                                    }
                                case 8: {
                                        message.extensionValue = $root.org.eclipse.tahu.protobuf.Payload.PropertySet.decode(reader, reader.uint32());
                                        break;
                                    }
                                default:
                                    reader.skipType(tag & 7);
                                    break;
                                }
                            }
                            return message;
                        };

                        /**
                         * Decodes a ParameterValue message from the specified reader or buffer, length delimited.
                         * @function decodeDelimited
                         * @memberof org.eclipse.tahu.protobuf.Payload.ParameterValue
                         * @static
                         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                         * @returns {org.eclipse.tahu.protobuf.Payload.ParameterValue} ParameterValue
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        ParameterValue.decodeDelimited = function decodeDelimited(reader) {
                            if (!(reader instanceof $Reader))
                                reader = new $Reader(reader);
                            return this.decode(reader, reader.uint32());
                        };

                        /**
                         * Creates a ParameterValue message from a plain object. Also converts values to their respective internal types.
                         * @function fromObject
                         * @memberof org.eclipse.tahu.protobuf.Payload.ParameterValue
                         * @static
                         * @param {Object.<string,*>} object Plain object
                         * @returns {org.eclipse.tahu.protobuf.Payload.ParameterValue} ParameterValue
                         */
                        ParameterValue.fromObject = function fromObject(object) {
                            if (object instanceof $root.org.eclipse.tahu.protobuf.Payload.ParameterValue)
                                return object;
                            let message = new $root.org.eclipse.tahu.protobuf.Payload.ParameterValue();
                            if (object.type != null)
                                message.type = object.type >>> 0;
                            if (object.intValue != null)
                                message.intValue = object.intValue >>> 0;
                            if (object.longValue != null)
                                if ($util.Long)
                                    (message.longValue = $util.Long.fromValue(object.longValue)).unsigned = true;
                                else if (typeof object.longValue === "string")
                                    message.longValue = parseInt(object.longValue, 10);
                                else if (typeof object.longValue === "number")
                                    message.longValue = object.longValue;
                                else if (typeof object.longValue === "object")
                                    message.longValue = new $util.LongBits(object.longValue.low >>> 0, object.longValue.high >>> 0).toNumber(true);
                            if (object.floatValue != null)
                                message.floatValue = Number(object.floatValue);
                            if (object.doubleValue != null)
                                message.doubleValue = Number(object.doubleValue);
                            if (object.booleanValue != null)
                                message.booleanValue = Boolean(object.booleanValue);
                            if (object.stringValue != null)
                                message.stringValue = String(object.stringValue);
                            if (object.extensionValue != null) {
                                if (typeof object.extensionValue !== "object")
                                    throw TypeError(".org.eclipse.tahu.protobuf.Payload.ParameterValue.extensionValue: object expected");
                                message.extensionValue = $root.org.eclipse.tahu.protobuf.Payload.PropertySet.fromObject(object.extensionValue);
                            }
                            return message;
                        };

                        /**
                         * Creates a plain object from a ParameterValue message. Also converts values to other types if specified.
                         * @function toObject
                         * @memberof org.eclipse.tahu.protobuf.Payload.ParameterValue
                         * @static
                         * @param {org.eclipse.tahu.protobuf.Payload.ParameterValue} message ParameterValue
                         * @param {$protobuf.IConversionOptions} [options] Conversion options
                         * @returns {Object.<string,*>} Plain object
                         */
                        ParameterValue.toObject = function toObject(message, options) {
                            if (!options)
                                options = {};
                            let object = {};
                            if (options.defaults)
                                object.type = 0;
                            if (message.type != null && message.hasOwnProperty("type"))
                                object.type = message.type;
                            if (message.intValue != null && message.hasOwnProperty("intValue")) {
                                object.intValue = message.intValue;
                                if (options.oneofs)
                                    object.value = "intValue";
                            }
                            if (message.longValue != null && message.hasOwnProperty("longValue")) {
                                if (typeof message.longValue === "number")
                                    object.longValue = options.longs === String ? String(message.longValue) : message.longValue;
                                else
                                    object.longValue = options.longs === String ? $util.Long.prototype.toString.call(message.longValue) : options.longs === Number ? new $util.LongBits(message.longValue.low >>> 0, message.longValue.high >>> 0).toNumber(true) : message.longValue;
                                if (options.oneofs)
                                    object.value = "longValue";
                            }
                            if (message.floatValue != null && message.hasOwnProperty("floatValue")) {
                                object.floatValue = options.json && !isFinite(message.floatValue) ? String(message.floatValue) : message.floatValue;
                                if (options.oneofs)
                                    object.value = "floatValue";
                            }
                            if (message.doubleValue != null && message.hasOwnProperty("doubleValue")) {
                                object.doubleValue = options.json && !isFinite(message.doubleValue) ? String(message.doubleValue) : message.doubleValue;
                                if (options.oneofs)
                                    object.value = "doubleValue";
                            }
                            if (message.booleanValue != null && message.hasOwnProperty("booleanValue")) {
                                object.booleanValue = message.booleanValue;
                                if (options.oneofs)
                                    object.value = "booleanValue";
                            }
                            if (message.stringValue != null && message.hasOwnProperty("stringValue")) {
                                object.stringValue = message.stringValue;
                                if (options.oneofs)
                                    object.value = "stringValue";
                            }
                            if (message.extensionValue != null && message.hasOwnProperty("extensionValue")) {
                                object.extensionValue = $root.org.eclipse.tahu.protobuf.Payload.PropertySet.toObject(message.extensionValue, options);
                                if (options.oneofs)
                                    object.value = "extensionValue";
                            }
                            return object;
                        };

                        /**
                         * Converts this ParameterValue to JSON.
                         * @function toJSON
                         * @memberof org.eclipse.tahu.protobuf.Payload.ParameterValue
                         * @instance
                         * @returns {Object.<string,*>} JSON object
                         */
                        ParameterValue.prototype.toJSON = function toJSON() {
                            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                        };

                        /**
                         * Gets the default type url for ParameterValue
                         * @function getTypeUrl
                         * @memberof org.eclipse.tahu.protobuf.Payload.ParameterValue
                         * @static
                         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                         * @returns {string} The default type url
                         */
                        ParameterValue.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                            if (typeUrlPrefix === undefined) {
                                typeUrlPrefix = "type.googleapis.com";
                            }
                            return typeUrlPrefix + "/org.eclipse.tahu.protobuf.Payload.ParameterValue";
                        };

                        return ParameterValue;
                    })();

                    return Payload;
                })();

                return protobuf;
            })();

            return tahu;
        })();

        return eclipse;
    })();

    return org;
})();

export { $root as default };
