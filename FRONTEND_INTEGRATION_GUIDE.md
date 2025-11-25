# Blog API - Frontend Integration Guide for AI

> Tài liệu này được viết để AI có thể hiểu và tích hợp Blog API vào Frontend

## 🎯 Mục đích

Hướng dẫn tích hợp 2 API chính:
1. **Upload Image API** - Upload ảnh khi người dùng chèn ảnh vào editor
2. **Create Blog API** - Tạo blog post với toàn bộ nội dung

## 📡 API Endpoints

### Base URL
```
http://localhost:3002
```

### Endpoints
- `POST /blog/upload-image` - Upload ảnh
- `POST /blog` - Tạo blog post

---

## 1️⃣ Upload Image API

### Mục đích
Khi người dùng đang viết blog và chèn ảnh vào editor (CKEditor, TinyMCE, Quill, etc.), gọi API này để upload ảnh lên server.

### Endpoint
```
POST /blog/upload-image
```

### Request Format
- **Content-Type:** `multipart/form-data`
- **Field name:** `file`
- **Allowed types:** JPEG, PNG, GIF, WebP

### Request Example (JavaScript/TypeScript)

#### Vanilla JavaScript
```javascript
async function uploadImage(file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('http://localhost:3002/blog/upload-image', {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    throw new Error('Upload failed');
  }

  const data = await response.json();
  return data;
}

// Usage
const fileInput = document.querySelector('input[type="file"]');
const file = fileInput.files[0];
const result = await uploadImage(file);
console.log(result);
// {
//   "imageId": "image-abc123xyz",
//   "url": "http://res.cloudinary.com/.../image.jpg",
//   "secureUrl": "https://res.cloudinary.com/.../image.jpg"
// }
```

#### Axios
```javascript
import axios from 'axios';

async function uploadImage(file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await axios.post(
    'http://localhost:3002/blog/upload-image',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }
  );

  return response.data;
}
```

#### Vue 3 Composition API
```vue
<script setup>
import { ref } from 'vue';
import axios from 'axios';

const uploading = ref(false);

async function handleImageUpload(file) {
  uploading.value = true;
  
  try {
    const formData = new FormData();
    formData.append('file', file);

    const { data } = await axios.post(
      'http://localhost:3002/blog/upload-image',
      formData
    );

    console.log('Image uploaded:', data.imageId);
    return data;
  } catch (error) {
    console.error('Upload failed:', error);
    throw error;
  } finally {
    uploading.value = false;
  }
}
</script>
```

#### React
```jsx
import { useState } from 'react';
import axios from 'axios';

function useImageUpload() {
  const [uploading, setUploading] = useState(false);

  const uploadImage = async (file) => {
    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);

      const { data } = await axios.post(
        'http://localhost:3002/blog/upload-image',
        formData
      );

      return data;
    } catch (error) {
      console.error('Upload failed:', error);
      throw error;
    } finally {
      setUploading(false);
    }
  };

  return { uploadImage, uploading };
}
```

### Response Format

#### Success (201 Created)
```json
{
  "imageId": "image-abc123xyz",
  "url": "http://res.cloudinary.com/your-cloud/image/upload/v1234567890/abc123xyz.jpg",
  "secureUrl": "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/abc123xyz.jpg"
}
```

#### Error (400 Bad Request)
```json
{
  "statusCode": 400,
  "message": "No file uploaded"
}
```

```json
{
  "statusCode": 400,
  "message": "Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed"
}
```

### Important Notes
- **Lưu `imageId`** để sử dụng trong content của blog
- **Sử dụng `secureUrl`** nếu muốn hiển thị preview ảnh
- **Validate file** ở frontend trước khi upload (size, type)

---

## 2️⃣ Create Blog API

### Mục đích
Tạo blog post mới với toàn bộ nội dung, bao gồm các ảnh đã upload.

### Endpoint
```
POST /blog
```

### Request Format
- **Content-Type:** `application/json`

### Request Body Schema

```typescript
interface CreateBlogRequest {
  name: string;              // Tên blog (required)
  lang: string;              // Ngôn ngữ: "vi", "en", etc. (required)
  thumbnail: string;         // Image ID từ upload API (required)
  shortDescription: string;  // Mô tả ngắn (required)
  content: string;           // HTML content (required)
  tags: string[];            // Mảng tags (required)
  numWords: number;          // Số từ trong bài viết (required)
  status: "waiting" | "published" | "draft";  // Trạng thái (required)
}
```

### Field Descriptions

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `name` | string | ✅ | Tên/tiêu đề blog | "Hướng dẫn du lịch Việt Nam" |
| `lang` | string | ✅ | Mã ngôn ngữ | "vi", "en" |
| `thumbnail` | string | ✅ | Image ID từ upload API | "image-abc123" |
| `shortDescription` | string | ✅ | Mô tả ngắn cho SEO/preview | "Khám phá Việt Nam..." |
| `content` | string | ✅ | HTML content của blog | `"<p>Content...</p>"` |
| `tags` | string[] | ✅ | Mảng các tag | `["du lịch", "xe máy"]` |
| `numWords` | number | ✅ | Số từ trong bài viết | 150 |
| `status` | string | ✅ | Trạng thái: waiting/published/draft | "waiting" |

### Request Example

#### Full Example
```json
{
  "name": "Hướng dẫn du lịch Việt Nam bằng xe máy",
  "lang": "vi",
  "thumbnail": "image-j_muyWVa",
  "shortDescription": "Khám phá Việt Nam trên chiếc xe máy của bạn với những lời khuyên hữu ích từ các chuyên gia",
  "content": "<h2>Du lịch Việt Nam bằng xe máy</h2><p>Việt Nam là một đất nước tuyệt vời để khám phá bằng xe máy.</p><h3>Lời khuyên an toàn:</h3><ul><li>Luôn đội mũ bảo hiểm</li><li>Kiểm tra xe trước khi đi</li><li>Mang theo bản đồ</li></ul><figure class=\"image\"><img src=\"image-BIZu3Aad\"></figure><p>Chúc bạn có chuyến đi vui vẻ!</p>",
  "tags": ["du lịch", "xe máy", "việt nam", "hướng dẫn"],
  "numWords": 50,
  "status": "waiting"
}
```

#### JavaScript/TypeScript
```javascript
async function createBlog(blogData) {
  const response = await fetch('http://localhost:3002/blog', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(blogData)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }

  const data = await response.json();
  return data;
}

// Usage
const blogData = {
  name: "My Blog Title",
  lang: "vi",
  thumbnail: "image-abc123",  // From upload API
  shortDescription: "Short description here",
  content: "<p>Blog content with <img src='image-xyz789'></p>",
  tags: ["tag1", "tag2"],
  numWords: 100,
  status: "waiting"
};

const result = await createBlog(blogData);
console.log('Blog created:', result.id);
```

#### Axios
```javascript
import axios from 'axios';

async function createBlog(blogData) {
  const response = await axios.post(
    'http://localhost:3002/blog',
    blogData
  );
  return response.data;
}
```

#### Vue 3 Composition API
```vue
<script setup>
import { ref } from 'vue';
import axios from 'axios';

const creating = ref(false);

async function handleCreateBlog(formData) {
  creating.value = true;
  
  try {
    const blogData = {
      name: formData.title,
      lang: formData.language,
      thumbnail: formData.thumbnailImageId,
      shortDescription: formData.description,
      content: formData.htmlContent,
      tags: formData.tags,
      numWords: countWords(formData.htmlContent),
      status: formData.status
    };

    const { data } = await axios.post(
      'http://localhost:3002/blog',
      blogData
    );

    console.log('Blog created successfully:', data.id);
    return data;
  } catch (error) {
    console.error('Failed to create blog:', error);
    throw error;
  } finally {
    creating.value = false;
  }
}

function countWords(html) {
  const text = html.replace(/<[^>]*>/g, '');
  return text.trim().split(/\s+/).length;
}
</script>
```

#### React
```jsx
import { useState } from 'react';
import axios from 'axios';

function useBlogCreation() {
  const [creating, setCreating] = useState(false);

  const createBlog = async (formData) => {
    setCreating(true);
    
    try {
      const blogData = {
        name: formData.title,
        lang: formData.language,
        thumbnail: formData.thumbnailImageId,
        shortDescription: formData.description,
        content: formData.htmlContent,
        tags: formData.tags,
        numWords: countWords(formData.htmlContent),
        status: formData.status
      };

      const { data } = await axios.post(
        'http://localhost:3002/blog',
        blogData
      );

      return data;
    } catch (error) {
      console.error('Failed to create blog:', error);
      throw error;
    } finally {
      setCreating(false);
    }
  };

  const countWords = (html) => {
    const text = html.replace(/<[^>]*>/g, '');
    return text.trim().split(/\s+/).length;
  };

  return { createBlog, creating };
}
```

### Response Format

#### Success (201 Created)
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Hướng dẫn du lịch Việt Nam bằng xe máy",
  "slug": "huong-dan-du-lich-viet-nam-bang-xe-may",
  "lang": "vi",
  "thumbnail": "image-j_muyWVa",
  "shortDescription": "Khám phá Việt Nam...",
  "content": "<h2>Du lịch Việt Nam...</h2>",
  "tags": ["du lịch", "xe máy", "việt nam"],
  "numWords": 50,
  "status": "waiting",
  "category": null,
  "author_name": null,
  "created_at": "2025-11-25T15:56:10.000Z"
}
```

#### Error (400 Bad Request) - Validation Error
```json
{
  "statusCode": 400,
  "message": [
    "name should not be empty",
    "lang should not be empty",
    "status must be one of the following values: waiting, published, draft"
  ],
  "error": "Bad Request"
}
```

#### Error (409 Conflict) - Duplicate Name
```json
{
  "statusCode": 409,
  "message": "Blog with this name already exists",
  "error": "Conflict"
}
```

---

## 🔄 Complete Workflow: Frontend Integration

### Scenario: User creates a blog with images

```javascript
// Step 1: Setup state
const blogForm = {
  title: '',
  language: 'vi',
  thumbnailImageId: '',
  description: '',
  htmlContent: '',
  tags: [],
  status: 'draft'
};

// Step 2: User selects thumbnail image
async function handleThumbnailUpload(file) {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch('http://localhost:3002/blog/upload-image', {
      method: 'POST',
      body: formData
    });
    
    const data = await response.json();
    
    // Save imageId for thumbnail
    blogForm.thumbnailImageId = data.imageId;
    
    // Optional: Show preview
    showThumbnailPreview(data.secureUrl);
  } catch (error) {
    console.error('Thumbnail upload failed:', error);
  }
}

// Step 3: User inserts images in content (CKEditor example)
async function handleContentImageUpload(file) {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch('http://localhost:3002/blog/upload-image', {
      method: 'POST',
      body: formData
    });
    
    const data = await response.json();
    
    // Insert image into editor using imageId
    // CKEditor will use this in img src
    return {
      default: data.secureUrl,  // For preview
      imageId: data.imageId      // For saving
    };
  } catch (error) {
    console.error('Content image upload failed:', error);
  }
}

// Step 4: User fills in form
blogForm.title = "Hướng dẫn du lịch Việt Nam";
blogForm.description = "Khám phá Việt Nam...";
blogForm.htmlContent = "<p>Content with images...</p>";
blogForm.tags = ["du lịch", "xe máy"];

// Step 5: Submit blog
async function handleSubmit() {
  try {
    // Count words
    const text = blogForm.htmlContent.replace(/<[^>]*>/g, '');
    const numWords = text.trim().split(/\s+/).length;
    
    // Prepare data
    const blogData = {
      name: blogForm.title,
      lang: blogForm.language,
      thumbnail: blogForm.thumbnailImageId,
      shortDescription: blogForm.description,
      content: blogForm.htmlContent,
      tags: blogForm.tags,
      numWords: numWords,
      status: blogForm.status
    };
    
    // Create blog
    const response = await fetch('http://localhost:3002/blog', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(blogData)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }
    
    const result = await response.json();
    
    console.log('Blog created successfully!');
    console.log('Blog ID:', result.id);
    console.log('Blog Slug:', result.slug);
    
    // Redirect to blog page
    window.location.href = `/blog/${result.slug}`;
  } catch (error) {
    console.error('Failed to create blog:', error);
    alert('Failed to create blog: ' + error.message);
  }
}
```

---

## 🎨 Rich Text Editor Integration

### CKEditor 5 Integration

```javascript
import { ClassicEditor } from '@ckeditor/ckeditor5-editor-classic';
import { Essentials } from '@ckeditor/ckeditor5-essentials';
import { Image, ImageUpload } from '@ckeditor/ckeditor5-image';

class UploadAdapter {
  constructor(loader) {
    this.loader = loader;
  }

  upload() {
    return this.loader.file.then(file => {
      return new Promise(async (resolve, reject) => {
        try {
          const formData = new FormData();
          formData.append('file', file);

          const response = await fetch('http://localhost:3002/blog/upload-image', {
            method: 'POST',
            body: formData
          });

          const data = await response.json();

          resolve({
            default: data.secureUrl,
            imageId: data.imageId
          });
        } catch (error) {
          reject(error);
        }
      });
    });
  }
}

function uploadAdapterPlugin(editor) {
  editor.plugins.get('FileRepository').createUploadAdapter = (loader) => {
    return new UploadAdapter(loader);
  };
}

// Initialize editor
ClassicEditor.create(document.querySelector('#editor'), {
  plugins: [Essentials, Image, ImageUpload],
  extraPlugins: [uploadAdapterPlugin]
});
```

### TinyMCE Integration

```javascript
tinymce.init({
  selector: '#editor',
  plugins: 'image',
  images_upload_handler: async (blobInfo, progress) => {
    const formData = new FormData();
    formData.append('file', blobInfo.blob(), blobInfo.filename());

    const response = await fetch('http://localhost:3002/blog/upload-image', {
      method: 'POST',
      body: formData
    });

    const data = await response.json();
    
    // Return URL for display
    return data.secureUrl;
  }
});
```

### Quill Integration

```javascript
import Quill from 'quill';

const quill = new Quill('#editor', {
  theme: 'snow'
});

// Custom image handler
quill.getModule('toolbar').addHandler('image', () => {
  const input = document.createElement('input');
  input.setAttribute('type', 'file');
  input.setAttribute('accept', 'image/*');
  input.click();

  input.onchange = async () => {
    const file = input.files[0];
    
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('http://localhost:3002/blog/upload-image', {
      method: 'POST',
      body: formData
    });

    const data = await response.json();

    // Insert image into editor
    const range = quill.getSelection();
    quill.insertEmbed(range.index, 'image', data.secureUrl);
  };
});
```

---

## ✅ Validation Rules

### Frontend Validation (Before API Call)

```javascript
function validateBlogForm(formData) {
  const errors = [];

  // Name validation
  if (!formData.title || formData.title.trim() === '') {
    errors.push('Tên blog không được để trống');
  }

  // Language validation
  if (!formData.language) {
    errors.push('Vui lòng chọn ngôn ngữ');
  }

  // Thumbnail validation
  if (!formData.thumbnailImageId) {
    errors.push('Vui lòng upload ảnh thumbnail');
  }

  // Description validation
  if (!formData.description || formData.description.trim() === '') {
    errors.push('Mô tả ngắn không được để trống');
  }

  // Content validation
  if (!formData.htmlContent || formData.htmlContent.trim() === '') {
    errors.push('Nội dung blog không được để trống');
  }

  // Tags validation
  if (!formData.tags || formData.tags.length === 0) {
    errors.push('Vui lòng thêm ít nhất 1 tag');
  }

  // Status validation
  const validStatuses = ['waiting', 'published', 'draft'];
  if (!validStatuses.includes(formData.status)) {
    errors.push('Trạng thái không hợp lệ');
  }

  return errors;
}

// Usage
const errors = validateBlogForm(blogForm);
if (errors.length > 0) {
  alert('Lỗi: ' + errors.join(', '));
  return;
}
```

---

## 🔧 Utility Functions

### Count Words
```javascript
function countWords(html) {
  // Remove HTML tags
  const text = html.replace(/<[^>]*>/g, '');
  // Remove extra whitespace
  const cleaned = text.trim();
  // Split by whitespace and count
  return cleaned.split(/\s+/).filter(word => word.length > 0).length;
}
```

### Generate Tags from Content
```javascript
function extractKeywords(html, maxTags = 5) {
  const text = html.replace(/<[^>]*>/g, '').toLowerCase();
  const words = text.split(/\s+/);
  
  // Count word frequency
  const frequency = {};
  words.forEach(word => {
    if (word.length > 3) {  // Ignore short words
      frequency[word] = (frequency[word] || 0) + 1;
    }
  });
  
  // Sort by frequency and get top N
  return Object.entries(frequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxTags)
    .map(([word]) => word);
}
```

### Replace Image URLs with Image IDs
```javascript
function replaceImageUrls(html, imageMap) {
  // imageMap: { 'https://cloudinary.com/.../abc.jpg': 'image-abc123' }
  let result = html;
  
  Object.entries(imageMap).forEach(([url, imageId]) => {
    result = result.replace(new RegExp(url, 'g'), imageId);
  });
  
  return result;
}
```

---

## 🚨 Error Handling

### Complete Error Handling Example

```javascript
async function createBlogWithErrorHandling(formData) {
  try {
    // 1. Validate form
    const validationErrors = validateBlogForm(formData);
    if (validationErrors.length > 0) {
      throw new Error('Validation failed: ' + validationErrors.join(', '));
    }

    // 2. Count words
    const numWords = countWords(formData.htmlContent);

    // 3. Prepare data
    const blogData = {
      name: formData.title,
      lang: formData.language,
      thumbnail: formData.thumbnailImageId,
      shortDescription: formData.description,
      content: formData.htmlContent,
      tags: formData.tags,
      numWords: numWords,
      status: formData.status
    };

    // 4. Send request
    const response = await fetch('http://localhost:3002/blog', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(blogData)
    });

    // 5. Handle response
    if (!response.ok) {
      const error = await response.json();
      
      if (response.status === 400) {
        // Validation error from backend
        throw new Error('Dữ liệu không hợp lệ: ' + error.message);
      } else if (response.status === 409) {
        // Duplicate blog name
        throw new Error('Tên blog đã tồn tại, vui lòng chọn tên khác');
      } else {
        throw new Error('Lỗi server: ' + error.message);
      }
    }

    const result = await response.json();
    
    // 6. Success
    return {
      success: true,
      data: result
    };

  } catch (error) {
    console.error('Error creating blog:', error);
    
    return {
      success: false,
      error: error.message
    };
  }
}

// Usage
const result = await createBlogWithErrorHandling(blogForm);

if (result.success) {
  console.log('Blog created:', result.data.id);
  // Redirect or show success message
} else {
  console.error('Failed:', result.error);
  // Show error message to user
  alert(result.error);
}
```

---

## 📝 TypeScript Types

```typescript
// API Types
export interface UploadImageResponse {
  imageId: string;
  url: string;
  secureUrl: string;
}

export interface CreateBlogRequest {
  name: string;
  lang: string;
  thumbnail: string;
  shortDescription: string;
  content: string;
  tags: string[];
  numWords: number;
  status: 'waiting' | 'published' | 'draft';
}

export interface BlogPost {
  id: string;
  name: string;
  slug: string;
  lang: string;
  thumbnail: string;
  shortDescription: string;
  content: string;
  tags: string[];
  numWords: number;
  status: string;
  category: string | null;
  author_name: string | null;
  created_at: string;
}

export interface ApiError {
  statusCode: number;
  message: string | string[];
  error: string;
}

// Service Functions
export async function uploadImage(file: File): Promise<UploadImageResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('http://localhost:3002/blog/upload-image', {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(Array.isArray(error.message) ? error.message.join(', ') : error.message);
  }

  return response.json();
}

export async function createBlog(data: CreateBlogRequest): Promise<BlogPost> {
  const response = await fetch('http://localhost:3002/blog', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(Array.isArray(error.message) ? error.message.join(', ') : error.message);
  }

  return response.json();
}
```

---

## 🎯 Summary for AI

### Key Points to Remember:

1. **Two-step process:**
   - First: Upload images → Get `imageId`
   - Second: Create blog with `imageId` references

2. **Image Upload:**
   - Endpoint: `POST /blog/upload-image`
   - Format: `multipart/form-data`
   - Field: `file`
   - Returns: `{ imageId, url, secureUrl }`

3. **Create Blog:**
   - Endpoint: `POST /blog`
   - Format: `application/json`
   - Required fields: name, lang, thumbnail, shortDescription, content, tags, numWords, status
   - Returns: Complete blog object with `id` and `slug`

4. **Important:**
   - Use `imageId` (not URL) in content and thumbnail
   - Validate data before sending
   - Handle errors properly (400, 409)
   - Count words from HTML content
   - Status must be: "waiting", "published", or "draft"

5. **Workflow:**
   ```
   User uploads thumbnail → Get imageId → Save to form
   User inserts images in editor → Upload each → Get imageId → Insert in HTML
   User fills form → Validate → Count words → Submit
   Backend creates blog → Returns blog with ID and slug
   ```

This guide should help AI understand and implement the blog creation feature correctly! 🚀
