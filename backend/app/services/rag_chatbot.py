import os
import chromadb
from chromadb.utils import embedding_functions
from groq import Groq
from dotenv import load_dotenv
from pathlib import Path

load_dotenv()

groq_client  = Groq(api_key=os.getenv("GROQ_API_KEY"))
chroma_client = chromadb.PersistentClient(path="./chroma_db")

# use sentence-transformers for embeddings
ef = embedding_functions.SentenceTransformerEmbeddingFunction(
    model_name="all-MiniLM-L6-v2"
)

collection = chroma_client.get_or_create_collection(
    name="vayu_knowledge",
    embedding_function=ef
)

KNOWLEDGE_DIR = Path(__file__).parent.parent / "data" / "knowledge"


def chunk_text(text: str, chunk_size: int = 300, overlap: int = 50) -> list[str]:
    """Split text into overlapping chunks for better retrieval"""
    words  = text.split()
    chunks = []
    i = 0
    while i < len(words):
        chunk = " ".join(words[i:i + chunk_size])
        chunks.append(chunk)
        i += chunk_size - overlap
    return chunks


def seed_knowledge_base():
    """Load all .txt files from knowledge/ into ChromaDB"""
    if collection.count() > 0:
        print(f"ChromaDB already has {collection.count()} chunks — skipping seed")
        return

    all_chunks = []
    all_ids    = []
    all_metas  = []

    for txt_file in KNOWLEDGE_DIR.glob("*.txt"):
        text   = txt_file.read_text(encoding="utf-8")
        chunks = chunk_text(text)
        source = txt_file.stem  # e.g. "who_guidelines"

        for i, chunk in enumerate(chunks):
            all_chunks.append(chunk)
            all_ids.append(f"{source}_{i}")
            all_metas.append({"source": source, "chunk_index": i})

    collection.add(
        documents=all_chunks,
        ids=all_ids,
        metadatas=all_metas
    )
    print(f"Seeded {len(all_chunks)} chunks from {KNOWLEDGE_DIR}")


# seed on startup
seed_knowledge_base()


def detect_language(text: str) -> str:
    tamil_chars = sum(1 for c in text if '\u0B80' <= c <= '\u0BFF')
    return "tamil" if tamil_chars > 2 else "english"


def get_relevant_context(query: str, n_results: int = 4) -> str:
    results = collection.query(
        query_texts=[query],
        n_results=min(n_results, collection.count())
    )
    docs    = results["documents"][0]
    metas   = results["metadatas"][0]
    context_parts = []
    for doc, meta in zip(docs, metas):
        source = meta["source"].replace("_", " ").upper()
        context_parts.append(f"[{source}]\n{doc}")
    return "\n\n".join(context_parts)


def build_system_prompt(stations_context: str, language: str) -> str:
    base = f"""You are Vayu, an AI air quality assistant for Chennai.
You have access to real-time AQI data from 8 monitoring stations across Chennai.
You also have WHO guidelines, CPCB advisories, and TNPCB Chennai-specific data as your knowledge base.

Current Chennai AQI readings:
{stations_context}

Rules:
- Always cite specific AQI values when giving advice
- Mention the source of health guidelines when relevant (WHO/CPCB/TNPCB)
- Be concise — 3-5 sentences max unless asked for detail
- If asked about a specific area, focus on that area's data
- If AQI > 200 anywhere, proactively warn about it"""

    if language == "tamil":
        base += "\n- Respond in Tamil. Use simple Tamil that everyone can understand."
    return base


def chat(
    user_message: str,
    stations_data: list[dict],
    attribution_data: list[dict],
    conversation_history: list[dict] = None
) -> dict:
    if conversation_history is None:
        conversation_history = []

    language = detect_language(user_message)

    # build stations context
    lines = []
    for s in stations_data:
        attr = next((a for a in attribution_data if a["name"] == s["name"]), None)
        line = f"• {s['name']} ({s['area']}): AQI {s['aqi']:.0f} — {s['category']}"
        if attr:
            line += f" | {attr['primary_source']} {attr['primary_pct']}%"
        lines.append(line)
    stations_context = "\n".join(lines)

    # RAG retrieval from real documents
    rag_context = get_relevant_context(user_message)

    messages = [
        {"role": "system", "content": build_system_prompt(stations_context, language)},
        {"role": "system", "content": f"Knowledge base context:\n{rag_context}"},
        *conversation_history[-6:],
        {"role": "user", "content": user_message},
    ]

    response = groq_client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=messages,
        max_tokens=500,
        temperature=0.7,
    )

    reply = response.choices[0].message.content

    # extract which sources were used
    sources = list(set(
        r["source"] for r in
        collection.query(query_texts=[user_message], n_results=4)["metadatas"][0]
    ))

    return {
        "reply":        reply,
        "language":     language,
        "sources_used": sources,
        "rag_chunks":   len(rag_context.split("\n\n")),
    }