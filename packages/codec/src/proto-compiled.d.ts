import * as $protobuf from "protobufjs";
import Long = require("long");
/** Namespace org. */
export namespace org {

    /** Namespace eclipse. */
    namespace eclipse {

        /** Namespace tahu. */
        namespace tahu {

            /** Namespace protobuf. */
            namespace protobuf {

                /** Properties of a Payload. */
                interface IPayload {

                    /** Payload timestamp */
                    timestamp?: (number|Long|null);

                    /** Payload metrics */
                    metrics?: (org.eclipse.tahu.protobuf.Payload.IMetric[]|null);

                    /** Payload seq */
                    seq?: (number|Long|null);

                    /** Payload uuid */
                    uuid?: (string|null);

                    /** Payload body */
                    body?: (Uint8Array|null);
                }

                /** Represents a Payload. */
                class Payload implements IPayload {

                    /**
                     * Constructs a new Payload.
                     * @param [properties] Properties to set
                     */
                    constructor(properties?: org.eclipse.tahu.protobuf.IPayload);

                    /** Payload timestamp. */
                    public timestamp: (number|Long);

                    /** Payload metrics. */
                    public metrics: org.eclipse.tahu.protobuf.Payload.IMetric[];

                    /** Payload seq. */
                    public seq: (number|Long);

                    /** Payload uuid. */
                    public uuid: string;

                    /** Payload body. */
                    public body: Uint8Array;

                    /**
                     * Creates a new Payload instance using the specified properties.
                     * @param [properties] Properties to set
                     * @returns Payload instance
                     */
                    public static create(properties?: org.eclipse.tahu.protobuf.IPayload): org.eclipse.tahu.protobuf.Payload;

                    /**
                     * Encodes the specified Payload message. Does not implicitly {@link org.eclipse.tahu.protobuf.Payload.verify|verify} messages.
                     * @param message Payload message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encode(message: org.eclipse.tahu.protobuf.IPayload, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Encodes the specified Payload message, length delimited. Does not implicitly {@link org.eclipse.tahu.protobuf.Payload.verify|verify} messages.
                     * @param message Payload message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encodeDelimited(message: org.eclipse.tahu.protobuf.IPayload, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Decodes a Payload message from the specified reader or buffer.
                     * @param reader Reader or buffer to decode from
                     * @param [length] Message length if known beforehand
                     * @returns Payload
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): org.eclipse.tahu.protobuf.Payload;

                    /**
                     * Decodes a Payload message from the specified reader or buffer, length delimited.
                     * @param reader Reader or buffer to decode from
                     * @returns Payload
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): org.eclipse.tahu.protobuf.Payload;

                    /**
                     * Creates a Payload message from a plain object. Also converts values to their respective internal types.
                     * @param object Plain object
                     * @returns Payload
                     */
                    public static fromObject(object: { [k: string]: any }): org.eclipse.tahu.protobuf.Payload;

                    /**
                     * Creates a plain object from a Payload message. Also converts values to other types if specified.
                     * @param message Payload
                     * @param [options] Conversion options
                     * @returns Plain object
                     */
                    public static toObject(message: org.eclipse.tahu.protobuf.Payload, options?: $protobuf.IConversionOptions): { [k: string]: any };

                    /**
                     * Converts this Payload to JSON.
                     * @returns JSON object
                     */
                    public toJSON(): { [k: string]: any };

                    /**
                     * Gets the default type url for Payload
                     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                     * @returns The default type url
                     */
                    public static getTypeUrl(typeUrlPrefix?: string): string;
                }

                namespace Payload {

                    /** Properties of a Template. */
                    interface ITemplate {

                        /** Template version */
                        version?: (string|null);

                        /** Template metrics */
                        metrics?: (org.eclipse.tahu.protobuf.Payload.IMetric[]|null);

                        /** Template parameters */
                        parameters?: (org.eclipse.tahu.protobuf.Payload.IParameterSet|null);

                        /** Template templateRef */
                        templateRef?: (string|null);

                        /** Template isDefinition */
                        isDefinition?: (boolean|null);
                    }

                    /** Represents a Template. */
                    class Template implements ITemplate {

                        /**
                         * Constructs a new Template.
                         * @param [properties] Properties to set
                         */
                        constructor(properties?: org.eclipse.tahu.protobuf.Payload.ITemplate);

                        /** Template version. */
                        public version: string;

                        /** Template metrics. */
                        public metrics: org.eclipse.tahu.protobuf.Payload.IMetric[];

                        /** Template parameters. */
                        public parameters?: (org.eclipse.tahu.protobuf.Payload.IParameterSet|null);

                        /** Template templateRef. */
                        public templateRef: string;

                        /** Template isDefinition. */
                        public isDefinition: boolean;

                        /**
                         * Creates a new Template instance using the specified properties.
                         * @param [properties] Properties to set
                         * @returns Template instance
                         */
                        public static create(properties?: org.eclipse.tahu.protobuf.Payload.ITemplate): org.eclipse.tahu.protobuf.Payload.Template;

                        /**
                         * Encodes the specified Template message. Does not implicitly {@link org.eclipse.tahu.protobuf.Payload.Template.verify|verify} messages.
                         * @param message Template message or plain object to encode
                         * @param [writer] Writer to encode to
                         * @returns Writer
                         */
                        public static encode(message: org.eclipse.tahu.protobuf.Payload.ITemplate, writer?: $protobuf.Writer): $protobuf.Writer;

                        /**
                         * Encodes the specified Template message, length delimited. Does not implicitly {@link org.eclipse.tahu.protobuf.Payload.Template.verify|verify} messages.
                         * @param message Template message or plain object to encode
                         * @param [writer] Writer to encode to
                         * @returns Writer
                         */
                        public static encodeDelimited(message: org.eclipse.tahu.protobuf.Payload.ITemplate, writer?: $protobuf.Writer): $protobuf.Writer;

                        /**
                         * Decodes a Template message from the specified reader or buffer.
                         * @param reader Reader or buffer to decode from
                         * @param [length] Message length if known beforehand
                         * @returns Template
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): org.eclipse.tahu.protobuf.Payload.Template;

                        /**
                         * Decodes a Template message from the specified reader or buffer, length delimited.
                         * @param reader Reader or buffer to decode from
                         * @returns Template
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): org.eclipse.tahu.protobuf.Payload.Template;

                        /**
                         * Creates a Template message from a plain object. Also converts values to their respective internal types.
                         * @param object Plain object
                         * @returns Template
                         */
                        public static fromObject(object: { [k: string]: any }): org.eclipse.tahu.protobuf.Payload.Template;

                        /**
                         * Creates a plain object from a Template message. Also converts values to other types if specified.
                         * @param message Template
                         * @param [options] Conversion options
                         * @returns Plain object
                         */
                        public static toObject(message: org.eclipse.tahu.protobuf.Payload.Template, options?: $protobuf.IConversionOptions): { [k: string]: any };

                        /**
                         * Converts this Template to JSON.
                         * @returns JSON object
                         */
                        public toJSON(): { [k: string]: any };

                        /**
                         * Gets the default type url for Template
                         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                         * @returns The default type url
                         */
                        public static getTypeUrl(typeUrlPrefix?: string): string;
                    }

                    /** Properties of a DataSet. */
                    interface IDataSet {

                        /** DataSet numOfColumns */
                        numOfColumns?: (number|Long|null);

                        /** DataSet columns */
                        columns?: (string[]|null);

                        /** DataSet types */
                        types?: (number[]|null);

                        /** DataSet rows */
                        rows?: (org.eclipse.tahu.protobuf.Payload.DataSet.IRow[]|null);
                    }

                    /** Represents a DataSet. */
                    class DataSet implements IDataSet {

                        /**
                         * Constructs a new DataSet.
                         * @param [properties] Properties to set
                         */
                        constructor(properties?: org.eclipse.tahu.protobuf.Payload.IDataSet);

                        /** DataSet numOfColumns. */
                        public numOfColumns: (number|Long);

                        /** DataSet columns. */
                        public columns: string[];

                        /** DataSet types. */
                        public types: number[];

                        /** DataSet rows. */
                        public rows: org.eclipse.tahu.protobuf.Payload.DataSet.IRow[];

                        /**
                         * Creates a new DataSet instance using the specified properties.
                         * @param [properties] Properties to set
                         * @returns DataSet instance
                         */
                        public static create(properties?: org.eclipse.tahu.protobuf.Payload.IDataSet): org.eclipse.tahu.protobuf.Payload.DataSet;

                        /**
                         * Encodes the specified DataSet message. Does not implicitly {@link org.eclipse.tahu.protobuf.Payload.DataSet.verify|verify} messages.
                         * @param message DataSet message or plain object to encode
                         * @param [writer] Writer to encode to
                         * @returns Writer
                         */
                        public static encode(message: org.eclipse.tahu.protobuf.Payload.IDataSet, writer?: $protobuf.Writer): $protobuf.Writer;

                        /**
                         * Encodes the specified DataSet message, length delimited. Does not implicitly {@link org.eclipse.tahu.protobuf.Payload.DataSet.verify|verify} messages.
                         * @param message DataSet message or plain object to encode
                         * @param [writer] Writer to encode to
                         * @returns Writer
                         */
                        public static encodeDelimited(message: org.eclipse.tahu.protobuf.Payload.IDataSet, writer?: $protobuf.Writer): $protobuf.Writer;

                        /**
                         * Decodes a DataSet message from the specified reader or buffer.
                         * @param reader Reader or buffer to decode from
                         * @param [length] Message length if known beforehand
                         * @returns DataSet
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): org.eclipse.tahu.protobuf.Payload.DataSet;

                        /**
                         * Decodes a DataSet message from the specified reader or buffer, length delimited.
                         * @param reader Reader or buffer to decode from
                         * @returns DataSet
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): org.eclipse.tahu.protobuf.Payload.DataSet;

                        /**
                         * Creates a DataSet message from a plain object. Also converts values to their respective internal types.
                         * @param object Plain object
                         * @returns DataSet
                         */
                        public static fromObject(object: { [k: string]: any }): org.eclipse.tahu.protobuf.Payload.DataSet;

                        /**
                         * Creates a plain object from a DataSet message. Also converts values to other types if specified.
                         * @param message DataSet
                         * @param [options] Conversion options
                         * @returns Plain object
                         */
                        public static toObject(message: org.eclipse.tahu.protobuf.Payload.DataSet, options?: $protobuf.IConversionOptions): { [k: string]: any };

                        /**
                         * Converts this DataSet to JSON.
                         * @returns JSON object
                         */
                        public toJSON(): { [k: string]: any };

                        /**
                         * Gets the default type url for DataSet
                         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                         * @returns The default type url
                         */
                        public static getTypeUrl(typeUrlPrefix?: string): string;
                    }

                    namespace DataSet {

                        /** Properties of a Row. */
                        interface IRow {

                            /** Row elements */
                            elements?: (org.eclipse.tahu.protobuf.Payload.DataSet.IDataSetValue[]|null);
                        }

                        /** Represents a Row. */
                        class Row implements IRow {

                            /**
                             * Constructs a new Row.
                             * @param [properties] Properties to set
                             */
                            constructor(properties?: org.eclipse.tahu.protobuf.Payload.DataSet.IRow);

                            /** Row elements. */
                            public elements: org.eclipse.tahu.protobuf.Payload.DataSet.IDataSetValue[];

                            /**
                             * Creates a new Row instance using the specified properties.
                             * @param [properties] Properties to set
                             * @returns Row instance
                             */
                            public static create(properties?: org.eclipse.tahu.protobuf.Payload.DataSet.IRow): org.eclipse.tahu.protobuf.Payload.DataSet.Row;

                            /**
                             * Encodes the specified Row message. Does not implicitly {@link org.eclipse.tahu.protobuf.Payload.DataSet.Row.verify|verify} messages.
                             * @param message Row message or plain object to encode
                             * @param [writer] Writer to encode to
                             * @returns Writer
                             */
                            public static encode(message: org.eclipse.tahu.protobuf.Payload.DataSet.IRow, writer?: $protobuf.Writer): $protobuf.Writer;

                            /**
                             * Encodes the specified Row message, length delimited. Does not implicitly {@link org.eclipse.tahu.protobuf.Payload.DataSet.Row.verify|verify} messages.
                             * @param message Row message or plain object to encode
                             * @param [writer] Writer to encode to
                             * @returns Writer
                             */
                            public static encodeDelimited(message: org.eclipse.tahu.protobuf.Payload.DataSet.IRow, writer?: $protobuf.Writer): $protobuf.Writer;

                            /**
                             * Decodes a Row message from the specified reader or buffer.
                             * @param reader Reader or buffer to decode from
                             * @param [length] Message length if known beforehand
                             * @returns Row
                             * @throws {Error} If the payload is not a reader or valid buffer
                             * @throws {$protobuf.util.ProtocolError} If required fields are missing
                             */
                            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): org.eclipse.tahu.protobuf.Payload.DataSet.Row;

                            /**
                             * Decodes a Row message from the specified reader or buffer, length delimited.
                             * @param reader Reader or buffer to decode from
                             * @returns Row
                             * @throws {Error} If the payload is not a reader or valid buffer
                             * @throws {$protobuf.util.ProtocolError} If required fields are missing
                             */
                            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): org.eclipse.tahu.protobuf.Payload.DataSet.Row;

                            /**
                             * Creates a Row message from a plain object. Also converts values to their respective internal types.
                             * @param object Plain object
                             * @returns Row
                             */
                            public static fromObject(object: { [k: string]: any }): org.eclipse.tahu.protobuf.Payload.DataSet.Row;

                            /**
                             * Creates a plain object from a Row message. Also converts values to other types if specified.
                             * @param message Row
                             * @param [options] Conversion options
                             * @returns Plain object
                             */
                            public static toObject(message: org.eclipse.tahu.protobuf.Payload.DataSet.Row, options?: $protobuf.IConversionOptions): { [k: string]: any };

                            /**
                             * Converts this Row to JSON.
                             * @returns JSON object
                             */
                            public toJSON(): { [k: string]: any };

                            /**
                             * Gets the default type url for Row
                             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                             * @returns The default type url
                             */
                            public static getTypeUrl(typeUrlPrefix?: string): string;
                        }

                        /** Properties of a DataSetValue. */
                        interface IDataSetValue {

                            /** DataSetValue intValue */
                            intValue?: (number|null);

                            /** DataSetValue longValue */
                            longValue?: (number|Long|null);

                            /** DataSetValue floatValue */
                            floatValue?: (number|null);

                            /** DataSetValue doubleValue */
                            doubleValue?: (number|null);

                            /** DataSetValue booleanValue */
                            booleanValue?: (boolean|null);

                            /** DataSetValue stringValue */
                            stringValue?: (string|null);

                            /** DataSetValue extensionValue */
                            extensionValue?: (org.eclipse.tahu.protobuf.Payload.DataSet.IDataSetValue|null);
                        }

                        /** Represents a DataSetValue. */
                        class DataSetValue implements IDataSetValue {

                            /**
                             * Constructs a new DataSetValue.
                             * @param [properties] Properties to set
                             */
                            constructor(properties?: org.eclipse.tahu.protobuf.Payload.DataSet.IDataSetValue);

                            /** DataSetValue intValue. */
                            public intValue?: (number|null);

                            /** DataSetValue longValue. */
                            public longValue?: (number|Long|null);

                            /** DataSetValue floatValue. */
                            public floatValue?: (number|null);

                            /** DataSetValue doubleValue. */
                            public doubleValue?: (number|null);

                            /** DataSetValue booleanValue. */
                            public booleanValue?: (boolean|null);

                            /** DataSetValue stringValue. */
                            public stringValue?: (string|null);

                            /** DataSetValue extensionValue. */
                            public extensionValue?: (org.eclipse.tahu.protobuf.Payload.DataSet.IDataSetValue|null);

                            /** DataSetValue value. */
                            public value?: ("intValue"|"longValue"|"floatValue"|"doubleValue"|"booleanValue"|"stringValue"|"extensionValue");

                            /**
                             * Creates a new DataSetValue instance using the specified properties.
                             * @param [properties] Properties to set
                             * @returns DataSetValue instance
                             */
                            public static create(properties?: org.eclipse.tahu.protobuf.Payload.DataSet.IDataSetValue): org.eclipse.tahu.protobuf.Payload.DataSet.DataSetValue;

                            /**
                             * Encodes the specified DataSetValue message. Does not implicitly {@link org.eclipse.tahu.protobuf.Payload.DataSet.DataSetValue.verify|verify} messages.
                             * @param message DataSetValue message or plain object to encode
                             * @param [writer] Writer to encode to
                             * @returns Writer
                             */
                            public static encode(message: org.eclipse.tahu.protobuf.Payload.DataSet.IDataSetValue, writer?: $protobuf.Writer): $protobuf.Writer;

                            /**
                             * Encodes the specified DataSetValue message, length delimited. Does not implicitly {@link org.eclipse.tahu.protobuf.Payload.DataSet.DataSetValue.verify|verify} messages.
                             * @param message DataSetValue message or plain object to encode
                             * @param [writer] Writer to encode to
                             * @returns Writer
                             */
                            public static encodeDelimited(message: org.eclipse.tahu.protobuf.Payload.DataSet.IDataSetValue, writer?: $protobuf.Writer): $protobuf.Writer;

                            /**
                             * Decodes a DataSetValue message from the specified reader or buffer.
                             * @param reader Reader or buffer to decode from
                             * @param [length] Message length if known beforehand
                             * @returns DataSetValue
                             * @throws {Error} If the payload is not a reader or valid buffer
                             * @throws {$protobuf.util.ProtocolError} If required fields are missing
                             */
                            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): org.eclipse.tahu.protobuf.Payload.DataSet.DataSetValue;

                            /**
                             * Decodes a DataSetValue message from the specified reader or buffer, length delimited.
                             * @param reader Reader or buffer to decode from
                             * @returns DataSetValue
                             * @throws {Error} If the payload is not a reader or valid buffer
                             * @throws {$protobuf.util.ProtocolError} If required fields are missing
                             */
                            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): org.eclipse.tahu.protobuf.Payload.DataSet.DataSetValue;

                            /**
                             * Creates a DataSetValue message from a plain object. Also converts values to their respective internal types.
                             * @param object Plain object
                             * @returns DataSetValue
                             */
                            public static fromObject(object: { [k: string]: any }): org.eclipse.tahu.protobuf.Payload.DataSet.DataSetValue;

                            /**
                             * Creates a plain object from a DataSetValue message. Also converts values to other types if specified.
                             * @param message DataSetValue
                             * @param [options] Conversion options
                             * @returns Plain object
                             */
                            public static toObject(message: org.eclipse.tahu.protobuf.Payload.DataSet.DataSetValue, options?: $protobuf.IConversionOptions): { [k: string]: any };

                            /**
                             * Converts this DataSetValue to JSON.
                             * @returns JSON object
                             */
                            public toJSON(): { [k: string]: any };

                            /**
                             * Gets the default type url for DataSetValue
                             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                             * @returns The default type url
                             */
                            public static getTypeUrl(typeUrlPrefix?: string): string;
                        }
                    }

                    /** Properties of a PropertyValue. */
                    interface IPropertyValue {

                        /** PropertyValue type */
                        type?: (number|null);

                        /** PropertyValue isNull */
                        isNull?: (boolean|null);

                        /** PropertyValue intValue */
                        intValue?: (number|null);

                        /** PropertyValue longValue */
                        longValue?: (number|Long|null);

                        /** PropertyValue floatValue */
                        floatValue?: (number|null);

                        /** PropertyValue doubleValue */
                        doubleValue?: (number|null);

                        /** PropertyValue booleanValue */
                        booleanValue?: (boolean|null);

                        /** PropertyValue stringValue */
                        stringValue?: (string|null);

                        /** PropertyValue propertysetValue */
                        propertysetValue?: (org.eclipse.tahu.protobuf.Payload.IPropertySet|null);

                        /** PropertyValue propertysetsValue */
                        propertysetsValue?: (org.eclipse.tahu.protobuf.Payload.IPropertySetList|null);

                        /** PropertyValue extensionValue */
                        extensionValue?: (Uint8Array|null);
                    }

                    /** Represents a PropertyValue. */
                    class PropertyValue implements IPropertyValue {

                        /**
                         * Constructs a new PropertyValue.
                         * @param [properties] Properties to set
                         */
                        constructor(properties?: org.eclipse.tahu.protobuf.Payload.IPropertyValue);

                        /** PropertyValue type. */
                        public type: number;

                        /** PropertyValue isNull. */
                        public isNull: boolean;

                        /** PropertyValue intValue. */
                        public intValue?: (number|null);

                        /** PropertyValue longValue. */
                        public longValue?: (number|Long|null);

                        /** PropertyValue floatValue. */
                        public floatValue?: (number|null);

                        /** PropertyValue doubleValue. */
                        public doubleValue?: (number|null);

                        /** PropertyValue booleanValue. */
                        public booleanValue?: (boolean|null);

                        /** PropertyValue stringValue. */
                        public stringValue?: (string|null);

                        /** PropertyValue propertysetValue. */
                        public propertysetValue?: (org.eclipse.tahu.protobuf.Payload.IPropertySet|null);

                        /** PropertyValue propertysetsValue. */
                        public propertysetsValue?: (org.eclipse.tahu.protobuf.Payload.IPropertySetList|null);

                        /** PropertyValue extensionValue. */
                        public extensionValue?: (Uint8Array|null);

                        /** PropertyValue value. */
                        public value?: ("intValue"|"longValue"|"floatValue"|"doubleValue"|"booleanValue"|"stringValue"|"propertysetValue"|"propertysetsValue"|"extensionValue");

                        /**
                         * Creates a new PropertyValue instance using the specified properties.
                         * @param [properties] Properties to set
                         * @returns PropertyValue instance
                         */
                        public static create(properties?: org.eclipse.tahu.protobuf.Payload.IPropertyValue): org.eclipse.tahu.protobuf.Payload.PropertyValue;

                        /**
                         * Encodes the specified PropertyValue message. Does not implicitly {@link org.eclipse.tahu.protobuf.Payload.PropertyValue.verify|verify} messages.
                         * @param message PropertyValue message or plain object to encode
                         * @param [writer] Writer to encode to
                         * @returns Writer
                         */
                        public static encode(message: org.eclipse.tahu.protobuf.Payload.IPropertyValue, writer?: $protobuf.Writer): $protobuf.Writer;

                        /**
                         * Encodes the specified PropertyValue message, length delimited. Does not implicitly {@link org.eclipse.tahu.protobuf.Payload.PropertyValue.verify|verify} messages.
                         * @param message PropertyValue message or plain object to encode
                         * @param [writer] Writer to encode to
                         * @returns Writer
                         */
                        public static encodeDelimited(message: org.eclipse.tahu.protobuf.Payload.IPropertyValue, writer?: $protobuf.Writer): $protobuf.Writer;

                        /**
                         * Decodes a PropertyValue message from the specified reader or buffer.
                         * @param reader Reader or buffer to decode from
                         * @param [length] Message length if known beforehand
                         * @returns PropertyValue
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): org.eclipse.tahu.protobuf.Payload.PropertyValue;

                        /**
                         * Decodes a PropertyValue message from the specified reader or buffer, length delimited.
                         * @param reader Reader or buffer to decode from
                         * @returns PropertyValue
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): org.eclipse.tahu.protobuf.Payload.PropertyValue;

                        /**
                         * Creates a PropertyValue message from a plain object. Also converts values to their respective internal types.
                         * @param object Plain object
                         * @returns PropertyValue
                         */
                        public static fromObject(object: { [k: string]: any }): org.eclipse.tahu.protobuf.Payload.PropertyValue;

                        /**
                         * Creates a plain object from a PropertyValue message. Also converts values to other types if specified.
                         * @param message PropertyValue
                         * @param [options] Conversion options
                         * @returns Plain object
                         */
                        public static toObject(message: org.eclipse.tahu.protobuf.Payload.PropertyValue, options?: $protobuf.IConversionOptions): { [k: string]: any };

                        /**
                         * Converts this PropertyValue to JSON.
                         * @returns JSON object
                         */
                        public toJSON(): { [k: string]: any };

                        /**
                         * Gets the default type url for PropertyValue
                         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                         * @returns The default type url
                         */
                        public static getTypeUrl(typeUrlPrefix?: string): string;
                    }

                    /** Properties of a PropertySet. */
                    interface IPropertySet {

                        /** PropertySet keys */
                        keys?: (string[]|null);

                        /** PropertySet values */
                        values?: (org.eclipse.tahu.protobuf.Payload.IPropertyValue[]|null);
                    }

                    /** Represents a PropertySet. */
                    class PropertySet implements IPropertySet {

                        /**
                         * Constructs a new PropertySet.
                         * @param [properties] Properties to set
                         */
                        constructor(properties?: org.eclipse.tahu.protobuf.Payload.IPropertySet);

                        /** PropertySet keys. */
                        public keys: string[];

                        /** PropertySet values. */
                        public values: org.eclipse.tahu.protobuf.Payload.IPropertyValue[];

                        /**
                         * Creates a new PropertySet instance using the specified properties.
                         * @param [properties] Properties to set
                         * @returns PropertySet instance
                         */
                        public static create(properties?: org.eclipse.tahu.protobuf.Payload.IPropertySet): org.eclipse.tahu.protobuf.Payload.PropertySet;

                        /**
                         * Encodes the specified PropertySet message. Does not implicitly {@link org.eclipse.tahu.protobuf.Payload.PropertySet.verify|verify} messages.
                         * @param message PropertySet message or plain object to encode
                         * @param [writer] Writer to encode to
                         * @returns Writer
                         */
                        public static encode(message: org.eclipse.tahu.protobuf.Payload.IPropertySet, writer?: $protobuf.Writer): $protobuf.Writer;

                        /**
                         * Encodes the specified PropertySet message, length delimited. Does not implicitly {@link org.eclipse.tahu.protobuf.Payload.PropertySet.verify|verify} messages.
                         * @param message PropertySet message or plain object to encode
                         * @param [writer] Writer to encode to
                         * @returns Writer
                         */
                        public static encodeDelimited(message: org.eclipse.tahu.protobuf.Payload.IPropertySet, writer?: $protobuf.Writer): $protobuf.Writer;

                        /**
                         * Decodes a PropertySet message from the specified reader or buffer.
                         * @param reader Reader or buffer to decode from
                         * @param [length] Message length if known beforehand
                         * @returns PropertySet
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): org.eclipse.tahu.protobuf.Payload.PropertySet;

                        /**
                         * Decodes a PropertySet message from the specified reader or buffer, length delimited.
                         * @param reader Reader or buffer to decode from
                         * @returns PropertySet
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): org.eclipse.tahu.protobuf.Payload.PropertySet;

                        /**
                         * Creates a PropertySet message from a plain object. Also converts values to their respective internal types.
                         * @param object Plain object
                         * @returns PropertySet
                         */
                        public static fromObject(object: { [k: string]: any }): org.eclipse.tahu.protobuf.Payload.PropertySet;

                        /**
                         * Creates a plain object from a PropertySet message. Also converts values to other types if specified.
                         * @param message PropertySet
                         * @param [options] Conversion options
                         * @returns Plain object
                         */
                        public static toObject(message: org.eclipse.tahu.protobuf.Payload.PropertySet, options?: $protobuf.IConversionOptions): { [k: string]: any };

                        /**
                         * Converts this PropertySet to JSON.
                         * @returns JSON object
                         */
                        public toJSON(): { [k: string]: any };

                        /**
                         * Gets the default type url for PropertySet
                         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                         * @returns The default type url
                         */
                        public static getTypeUrl(typeUrlPrefix?: string): string;
                    }

                    /** Properties of a PropertySetList. */
                    interface IPropertySetList {

                        /** PropertySetList propertyset */
                        propertyset?: (org.eclipse.tahu.protobuf.Payload.IPropertySet[]|null);
                    }

                    /** Represents a PropertySetList. */
                    class PropertySetList implements IPropertySetList {

                        /**
                         * Constructs a new PropertySetList.
                         * @param [properties] Properties to set
                         */
                        constructor(properties?: org.eclipse.tahu.protobuf.Payload.IPropertySetList);

                        /** PropertySetList propertyset. */
                        public propertyset: org.eclipse.tahu.protobuf.Payload.IPropertySet[];

                        /**
                         * Creates a new PropertySetList instance using the specified properties.
                         * @param [properties] Properties to set
                         * @returns PropertySetList instance
                         */
                        public static create(properties?: org.eclipse.tahu.protobuf.Payload.IPropertySetList): org.eclipse.tahu.protobuf.Payload.PropertySetList;

                        /**
                         * Encodes the specified PropertySetList message. Does not implicitly {@link org.eclipse.tahu.protobuf.Payload.PropertySetList.verify|verify} messages.
                         * @param message PropertySetList message or plain object to encode
                         * @param [writer] Writer to encode to
                         * @returns Writer
                         */
                        public static encode(message: org.eclipse.tahu.protobuf.Payload.IPropertySetList, writer?: $protobuf.Writer): $protobuf.Writer;

                        /**
                         * Encodes the specified PropertySetList message, length delimited. Does not implicitly {@link org.eclipse.tahu.protobuf.Payload.PropertySetList.verify|verify} messages.
                         * @param message PropertySetList message or plain object to encode
                         * @param [writer] Writer to encode to
                         * @returns Writer
                         */
                        public static encodeDelimited(message: org.eclipse.tahu.protobuf.Payload.IPropertySetList, writer?: $protobuf.Writer): $protobuf.Writer;

                        /**
                         * Decodes a PropertySetList message from the specified reader or buffer.
                         * @param reader Reader or buffer to decode from
                         * @param [length] Message length if known beforehand
                         * @returns PropertySetList
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): org.eclipse.tahu.protobuf.Payload.PropertySetList;

                        /**
                         * Decodes a PropertySetList message from the specified reader or buffer, length delimited.
                         * @param reader Reader or buffer to decode from
                         * @returns PropertySetList
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): org.eclipse.tahu.protobuf.Payload.PropertySetList;

                        /**
                         * Creates a PropertySetList message from a plain object. Also converts values to their respective internal types.
                         * @param object Plain object
                         * @returns PropertySetList
                         */
                        public static fromObject(object: { [k: string]: any }): org.eclipse.tahu.protobuf.Payload.PropertySetList;

                        /**
                         * Creates a plain object from a PropertySetList message. Also converts values to other types if specified.
                         * @param message PropertySetList
                         * @param [options] Conversion options
                         * @returns Plain object
                         */
                        public static toObject(message: org.eclipse.tahu.protobuf.Payload.PropertySetList, options?: $protobuf.IConversionOptions): { [k: string]: any };

                        /**
                         * Converts this PropertySetList to JSON.
                         * @returns JSON object
                         */
                        public toJSON(): { [k: string]: any };

                        /**
                         * Gets the default type url for PropertySetList
                         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                         * @returns The default type url
                         */
                        public static getTypeUrl(typeUrlPrefix?: string): string;
                    }

                    /** Properties of a MetaData. */
                    interface IMetaData {

                        /** MetaData isMultiPart */
                        isMultiPart?: (boolean|null);

                        /** MetaData contentType */
                        contentType?: (string|null);

                        /** MetaData size */
                        size?: (number|Long|null);

                        /** MetaData seq */
                        seq?: (number|Long|null);

                        /** MetaData fileName */
                        fileName?: (string|null);

                        /** MetaData fileType */
                        fileType?: (string|null);

                        /** MetaData md5 */
                        md5?: (string|null);

                        /** MetaData description */
                        description?: (string|null);
                    }

                    /** Represents a MetaData. */
                    class MetaData implements IMetaData {

                        /**
                         * Constructs a new MetaData.
                         * @param [properties] Properties to set
                         */
                        constructor(properties?: org.eclipse.tahu.protobuf.Payload.IMetaData);

                        /** MetaData isMultiPart. */
                        public isMultiPart: boolean;

                        /** MetaData contentType. */
                        public contentType: string;

                        /** MetaData size. */
                        public size: (number|Long);

                        /** MetaData seq. */
                        public seq: (number|Long);

                        /** MetaData fileName. */
                        public fileName: string;

                        /** MetaData fileType. */
                        public fileType: string;

                        /** MetaData md5. */
                        public md5: string;

                        /** MetaData description. */
                        public description: string;

                        /**
                         * Creates a new MetaData instance using the specified properties.
                         * @param [properties] Properties to set
                         * @returns MetaData instance
                         */
                        public static create(properties?: org.eclipse.tahu.protobuf.Payload.IMetaData): org.eclipse.tahu.protobuf.Payload.MetaData;

                        /**
                         * Encodes the specified MetaData message. Does not implicitly {@link org.eclipse.tahu.protobuf.Payload.MetaData.verify|verify} messages.
                         * @param message MetaData message or plain object to encode
                         * @param [writer] Writer to encode to
                         * @returns Writer
                         */
                        public static encode(message: org.eclipse.tahu.protobuf.Payload.IMetaData, writer?: $protobuf.Writer): $protobuf.Writer;

                        /**
                         * Encodes the specified MetaData message, length delimited. Does not implicitly {@link org.eclipse.tahu.protobuf.Payload.MetaData.verify|verify} messages.
                         * @param message MetaData message or plain object to encode
                         * @param [writer] Writer to encode to
                         * @returns Writer
                         */
                        public static encodeDelimited(message: org.eclipse.tahu.protobuf.Payload.IMetaData, writer?: $protobuf.Writer): $protobuf.Writer;

                        /**
                         * Decodes a MetaData message from the specified reader or buffer.
                         * @param reader Reader or buffer to decode from
                         * @param [length] Message length if known beforehand
                         * @returns MetaData
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): org.eclipse.tahu.protobuf.Payload.MetaData;

                        /**
                         * Decodes a MetaData message from the specified reader or buffer, length delimited.
                         * @param reader Reader or buffer to decode from
                         * @returns MetaData
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): org.eclipse.tahu.protobuf.Payload.MetaData;

                        /**
                         * Creates a MetaData message from a plain object. Also converts values to their respective internal types.
                         * @param object Plain object
                         * @returns MetaData
                         */
                        public static fromObject(object: { [k: string]: any }): org.eclipse.tahu.protobuf.Payload.MetaData;

                        /**
                         * Creates a plain object from a MetaData message. Also converts values to other types if specified.
                         * @param message MetaData
                         * @param [options] Conversion options
                         * @returns Plain object
                         */
                        public static toObject(message: org.eclipse.tahu.protobuf.Payload.MetaData, options?: $protobuf.IConversionOptions): { [k: string]: any };

                        /**
                         * Converts this MetaData to JSON.
                         * @returns JSON object
                         */
                        public toJSON(): { [k: string]: any };

                        /**
                         * Gets the default type url for MetaData
                         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                         * @returns The default type url
                         */
                        public static getTypeUrl(typeUrlPrefix?: string): string;
                    }

                    /** Properties of a Metric. */
                    interface IMetric {

                        /** Metric name */
                        name?: (string|null);

                        /** Metric alias */
                        alias?: (number|Long|null);

                        /** Metric timestamp */
                        timestamp?: (number|Long|null);

                        /** Metric datatype */
                        datatype?: (number|null);

                        /** Metric isHistorical */
                        isHistorical?: (boolean|null);

                        /** Metric isTransient */
                        isTransient?: (boolean|null);

                        /** Metric isNull */
                        isNull?: (boolean|null);

                        /** Metric metadata */
                        metadata?: (org.eclipse.tahu.protobuf.Payload.IMetaData|null);

                        /** Metric properties */
                        properties?: (org.eclipse.tahu.protobuf.Payload.IPropertySet|null);

                        /** Metric intValue */
                        intValue?: (number|null);

                        /** Metric longValue */
                        longValue?: (number|Long|null);

                        /** Metric floatValue */
                        floatValue?: (number|null);

                        /** Metric doubleValue */
                        doubleValue?: (number|null);

                        /** Metric booleanValue */
                        booleanValue?: (boolean|null);

                        /** Metric stringValue */
                        stringValue?: (string|null);

                        /** Metric bytesValue */
                        bytesValue?: (Uint8Array|null);

                        /** Metric datasetValue */
                        datasetValue?: (org.eclipse.tahu.protobuf.Payload.IDataSet|null);

                        /** Metric templateValue */
                        templateValue?: (org.eclipse.tahu.protobuf.Payload.ITemplate|null);

                        /** Metric extensionValue */
                        extensionValue?: (org.eclipse.tahu.protobuf.Payload.IPropertySet|null);
                    }

                    /** Represents a Metric. */
                    class Metric implements IMetric {

                        /**
                         * Constructs a new Metric.
                         * @param [properties] Properties to set
                         */
                        constructor(properties?: org.eclipse.tahu.protobuf.Payload.IMetric);

                        /** Metric name. */
                        public name: string;

                        /** Metric alias. */
                        public alias: (number|Long);

                        /** Metric timestamp. */
                        public timestamp: (number|Long);

                        /** Metric datatype. */
                        public datatype: number;

                        /** Metric isHistorical. */
                        public isHistorical: boolean;

                        /** Metric isTransient. */
                        public isTransient: boolean;

                        /** Metric isNull. */
                        public isNull: boolean;

                        /** Metric metadata. */
                        public metadata?: (org.eclipse.tahu.protobuf.Payload.IMetaData|null);

                        /** Metric properties. */
                        public properties?: (org.eclipse.tahu.protobuf.Payload.IPropertySet|null);

                        /** Metric intValue. */
                        public intValue?: (number|null);

                        /** Metric longValue. */
                        public longValue?: (number|Long|null);

                        /** Metric floatValue. */
                        public floatValue?: (number|null);

                        /** Metric doubleValue. */
                        public doubleValue?: (number|null);

                        /** Metric booleanValue. */
                        public booleanValue?: (boolean|null);

                        /** Metric stringValue. */
                        public stringValue?: (string|null);

                        /** Metric bytesValue. */
                        public bytesValue?: (Uint8Array|null);

                        /** Metric datasetValue. */
                        public datasetValue?: (org.eclipse.tahu.protobuf.Payload.IDataSet|null);

                        /** Metric templateValue. */
                        public templateValue?: (org.eclipse.tahu.protobuf.Payload.ITemplate|null);

                        /** Metric extensionValue. */
                        public extensionValue?: (org.eclipse.tahu.protobuf.Payload.IPropertySet|null);

                        /** Metric value. */
                        public value?: ("intValue"|"longValue"|"floatValue"|"doubleValue"|"booleanValue"|"stringValue"|"bytesValue"|"datasetValue"|"templateValue"|"extensionValue");

                        /**
                         * Creates a new Metric instance using the specified properties.
                         * @param [properties] Properties to set
                         * @returns Metric instance
                         */
                        public static create(properties?: org.eclipse.tahu.protobuf.Payload.IMetric): org.eclipse.tahu.protobuf.Payload.Metric;

                        /**
                         * Encodes the specified Metric message. Does not implicitly {@link org.eclipse.tahu.protobuf.Payload.Metric.verify|verify} messages.
                         * @param message Metric message or plain object to encode
                         * @param [writer] Writer to encode to
                         * @returns Writer
                         */
                        public static encode(message: org.eclipse.tahu.protobuf.Payload.IMetric, writer?: $protobuf.Writer): $protobuf.Writer;

                        /**
                         * Encodes the specified Metric message, length delimited. Does not implicitly {@link org.eclipse.tahu.protobuf.Payload.Metric.verify|verify} messages.
                         * @param message Metric message or plain object to encode
                         * @param [writer] Writer to encode to
                         * @returns Writer
                         */
                        public static encodeDelimited(message: org.eclipse.tahu.protobuf.Payload.IMetric, writer?: $protobuf.Writer): $protobuf.Writer;

                        /**
                         * Decodes a Metric message from the specified reader or buffer.
                         * @param reader Reader or buffer to decode from
                         * @param [length] Message length if known beforehand
                         * @returns Metric
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): org.eclipse.tahu.protobuf.Payload.Metric;

                        /**
                         * Decodes a Metric message from the specified reader or buffer, length delimited.
                         * @param reader Reader or buffer to decode from
                         * @returns Metric
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): org.eclipse.tahu.protobuf.Payload.Metric;

                        /**
                         * Creates a Metric message from a plain object. Also converts values to their respective internal types.
                         * @param object Plain object
                         * @returns Metric
                         */
                        public static fromObject(object: { [k: string]: any }): org.eclipse.tahu.protobuf.Payload.Metric;

                        /**
                         * Creates a plain object from a Metric message. Also converts values to other types if specified.
                         * @param message Metric
                         * @param [options] Conversion options
                         * @returns Plain object
                         */
                        public static toObject(message: org.eclipse.tahu.protobuf.Payload.Metric, options?: $protobuf.IConversionOptions): { [k: string]: any };

                        /**
                         * Converts this Metric to JSON.
                         * @returns JSON object
                         */
                        public toJSON(): { [k: string]: any };

                        /**
                         * Gets the default type url for Metric
                         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                         * @returns The default type url
                         */
                        public static getTypeUrl(typeUrlPrefix?: string): string;
                    }

                    /** Properties of a ParameterSet. */
                    interface IParameterSet {

                        /** ParameterSet keys */
                        keys?: (string[]|null);

                        /** ParameterSet values */
                        values?: (org.eclipse.tahu.protobuf.Payload.IParameterValue[]|null);
                    }

                    /** Represents a ParameterSet. */
                    class ParameterSet implements IParameterSet {

                        /**
                         * Constructs a new ParameterSet.
                         * @param [properties] Properties to set
                         */
                        constructor(properties?: org.eclipse.tahu.protobuf.Payload.IParameterSet);

                        /** ParameterSet keys. */
                        public keys: string[];

                        /** ParameterSet values. */
                        public values: org.eclipse.tahu.protobuf.Payload.IParameterValue[];

                        /**
                         * Creates a new ParameterSet instance using the specified properties.
                         * @param [properties] Properties to set
                         * @returns ParameterSet instance
                         */
                        public static create(properties?: org.eclipse.tahu.protobuf.Payload.IParameterSet): org.eclipse.tahu.protobuf.Payload.ParameterSet;

                        /**
                         * Encodes the specified ParameterSet message. Does not implicitly {@link org.eclipse.tahu.protobuf.Payload.ParameterSet.verify|verify} messages.
                         * @param message ParameterSet message or plain object to encode
                         * @param [writer] Writer to encode to
                         * @returns Writer
                         */
                        public static encode(message: org.eclipse.tahu.protobuf.Payload.IParameterSet, writer?: $protobuf.Writer): $protobuf.Writer;

                        /**
                         * Encodes the specified ParameterSet message, length delimited. Does not implicitly {@link org.eclipse.tahu.protobuf.Payload.ParameterSet.verify|verify} messages.
                         * @param message ParameterSet message or plain object to encode
                         * @param [writer] Writer to encode to
                         * @returns Writer
                         */
                        public static encodeDelimited(message: org.eclipse.tahu.protobuf.Payload.IParameterSet, writer?: $protobuf.Writer): $protobuf.Writer;

                        /**
                         * Decodes a ParameterSet message from the specified reader or buffer.
                         * @param reader Reader or buffer to decode from
                         * @param [length] Message length if known beforehand
                         * @returns ParameterSet
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): org.eclipse.tahu.protobuf.Payload.ParameterSet;

                        /**
                         * Decodes a ParameterSet message from the specified reader or buffer, length delimited.
                         * @param reader Reader or buffer to decode from
                         * @returns ParameterSet
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): org.eclipse.tahu.protobuf.Payload.ParameterSet;

                        /**
                         * Creates a ParameterSet message from a plain object. Also converts values to their respective internal types.
                         * @param object Plain object
                         * @returns ParameterSet
                         */
                        public static fromObject(object: { [k: string]: any }): org.eclipse.tahu.protobuf.Payload.ParameterSet;

                        /**
                         * Creates a plain object from a ParameterSet message. Also converts values to other types if specified.
                         * @param message ParameterSet
                         * @param [options] Conversion options
                         * @returns Plain object
                         */
                        public static toObject(message: org.eclipse.tahu.protobuf.Payload.ParameterSet, options?: $protobuf.IConversionOptions): { [k: string]: any };

                        /**
                         * Converts this ParameterSet to JSON.
                         * @returns JSON object
                         */
                        public toJSON(): { [k: string]: any };

                        /**
                         * Gets the default type url for ParameterSet
                         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                         * @returns The default type url
                         */
                        public static getTypeUrl(typeUrlPrefix?: string): string;
                    }

                    /** Properties of a ParameterValue. */
                    interface IParameterValue {

                        /** ParameterValue type */
                        type?: (number|null);

                        /** ParameterValue intValue */
                        intValue?: (number|null);

                        /** ParameterValue longValue */
                        longValue?: (number|Long|null);

                        /** ParameterValue floatValue */
                        floatValue?: (number|null);

                        /** ParameterValue doubleValue */
                        doubleValue?: (number|null);

                        /** ParameterValue booleanValue */
                        booleanValue?: (boolean|null);

                        /** ParameterValue stringValue */
                        stringValue?: (string|null);

                        /** ParameterValue extensionValue */
                        extensionValue?: (org.eclipse.tahu.protobuf.Payload.IPropertySet|null);
                    }

                    /** Represents a ParameterValue. */
                    class ParameterValue implements IParameterValue {

                        /**
                         * Constructs a new ParameterValue.
                         * @param [properties] Properties to set
                         */
                        constructor(properties?: org.eclipse.tahu.protobuf.Payload.IParameterValue);

                        /** ParameterValue type. */
                        public type: number;

                        /** ParameterValue intValue. */
                        public intValue?: (number|null);

                        /** ParameterValue longValue. */
                        public longValue?: (number|Long|null);

                        /** ParameterValue floatValue. */
                        public floatValue?: (number|null);

                        /** ParameterValue doubleValue. */
                        public doubleValue?: (number|null);

                        /** ParameterValue booleanValue. */
                        public booleanValue?: (boolean|null);

                        /** ParameterValue stringValue. */
                        public stringValue?: (string|null);

                        /** ParameterValue extensionValue. */
                        public extensionValue?: (org.eclipse.tahu.protobuf.Payload.IPropertySet|null);

                        /** ParameterValue value. */
                        public value?: ("intValue"|"longValue"|"floatValue"|"doubleValue"|"booleanValue"|"stringValue"|"extensionValue");

                        /**
                         * Creates a new ParameterValue instance using the specified properties.
                         * @param [properties] Properties to set
                         * @returns ParameterValue instance
                         */
                        public static create(properties?: org.eclipse.tahu.protobuf.Payload.IParameterValue): org.eclipse.tahu.protobuf.Payload.ParameterValue;

                        /**
                         * Encodes the specified ParameterValue message. Does not implicitly {@link org.eclipse.tahu.protobuf.Payload.ParameterValue.verify|verify} messages.
                         * @param message ParameterValue message or plain object to encode
                         * @param [writer] Writer to encode to
                         * @returns Writer
                         */
                        public static encode(message: org.eclipse.tahu.protobuf.Payload.IParameterValue, writer?: $protobuf.Writer): $protobuf.Writer;

                        /**
                         * Encodes the specified ParameterValue message, length delimited. Does not implicitly {@link org.eclipse.tahu.protobuf.Payload.ParameterValue.verify|verify} messages.
                         * @param message ParameterValue message or plain object to encode
                         * @param [writer] Writer to encode to
                         * @returns Writer
                         */
                        public static encodeDelimited(message: org.eclipse.tahu.protobuf.Payload.IParameterValue, writer?: $protobuf.Writer): $protobuf.Writer;

                        /**
                         * Decodes a ParameterValue message from the specified reader or buffer.
                         * @param reader Reader or buffer to decode from
                         * @param [length] Message length if known beforehand
                         * @returns ParameterValue
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): org.eclipse.tahu.protobuf.Payload.ParameterValue;

                        /**
                         * Decodes a ParameterValue message from the specified reader or buffer, length delimited.
                         * @param reader Reader or buffer to decode from
                         * @returns ParameterValue
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): org.eclipse.tahu.protobuf.Payload.ParameterValue;

                        /**
                         * Creates a ParameterValue message from a plain object. Also converts values to their respective internal types.
                         * @param object Plain object
                         * @returns ParameterValue
                         */
                        public static fromObject(object: { [k: string]: any }): org.eclipse.tahu.protobuf.Payload.ParameterValue;

                        /**
                         * Creates a plain object from a ParameterValue message. Also converts values to other types if specified.
                         * @param message ParameterValue
                         * @param [options] Conversion options
                         * @returns Plain object
                         */
                        public static toObject(message: org.eclipse.tahu.protobuf.Payload.ParameterValue, options?: $protobuf.IConversionOptions): { [k: string]: any };

                        /**
                         * Converts this ParameterValue to JSON.
                         * @returns JSON object
                         */
                        public toJSON(): { [k: string]: any };

                        /**
                         * Gets the default type url for ParameterValue
                         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                         * @returns The default type url
                         */
                        public static getTypeUrl(typeUrlPrefix?: string): string;
                    }
                }
            }
        }
    }
}
