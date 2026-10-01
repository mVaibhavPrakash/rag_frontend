# RAG SOP Platform

Document-grounded chat application with a Next.js interface, a Python document processor, and Pinecone for vector retrieval powered by OpenAI or Luna-compatible APIs.

## Quick Start (5 minutes)

Get the application running immediately:

### 1. Install Prerequisites

```bash
# Download and install from:
# - Node.js: https://nodejs.org (v20+)
# - Git: https://git-scm.com
```

### 2. Clone and Setup

```bash
git clone <repository-url>
cd rag

# Setup environment file
cp apps/web/.env apps/web/.env.local

# Edit .env.local and add your keys
# PINECONE_API_KEY=your-pinecone-api-key
# LUNA_API_KEY=your-luna-api-key
# LUNA_BASE_URL=https://api.openai.com/v1
# LUNA_MODEL=gpt-4
# PYTHON_PROCESSOR_URL=http://127.0.0.1:8000
```

### 3. Run All Services (Use 2 terminals)

**Terminal 1 - Document Processor API** (separate project):

Follow the setup instructions in the [Document Processor repository](link-to-processor-repo) to start the API on port 8000.

```bash
# Once processor is running, verify:
curl http://127.0.0.1:8000/health
```

**Terminal 2 - Web App:**

```bash
cd apps/web
npm install
npm run dev
```

### 4. Access Application

Open **<http://localhost:3000>** and start uploading documents!

---

## Prerequisites

- Node.js 20+
- A Pinecone API key and serverless index access
- OpenAI API key or Luna-compatible endpoint access
- Git
- Document Processor API running (see [Document Processor repository](link-to-processor-repo))

### System Requirements

- **Disk Space**: At least 10GB
- **RAM**: Minimum 4GB (8GB recommended)
- **Internet**: Required for API calls to LLM and Pinecone services

## Configure

### Environment Setup

`apps/web/.env` contains the shared local defaults. Create `apps/web/.env.local` for secrets and machine-specific overrides:

```env
PINECONE_API_KEY=your-pinecone-api-key
LUNA_API_KEY=your-luna-api-key
# Override these for your Luna-compatible endpoint and model ID:
LUNA_BASE_URL=https://api.openai.com/v1
LUNA_MODEL=gpt-5.6-luna
```

### Configuration Details

The chat composer uses OpenAI API or a Luna-compatible endpoint for generation. Embeddings are created via the configured LLM service. The provided configuration uses `PYTHON_PROCESSOR_URL=http://127.0.0.1:8000`. The Pinecone index must use `cosine` similarity and appropriate dimensions based on your embedding model (typically 1536 for OpenAI embeddings).

**Optional Environment Variables:**

```env
# LLM Configuration
LUNA_API_KEY=your-api-key
LUNA_BASE_URL=https://api.openai.com/v1
LUNA_MODEL=gpt-4

# Document Processing
PYTHON_PROCESSOR_URL=http://127.0.0.1:8000
MAX_FILE_SIZE=52428800  # 50MB in bytes

# Logging
LOG_LEVEL=info
DEBUG=false
```

## Run Locally

### Step 1: Start Document Processor API

The Document Processor API is a separate project. Follow the setup instructions in the [Document Processor repository](link-to-processor-repo) to start the API on port 8000.

Verify the processor is running:

```bash
curl http://127.0.0.1:8000/health
```

### Step 2: Start the Web Application

In a terminal:

```bash
cd apps/web
npm install
npm run dev
```

The application will be available at `http://localhost:3000`

### Step 3: Verify All Services

Open your browser and check:

1. **Web App**: <http://localhost:3000> (should load the chat interface)
2. **Processor API**: <http://127.0.0.1:8000/docs> (should show FastAPI docs)

## Usage

### Uploading Documents

1. Open <http://localhost:8765>
2. Click "Upload Document"
3. Select a supported document file (PDF, DOCX, TXT, MD)
4. Optionally choose a knowledge-base category
5. Add custom metadata (tags, classification, etc.)
6. Click "Save"

The app will automatically:

- Record source filename, MIME type, and byte size
- Add upload timestamp
- Chunk the document into manageable pieces
- Create embeddings using the configured LLM service
- Upsert vectors to Pinecone

### Chat Interface

1. Navigate to the chat section
2. Type your question related to uploaded documents
3. The system will:
   - Search Pinecone for relevant document chunks
   - Ground the response in retrieved documents
   - Generate a response using OpenAI API or Luna-compatible endpoint

## API Documentation

Access interactive API documentation using Swagger UI or ReDoc:

- **Document Processor API - Swagger UI**: <http://127.0.0.1:8000/docs>
- **Document Processor API - ReDoc**: <http://127.0.0.1:8000/redoc>
- **Web Application API**: <http://localhost:3000/api/docs>

The APIs include automatic OpenAPI documentation with the ability to test endpoints interactively. Use the Swagger UI to explore all available endpoints and their parameters.

## Validate

### Build Web Application

```bash
cd apps/web
npm run build
```

### Type Check

```bash
cd apps/web
npm run type-check
```

## Troubleshooting

### Document Processor API Issues

For issues with the Document Processor API, refer to the [Document Processor repository](link-to-processor-repo) troubleshooting guide.

**Common connection issues:**

```bash
# Verify processor is running
curl http://127.0.0.1:8000/health

# Check PYTHON_PROCESSOR_URL in .env.local
# Default: http://127.0.0.1:8000

# Verify the processor API is accessible
curl http://127.0.0.1:8000/docs
```

### Performance Optimization

**Slow inference?**

```bash
# Verify LLM API is responsive
# Check network connection
# Review API usage and rate limits
```

**High memory usage?**

```bash
# Reduce chunk size in processor
# Process fewer documents
# Increase server memory allocation
```

## Project Structure

### Component Descriptions

| Component | Purpose | Key Responsibility |
| ----------- | --------- | ------------------- |
| **Web App (src)** | React + Vite frontend | Document upload, chat interface, state management, Pinecone integration |
| **Document Processor API** | Separate FastAPI service | Document parsing, chunking, embedding generation (see [processor repo](link-to-processor-repo)) |
| **Local Storage** | documents/ directory | Stores uploaded files and processed metadata locally |
| **Swagger UI** | OpenAPI documentation | Interactive API testing and endpoint exploration |

## Supported Document Formats

The application processes and indexes the following document types:

| Format | Extension | Supported | Max Size | Processing |
| -------- | ----------- | ----------- | ---------- | ------------ |
| **PDF** | `.pdf` | ✅ Yes | 50MB | Text extraction from all pages |
| **Word** | `.docx`, `.doc` | ✅ Yes | 50MB | Full document text extraction |
| **Plain Text** | `.txt` | ✅ Yes | 50MB | Direct text indexing |
| **Markdown** | `.md` | ✅ Yes | 50MB | Preserves formatting and structure |

**File Size Limit**: 50MB per file (configurable via `MAX_FILE_SIZE` environment variable)

**Document Categories**: Documents are organized into 5 predefined categories:

- **General** - Miscellaneous documents
- **Policy** - Policy and compliance documents
- **Product** - Product specifications and documentation
- **Engineering** - Technical architecture and engineering docs
- **Support** - Support guides and FAQs

## Core Features

### 🔍 Retrieval & Search

- **Vector Search**: Fast semantic similarity search powered by Pinecone
- **Chunk Retrieval**: Access individual document chunks with source tracking
- **Relevance Scoring**: Similarity scores for result quality assessment
- **Source Attribution**: Automatic tracking of document sources in responses

### 📄 Document Management

- **Upload & Process**: Automatic chunking and embedding generation
- **Metadata Tagging**: Attach custom key-value metadata to documents
- **Document Organization**: Categorize documents for easy filtering
- **Batch Operations**: Process multiple documents efficiently

### 🤖 RAG Pipeline

- **Document-Grounded Responses**: LLM responses grounded in actual documents
- **Context-Aware Generation**: Relevant document chunks provided as context
- **Multi-Document Search**: Query across multiple documents simultaneously
- **Conversation Context**: Maintain context across multiple queries

### 🔄 Multi-LLM Support

- **OpenAI Integration**: Support for GPT-3.5, GPT-4, and newer models
- **Luna-Compatible APIs**: Use any Luna-compatible LLM endpoint
- **Easy Switching**: Change models via environment configuration
- **Flexible Providers**: Support for multiple LLM providers

### 👨‍💻 Developer Features

- **API-First Architecture**: RESTful API for all operations
- **OpenAPI/Swagger**: Interactive API documentation and testing
- **Type Safety**: Full TypeScript support with strict type checking
- **Hot Reload Development**: Fast development feedback with Vite
- **E2E Testing**: Playwright integration for comprehensive testing

**Browser Support**: Modern browsers with ES2020+ support (Chrome, Firefox, Safari, Edge)

## Technology Stack Summary

### Frontend Framework

- React 19.3.0 - UI library
- Vite 8.3.1 - Build tool with hot module replacement
- TypeScript 7.0.2 - Type-safe development

### UI Components & Icons

- Lucide React - Lightweight icon library
- Cimpress UI - Component library

### API Documentation

- Swagger UI React - Interactive API explorer
- OpenAPI 3.0.0 - Standard specification format

### Backend Integration

- Pinecone - Vector database for semantic search
- OpenAI / Luna APIs - LLM providers
- FastAPI - Document processor (separate service)

### Development & Testing

- ESLint - Code quality analysis
- Prettier - Code formatting
- Playwright - End-to-end testing
- TypeScript - Static type checking

## Development

### Running the Web App with Hot Reload

```bash
cd apps/web
npm run dev
```

### Building for Production

```bash
cd apps/web
npm run build
npm run start
```

For Document Processor API development, refer to the [Document Processor repository](link-to-processor-repo).

## License

[Add your license here]

## Support

For issues and questions:

1. Check the Troubleshooting section above
2. Review the API documentation
3. Check service health endpoints
4. Review service logs
