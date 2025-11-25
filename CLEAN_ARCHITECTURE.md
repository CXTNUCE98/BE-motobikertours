# Clean Architecture - Blog Module

## Tổng quan về Clean Architecture

Clean Architecture là một mô hình kiến trúc phần mềm giúp tách biệt các tầng (layers) của ứng dụng, làm cho code dễ bảo trì, test và mở rộng.

## Cấu trúc Blog Module

```
src/blog/
├── dto/                          # Data Transfer Objects (Presentation Layer)
│   ├── create-blog.dto.ts       # Input validation cho API
│   └── upload-image.dto.ts      # Response format cho upload
│
├── entities/                     # Domain Layer (Business Entities)
│   └── blog-post.entity.ts      # Blog entity với TypeORM
│
├── blog.controller.ts           # Presentation Layer (API Routes)
├── blog.service.ts              # Application/Business Logic Layer
└── blog.module.ts               # Dependency Injection Container
```

## Các tầng trong Clean Architecture

### 1. **Presentation Layer** (Controller + DTOs)
**Files:** `blog.controller.ts`, `dto/*.ts`

**Trách nhiệm:**
- Nhận HTTP requests từ client
- Validate input data (sử dụng DTOs)
- Gọi business logic từ Service layer
- Format response trả về client

**Ví dụ:**
```typescript
@Post()
create(@Body() createBlogDto: CreateBlogDto) {
  return this.blogService.create(createBlogDto);
}
```

**Nguyên tắc:**
- Không chứa business logic
- Chỉ xử lý HTTP-related concerns (request/response)
- Validate input bằng class-validator

### 2. **Application/Business Logic Layer** (Service)
**File:** `blog.service.ts`

**Trách nhiệm:**
- Chứa business logic của ứng dụng
- Xử lý các use cases (create blog, generate slug, etc.)
- Orchestrate giữa các entities và repositories
- Throw business exceptions

**Ví dụ:**
```typescript
async create(createBlogDto: CreateBlogDto): Promise<BlogPost> {
  const slug = this.generateSlug(createBlogDto.name);
  
  // Business rule: slug phải unique
  const existingBlog = await this.blogRepository.findOne({ where: { slug } });
  if (existingBlog) {
    throw new ConflictException('Blog with this name already exists');
  }
  
  return this.blogRepository.save({ ...createBlogDto, slug });
}
```

**Nguyên tắc:**
- Độc lập với framework (có thể test dễ dàng)
- Chứa toàn bộ business rules
- Không biết về HTTP, database implementation details

### 3. **Domain Layer** (Entities)
**File:** `entities/blog-post.entity.ts`

**Trách nhiệm:**
- Định nghĩa business entities
- Chứa domain logic (nếu có)
- Mapping với database schema

**Ví dụ:**
```typescript
@Entity()
export class BlogPost {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;
  
  // ... other fields
}
```

**Nguyên tắc:**
- Pure business objects
- Không phụ thuộc vào infrastructure
- Có thể chứa domain logic methods

### 4. **Infrastructure Layer** (Module + External Services)
**Files:** `blog.module.ts`, `cloudinary/*`

**Trách nhiệm:**
- Dependency injection configuration
- Database connections
- External service integrations (Cloudinary)

**Ví dụ:**
```typescript
@Module({
  imports: [
    TypeOrmModule.forFeature([BlogPost]),
    CloudinaryModule,
  ],
  controllers: [BlogController],
  providers: [BlogService],
})
export class BlogModule {}
```

## Luồng xử lý request (Request Flow)

```
Client Request
    ↓
[Controller] - Nhận request, validate DTO
    ↓
[Service] - Xử lý business logic
    ↓
[Repository] - Tương tác với database
    ↓
[Entity] - Domain object
    ↓
[Repository] - Lưu/lấy data
    ↓
[Service] - Xử lý kết quả
    ↓
[Controller] - Format response
    ↓
Client Response
```

## Ví dụ cụ thể: Create Blog Flow

### 1. Client gửi request
```http
POST /blog
Content-Type: application/json

{
  "name": "My Blog",
  "lang": "vi",
  ...
}
```

### 2. Controller nhận và validate
```typescript
// blog.controller.ts
@Post()
create(@Body() createBlogDto: CreateBlogDto) {
  // CreateBlogDto tự động validate bởi ValidationPipe
  return this.blogService.create(createBlogDto);
}
```

### 3. Service xử lý business logic
```typescript
// blog.service.ts
async create(createBlogDto: CreateBlogDto) {
  // Business logic: tạo slug
  const slug = this.generateSlug(createBlogDto.name);
  
  // Business rule: check duplicate
  const existing = await this.blogRepository.findOne({ where: { slug } });
  if (existing) {
    throw new ConflictException('Duplicate');
  }
  
  // Save to database
  return this.blogRepository.save({ ...createBlogDto, slug });
}
```

### 4. Repository lưu vào database
```typescript
// TypeORM tự động xử lý
this.blogRepository.save(blogPost);
```

### 5. Response trả về client
```json
{
  "id": "uuid",
  "name": "My Blog",
  "slug": "my-blog",
  ...
}
```

## Lợi ích của Clean Architecture

### 1. **Separation of Concerns**
- Mỗi layer có trách nhiệm riêng biệt
- Dễ hiểu, dễ maintain

### 2. **Testability**
```typescript
// Test service mà không cần database thật
describe('BlogService', () => {
  it('should create blog with slug', async () => {
    const mockRepo = {
      findOne: jest.fn().mockResolvedValue(null),
      save: jest.fn().mockResolvedValue(blogPost),
    };
    
    const service = new BlogService(mockRepo);
    const result = await service.create(dto);
    
    expect(result.slug).toBe('expected-slug');
  });
});
```

### 3. **Flexibility**
- Dễ dàng thay đổi database (SQLite → PostgreSQL)
- Dễ dàng thay đổi framework
- Dễ dàng thêm features mới

### 4. **Reusability**
- Business logic có thể reuse cho nhiều controllers
- DTOs có thể reuse cho nhiều endpoints

## Best Practices đã áp dụng

### 1. **DTOs cho Input Validation**
```typescript
export class CreateBlogDto {
  @IsString()
  @IsNotEmpty()
  name: string;
  
  @IsEnum(BlogStatus)
  status: string;
}
```

### 2. **Business Logic trong Service**
```typescript
private generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    // ... Vietnamese character handling
}
```

### 3. **Exception Handling**
```typescript
if (existingBlog) {
  throw new ConflictException('Blog with this name already exists');
}
```

### 4. **Dependency Injection**
```typescript
constructor(
  @InjectRepository(BlogPost)
  private blogRepository: Repository<BlogPost>,
  private cloudinaryService: CloudinaryService,
) {}
```

## Mở rộng trong tương lai

### 1. **Use Cases Pattern**
Tách business logic thành các use cases riêng biệt:
```
src/blog/
├── use-cases/
│   ├── create-blog.use-case.ts
│   ├── upload-image.use-case.ts
│   └── generate-slug.use-case.ts
```

### 2. **Repository Pattern**
Tạo custom repository:
```typescript
// blog.repository.ts
export class BlogRepository extends Repository<BlogPost> {
  async findBySlug(slug: string): Promise<BlogPost> {
    return this.findOne({ where: { slug } });
  }
}
```

### 3. **Domain Events**
```typescript
// Khi blog được tạo, trigger event
this.eventEmitter.emit('blog.created', blogPost);
```

### 4. **CQRS Pattern**
Tách read và write operations:
```
src/blog/
├── commands/
│   └── create-blog.command.ts
├── queries/
│   ├── get-all-blogs.query.ts
│   └── get-blog-by-id.query.ts
```

## Kết luận

Clean Architecture giúp code:
- ✅ Dễ test
- ✅ Dễ maintain
- ✅ Dễ mở rộng
- ✅ Độc lập với framework/database
- ✅ Business logic rõ ràng

Mỗi layer có trách nhiệm riêng và không phụ thuộc vào implementation details của layer khác.
