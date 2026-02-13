# Entity Relationship Diagram (ERD) & System Architecture

This document outlines the data model and architectural flows for the TaughtCode Server, emphasizing the "State-Driven" architecture required for the backend-only article generator using BullMQ.

## 1. Core Data Model (State-Driven)

In this system, the **Job** entity is central to tracking the asynchronous lifecycle of AI content generation. The `Job` table acts as the source of truth for the process, decoupling the generation logic from the final `Article` schema.

```mermaid
erDiagram
    ORGANIZATION {
        string id PK
        string name
        string ownerId FK "Admin User"
        string status
        timestamp created_at
    }

    USER {
        string uid PK "Firebase UID"
        string email UK
        string displayName
        string organizationId FK
        string role "user/admin"
        string authProvider "firebase/oauth"
    }

    API_KEY {
        string id PK
        string key_hash
        string name
        string userId FK
        string scopes "read/write/admin"
        timestamp last_used_at
        timestamp expires_at
    }

    ARTICLE_TEMPLATE {
        string id PK
        string name
        string structure "JSON"
        string aiInstructions
        string authorId FK
    }

    ARTICLE {
        string id PK
        string title
        text content "HTML/Markdown"
        enum status "draft/published/archived"
        string authorId FK
        string templateId FK
        timestamp created_at
        timestamp updated_at
    }

    JOB {
        string id PK
        string type "article_generation"
        enum status "queued/processing/completed/failed"
        string bullmq_job_id UK "Redis ID"
        jsonb data "Input Payload"
        jsonb result "LLM Response"
        text error_log
        string userId FK
        string articleId FK "Target Article"
        int attempt_count
        timestamp created_at
        timestamp started_at
        timestamp finished_at
    }

    ORGANIZATION ||--o{ USER : "employs"
    USER ||--o{ ARTICLE : "authors"
    USER ||--o{ JOB : "initiates"
    USER ||--o{ ARTICLE_TEMPLATE : "creates"
    USER ||--o{ API_KEY : "owns"
    
    ARTICLE_TEMPLATE ||--o{ ARTICLE : "structures"
    ARTICLE ||--o{ JOB : "generated_by"
```

## 2. Authentication Architecture

The system supports dual authentication strategies: **User Interactive (OAuth/Firebase)** and **Machine-to-Machine (API Keys)**.

```mermaid
flowchart TD
    subgraph Clients
        Web[Web Client]
        CLI[CLI Tool / External Service]
    end

    subgraph AuthLayer [Authentication Layer]
        AuthMiddleware[Auth Middleware]
        FirebaseAuth[Firebase Auth]
        APIKeyAuth[API Key Strategy]
    end

    subgraph UserData
        UserDB[(User Collection)]
        KeyDB[(API Keys Collection)]
    end

    Web -->|Bearer Token JWT| AuthMiddleware
    CLI -->|x-api-key Header| AuthMiddleware

    AuthMiddleware -->|Verify JWT| FirebaseAuth
    AuthMiddleware -->|Hash & Compare| APIKeyAuth

    FirebaseAuth -->|Get User Profile| UserDB
    APIKeyAuth -->|Validate Key & Scopes| KeyDB
    APIKeyAuth -->|Get Linked User| UserDB

    UserDB -->|Attach User Context| RequestContext[Request Context]
```

## 3. Provider System Pattern

We use a **Provider Pattern** to abstract external dependencies (AI, Storage, Auth), allowing for easy switching of vendors without changing business logic.

```mermaid
classDiagram
    ProviderRegistry o-- BaseProvider
    BaseProvider <|-- AIProvider
    BaseProvider <|-- StorageProvider
    AIProvider <|-- GeminiProvider
    AIProvider <|-- OpenAIProvider
    StorageProvider <|-- FirebaseStorageProvider

    note for ProviderRegistry "Central point for dependency injection"

    class ProviderRegistry {
        +register(name, instance)
        +get(name)
        +setDefault(name)
    }

    class BaseProvider {
        <<interface>>
        +initialize(config)
        +validateConfig()
    }

    class AIProvider {
        <<interface>>
        +generateText(prompt)
        +generateImage(prompt)
    }

    class GeminiProvider {
        +generateText(prompt)
        +generateImage(prompt)
    }

    class OpenAIProvider {
        +generateText(prompt)
        +generateImage(prompt)
    }

    class StorageProvider {
        <<interface>>
        +uploadFile(file)
        +getSignedUrl(path)
    }

    class FirebaseStorageProvider {
        +uploadFile(file)
    }
```

## 4. Job Processing & Service Workers

The **BullMQ** architecture ensures reliability for long-running AI tasks. It separates the API (Producer) from the background processing (Consumer).

```mermaid
sequenceDiagram
    participant Client
    participant API as API Server
    participant DB as Database (Firestore)
    participant Queue as Redis Queue (BullMQ)
    participant Worker as Job Worker
    participant AI as AI Provider

    Client->>API: POST /jobs/create (Article Gen)
    API->>DB: Create Job Record (status: queued)
    API->>Queue: Add Job to Queue (jobId, payload)
    API-->>Client: Return Job ID (202 Accepted)

    loop Polling / Webhook
        Client->>API: GET /jobs/:id
        API-->>Client: Job Status
    end

    Queue->>Worker: Process Job (event)
    activate Worker
    Worker->>DB: Update Job (status: processing, started_at)
    
    Worker->>AI: Generate Content (Prompt + Context)
    AI-->>Worker: Content Response
    
    alt Success
        Worker->>DB: Create Article Draft
        Worker->>DB: Update Job (status: completed, result, finished_at)
    else Failure
        Worker->>DB: Update Job (status: failed, error_log)
    end
    deactivate Worker
```

## 5. System Data Flow

A high-level view of how a user request flows through the entire system.

```mermaid
flowchart LR
    subgraph Frontend
        User[User Interaction]
    end

    subgraph "API Layer"
        Router[Express Router]
        Auth[Auth Middleware]
        Controller[Job Controller]
    end

    subgraph "Service Layer"
        JobService[Job Service]
        AIService[AI Service]
    end

    subgraph "Infrastructure"
        Redis[(Redis Queue)]
        Firestore[(Firestore DB)]
        Worker[Background Worker]
    end

    User -->|Request| Router
    Router --> Auth
    Auth -->|Validated| Controller
    Controller -->|Create Job| JobService
    
    JobService -->|Persist State| Firestore
    JobService -->|Enqueue| Redis
    
    Redis -->|Dequeue| Worker
    Worker -->|Execute Logic| AIService
    AIService -->|Call External API| ExternalAI[Gemini/OpenAI]
    
    Worker -->|Update State| Firestore
    Worker -->|Save Result| Firestore
```
