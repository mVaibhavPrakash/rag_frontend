# RAG SOP Platform

Document-grounded chat application with a Next.js interface, a Python document processor, Ollama for local models, and Pinecone for vector retrieval.

## Prerequisites

- Node.js 20+
- Python 3.11+
- Ollama running locally
- A Pinecone API key and serverless index access

Pull the local models used by the default configuration:

```bash
ollama pull qwen3:4b
ollama pull nomic-embed-text:v1.5
```

## Configure

`apps/web/.env` contains the shared local defaults. Create `apps/web/.env.local` for secrets and machine-specific overrides:

```env
PINECONE_API_KEY=your-pinecone-api-key
LUNA_API_KEY=your-luna-api-key
# Override these for your Luna-compatible endpoint and model ID:
LUNA_BASE_URL=https://api.openai.com/v1
LUNA_MODEL=gpt-5.6-luna
```

The chat composer can switch generation between Ollama and GPT 5.6 Luna. Embeddings remain on Ollama with `nomic-embed-text:v1.5`. The provided configuration uses `PYTHON_PROCESSOR_URL=http://127.0.0.1:8000`. The Pinecone index must use `cosine` similarity and `768` dimensions for the embedding model.

## Run Locally

Install and start the Python document processor in one terminal:

```bash
cd apps/processor
python -m pip install -r requirements.txt
python -m uvicorn api:app --app-dir src --host 127.0.0.1 --port 8000
```

Start the web app in another terminal:

```bash
cd apps/web
npm install
npm run dev
```

Open `http://localhost:3000`. Upload a supported document, optionally choose its knowledge-base category and add custom metadata, then save it. The app automatically records source filename, MIME type, byte size, upload timestamp, chunks the document, creates embeddings, and upserts the vectors to Pinecone.

## Validate

```bash
cd apps/processor
PYTHONPATH=src python -m unittest discover -s tests -p "test_*.py" -v

cd ../web
npm run build
```

## Structure

- `apps/web`: Next.js UI, API routes, orchestration, retrieval, and Pinecone integration
- `apps/processor`: FastAPI document conversion and chunking service
- `documents`: local document storage
