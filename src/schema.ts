/**
 * JSON Schema definition for the event superschema
 * 
 * This schema defines the common structure for all event messages,
 * ensuring interoperability across microservices.
 */
export const superSchema = {
  type: "object",
  properties: {
    id: { 
      type: "string", 
      format: "uuid" 
    },
    type: { 
      type: "string" 
    },
    metadata: {
      type: "object",
      properties: {
        cid: { 
          type: "string", 
          format: "uuid" 
        },
        tid: { 
          type: "string", 
          format: "uuid" 
        },
        pid: { 
          type: "string", 
          format: "uuid" 
        },
        uid: { 
          type: "string", 
          format: "uuid" 
        },
        token: { 
          type: "string" 
        }
      },
      required: ["cid", "pid"]
    },
    data: { 
      type: "object" 
    }
  },
  required: ["id", "type", "metadata"]
} as const;
