# API Documentation Endpoints

## 📚 Tổng quan

Backend cung cấp 2 cách để truy cập API documentation:

1. **Swagger UI** (Interactive) - `/api`
2. **JSON Specification** (Programmatic) - `/api-docs-json`

---

## 🌐 Swagger UI (Interactive Documentation)

### URL
```
http://localhost:3001/api
```

### Mục đích
- Xem và test API trực tiếp trên trình duyệt
- Giao diện thân thiện cho developers
- Try-it-out feature để test endpoints

### Sử dụng
1. Mở trình duyệt
2. Truy cập `http://localhost:3002/api`
3. Xem danh sách endpoints
4. Click "Try it out" để test

---

## 📄 JSON API Documentation

### URL
```
http://localhost:3001/api-docs-json
```

### Mục đích
- Lấy toàn bộ API specification dưới dạng JSON
- Sử dụng cho code generation
- Tích hợp với tools (Postman, Insomnia, etc.)
- AI có thể đọc và hiểu API structure

### Response Format
OpenAPI 3.0 Specification (JSON)

### Example Response Structure
```json
{
  "openapi": "3.0.0",
  "info": {
    "title": "Motobike Tours API",
    "description": "The Motobike Tours API description",
    "version": "1.0",
    "contact": {}
  },
  "servers": [
    {
      "url": "http://localhost:3001",
      "description": "Local Development"
    },
    {
      "url": "https://motobikertours-api.vercel.app",
      "description": "Production"
    }
  ],
  "paths": {
    "/blog": {
      "post": {
        "operationId": "BlogController_create",
        "summary": "Create a new blog post",
        "parameters": [],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/CreateBlogDto"
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "Blog post created successfully"
          },
          "400": {
            "description": "Bad request"
          },
          "409": {
            "description": "Blog with this name already exists"
          }
        },
        "tags": ["blog"]
      },
      "get": {
        "operationId": "BlogController_findAll",
        "summary": "Get all blog posts",
        "parameters": [],
        "responses": {
          "200": {
            "description": "Return all blog posts"
          }
        },
        "tags": ["blog"]
      }
    },
    "/blog/upload-image": {
      "post": {
        "operationId": "BlogController_uploadImage",
        "summary": "Upload image for blog content",
        "parameters": [],
        "requestBody": {
          "required": true,
          "content": {
            "multipart/form-data": {
              "schema": {
                "type": "object",
                "properties": {
                  "file": {
                    "type": "string",
                    "format": "binary"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "Image uploaded successfully"
          },
          "400": {
            "description": "No file uploaded or invalid file"
          }
        },
        "tags": ["blog"]
      }
    }
  },
  "components": {
    "schemas": {
      "CreateBlogDto": {
        "type": "object",
        "properties": {
          "name": {
            "type": "string",
            "example": "Digital right managements"
          },
          "lang": {
            "type": "string",
            "example": "vi"
          },
          "thumbnail": {
            "type": "string",
            "example": "image-j_muyWVa"
          },
          "shortDescription": {
            "type": "string",
            "example": "21421412421"
          },
          "content": {
            "type": "string",
            "example": "<p>Content here...</p>"
          },
          "tags": {
            "example": ["2412421"],
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "numWords": {
            "type": "number",
            "example": 9
          },
          "status": {
            "type": "string",
            "enum": ["waiting", "published", "draft"],
            "example": "waiting"
          }
        },
        "required": [
          "name",
          "lang",
          "thumbnail",
          "shortDescription",
          "content",
          "tags",
          "numWords",
          "status"
        ]
      }
    }
  }
}
```

---

## 🔧 Sử dụng JSON Documentation

### 1. Fetch với JavaScript/TypeScript

```javascript
// Lấy API documentation
async function getApiDocs() {
  const response = await fetch('http://localhost:3001/api-docs-json');
  const apiSpec = await response.json();
  
  console.log('API Title:', apiSpec.info.title);
  console.log('API Version:', apiSpec.info.version);
  console.log('Available endpoints:', Object.keys(apiSpec.paths));
  
  return apiSpec;
}

// Sử dụng
const docs = await getApiDocs();
```

### 2. Import vào Postman

**Cách 1: Import từ URL**
1. Mở Postman
2. Click "Import"
3. Chọn tab "Link"
4. Nhập: `http://localhost:3001/api-docs-json`
5. Click "Continue" → "Import"

**Cách 2: Download và import**
```bash
# Download JSON file
curl http://localhost:3001/api-docs-json > api-docs.json

# Sau đó import file vào Postman
```

### 3. Import vào Insomnia

1. Mở Insomnia
2. Click "Create" → "Import From" → "URL"
3. Nhập: `http://localhost:3001/api-docs-json`
4. Click "Fetch and Import"

### 4. Generate Client Code

Sử dụng OpenAPI Generator để tạo client code:

```bash
# Install OpenAPI Generator
npm install -g @openapitools/openapi-generator-cli

# Generate TypeScript Axios client
openapi-generator-cli generate \
  -i http://localhost:3001/api-docs-json \
  -g typescript-axios \
  -o ./generated-client

# Generate Python client
openapi-generator-cli generate \
  -i http://localhost:3001/api-docs-json \
  -g python \
  -o ./python-client
```

### 5. AI Integration

AI có thể đọc và hiểu API structure:

```javascript
// AI reads API documentation
const apiDocs = await fetch('http://localhost:3001/api-docs-json')
  .then(r => r.json());

// AI can now understand:
// - Available endpoints
// - Request/response formats
// - Required fields
// - Validation rules
// - Error responses

// Example: Get all blog endpoints
const blogEndpoints = Object.entries(apiDocs.paths)
  .filter(([path]) => path.startsWith('/blog'))
  .map(([path, methods]) => ({
    path,
    methods: Object.keys(methods)
  }));

console.log('Blog endpoints:', blogEndpoints);
// [
//   { path: '/blog', methods: ['post', 'get'] },
//   { path: '/blog/upload-image', methods: ['post'] },
//   { path: '/blog/{id}', methods: ['get'] }
// ]
```

### 6. Parse API Schema

```javascript
// Extract all DTOs/Schemas
function extractSchemas(apiDocs) {
  return apiDocs.components.schemas;
}

// Extract all endpoints
function extractEndpoints(apiDocs) {
  const endpoints = [];
  
  Object.entries(apiDocs.paths).forEach(([path, methods]) => {
    Object.entries(methods).forEach(([method, details]) => {
      endpoints.push({
        path,
        method: method.toUpperCase(),
        summary: details.summary,
        operationId: details.operationId,
        tags: details.tags,
        requestBody: details.requestBody,
        responses: details.responses
      });
    });
  });
  
  return endpoints;
}

// Usage
const apiDocs = await fetch('http://localhost:3001/api-docs-json')
  .then(r => r.json());

const schemas = extractSchemas(apiDocs);
const endpoints = extractEndpoints(apiDocs);

console.log('Available schemas:', Object.keys(schemas));
console.log('Total endpoints:', endpoints.length);
```

---

## 🚀 Use Cases

### 1. Frontend Code Generation

```bash
# Generate TypeScript types from API
npx openapi-typescript http://localhost:3001/api-docs-json --output ./src/types/api.ts
```

### 2. API Testing

```javascript
// Automated API testing based on spec
import { OpenAPIValidator } from 'express-openapi-validator';

const apiSpec = await fetch('http://localhost:3001/api-docs-json')
  .then(r => r.json());

// Validate requests/responses against spec
const validator = new OpenAPIValidator({
  apiSpec
});
```

### 3. Documentation Website

```javascript
// Generate documentation website
import SwaggerUI from 'swagger-ui-react';

function ApiDocs() {
  return (
    <SwaggerUI url="http://localhost:3001/api-docs-json" />
  );
}
```

### 4. Mock Server

```bash
# Create mock server from API spec
npx @stoplight/prism-cli mock http://localhost:3001/api-docs-json
```

---

## 📊 API Specification Details

### OpenAPI Version
3.0.0

### Specification Format
JSON (JavaScript Object Notation)

### Key Sections

1. **info**: API metadata (title, version, description)
2. **servers**: Available server URLs
3. **paths**: All API endpoints with methods
4. **components**: Reusable schemas (DTOs, models)
5. **security**: Authentication schemes
6. **tags**: Endpoint grouping

### Example: Extract Specific Information

```javascript
const apiDocs = await fetch('http://localhost:3001/api-docs-json')
  .then(r => r.json());

// Get API info
console.log('API Name:', apiDocs.info.title);
console.log('Version:', apiDocs.info.version);

// Get all tags
const tags = [...new Set(
  Object.values(apiDocs.paths)
    .flatMap(methods => Object.values(methods))
    .flatMap(details => details.tags || [])
)];
console.log('Available tags:', tags);

// Get CreateBlogDto schema
const createBlogSchema = apiDocs.components.schemas.CreateBlogDto;
console.log('Required fields:', createBlogSchema.required);
console.log('Properties:', Object.keys(createBlogSchema.properties));
```

---

## 🔐 Production Considerations

### Update Production URL

Khi deploy lên production, cập nhật URL trong `src/main.ts`:

```typescript
const config = new DocumentBuilder()
  .setTitle('Motobike Tours API')
  .setDescription('The Motobike Tours API description')
  .setVersion('1.0')
  .addBearerAuth()
  .addServer('http://localhost:3001', 'Local Development')
  .addServer('https://motobikertours-api.vercel.app', 'Production')  // ← Update this
  .build();
```

### Access in Production

```
https://api.yourdomain.com/api-docs-json
```

### CORS Configuration

Nếu frontend cần access từ domain khác, đảm bảo CORS đã được enable (đã có trong `main.ts`):

```typescript
app.enableCors();
```

---

## 📝 Summary

| Feature | Swagger UI | JSON Docs |
|---------|-----------|-----------|
| URL | `/api` | `/api-docs-json` |
| Format | HTML | JSON |
| Purpose | Interactive testing | Programmatic access |
| Use case | Manual testing | Code generation, AI |
| Human-friendly | ✅ | ❌ |
| Machine-readable | ❌ | ✅ |

### Khi nào dùng gì?

- **Swagger UI (`/api`)**: Khi bạn muốn test API thủ công
- **JSON Docs (`/api-docs-json`)**: Khi bạn muốn:
  - Generate client code
  - Import vào Postman/Insomnia
  - AI đọc và hiểu API
  - Tự động hóa testing
  - Tạo documentation website

---

## 🎯 Quick Start

```bash
# 1. Start server
npm run start:dev

# 2. Access Swagger UI
open http://localhost:3001/api

# 3. Get JSON documentation
curl http://localhost:3001/api-docs-json | jq '.'

# 4. Import to Postman
# Use URL: http://localhost:3001/api-docs-json
```

Bây giờ bạn có thể truy cập toàn bộ API documentation dưới dạng JSON! 🚀
