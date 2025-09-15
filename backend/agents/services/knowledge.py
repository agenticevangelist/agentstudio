from __future__ import annotations

import os
import zipfile
from typing import Any, Dict, List, Optional, Tuple
from io import BytesIO

from langchain_openai import OpenAIEmbeddings
from pydantic import BaseModel, Field
from langchain_core.tools import tool

try:
    from pypdf import PdfReader  # lightweight PDF text extraction
except Exception:  # pragma: no cover
    PdfReader = None  # type: ignore
try:
    import docx  # python-docx
except Exception:  # pragma: no cover
    docx = None  # type: ignore


# Supabase vector store removed. Replace with a no-op/local placeholder if needed later.
Client = object  # type: ignore

def _get_supabase() -> Client:
    raise RuntimeError("Supabase has been removed; knowledge vector store is disabled")


# -------------------------
# Ingestion (documents only)
# -------------------------


# -------------------------
# Vector index + tools
# -------------------------

_embedding = None
_supabase: Optional[Client] = None
_current_agent_id: Optional[str] = None


def _get_embedding():
    global _embedding
    if _embedding is None:
        _embedding = OpenAIEmbeddings(model=os.getenv("EMBEDDING_MODEL", "text-embedding-3-small"))
    return _embedding


def _get_sb() -> Client:
    global _supabase
    if _supabase is None:
        _supabase = _get_supabase()
    return _supabase


def set_current_agent_id(agent_id: Optional[str]) -> None:
    global _current_agent_id
    _current_agent_id = agent_id


def get_current_agent_id() -> Optional[str]:
    return _current_agent_id


def _get_vector_store():
    raise RuntimeError("Supabase vector store removed")


def _rpc_match_documents(client: Client, embedding: List[float], k: int, filter_obj: Optional[Dict[str, Any]]):
    """Strict RPC call to public.match_documents(query_embedding, match_count, filter)."""
    res = client.rpc(
        "match_documents",
        {"query_embedding": embedding, "match_count": int(k), "filter": filter_obj or None},
    ).execute()
    data = getattr(res, "data", None)
    return data if isinstance(data, list) else []


class KnowledgeCountInput(BaseModel):
    agent_id: Optional[str] = Field(description="Restrict to this agent's documents", default=None)
    tag: Optional[str] = Field(description="Restrict to a specific tag", default=None)


@tool("knowledge-count", args_schema=KnowledgeCountInput)
def knowledge_count(agent_id: Optional[str] = None, tag: Optional[str] = None) -> List[Dict[str, Any]]:
    """Count knowledge documents with optional agent_id and tag filter (Supabase)."""
    if not agent_id:
        agent_id = get_current_agent_id()
    # Disabled due to Supabase removal
    return [{"count": 0}]


class KnowledgeSearchInput(BaseModel):
    query: str = Field(description="Search query text")
    k: Optional[int] = Field(description="Number of results to return", default=4)
    agent_id: Optional[str] = Field(description="Restrict to this agent's documents", default=None)
    tag: Optional[str] = Field(description="Restrict to a specific tag", default=None)


@tool("knowledge-search", args_schema=KnowledgeSearchInput)
def knowledge_search(query: str, k: int = 4, agent_id: Optional[str] = None, tag: Optional[str] = None) -> List[Dict[str, Any]]:
    """Vector search across knowledge documents with optional agent/tag filters (Supabase + LangChain store)."""
    if not agent_id:
        agent_id = get_current_agent_id()
    filter_obj: Dict[str, Any] = {}
    if agent_id:
        filter_obj["agent_id"] = agent_id
    if tag:
        filter_obj["tags"] = [tag]

    # Disabled due to Supabase removal
    return []


# Tools exported for graph binding
KNOWLEDGE_TOOLS = [knowledge_count, knowledge_search]


# Removed legacy CSV ingestion in favor of generic document ingestion.


def ingest_text_documents(agent_id: str, docs: List[Tuple[str, str, Optional[List[str]]]]) -> Dict[str, Any]:
    # Disabled due to Supabase removal
    return {"documents": 0}


def _extract_text_from_pdf(data: bytes) -> str:
    if not PdfReader:
        raise RuntimeError("PDF support requires 'pypdf' package")
    reader = PdfReader(BytesIO(data))
    parts: List[str] = []
    for page in reader.pages:
        try:
            parts.append(page.extract_text() or "")
        except Exception:
            continue
    return "\n".join(p for p in parts if p)


def _extract_text_from_docx(data: bytes) -> str:
    if not docx:
        raise RuntimeError("DOCX support requires 'python-docx' package")
    d = docx.Document(BytesIO(data))
    return "\n".join(p.text for p in d.paragraphs if p.text)


def _extract_text_from_plain(data: bytes) -> str:
    try:
        return data.decode("utf-8", errors="ignore")
    except Exception:
        return ""


def extract_text_from_file(filename: str, content: bytes) -> str:
    name = (filename or "").lower()
    if name.endswith(".pdf"):
        return _extract_text_from_pdf(content)
    if name.endswith(".docx"):
        return _extract_text_from_docx(content)
    # Treat txt, md, csv and others as plain text
    return _extract_text_from_plain(content)


def ingest_document_files(agent_id: str, files: List[Tuple[str, bytes]]) -> Dict[str, Any]:
    docs: List[Tuple[str, str, Optional[List[str]]]] = []
    for fname, data in files:
        if not data:
            continue
        # If zip, expand and collect inner docs
        if zipfile.is_zipfile(BytesIO(data)):
            with zipfile.ZipFile(BytesIO(data)) as zf:
                for inner in zf.namelist():
                    # skip hidden/system files
                    if inner.endswith("/") or inner.startswith("__MACOSX/"):
                        continue
                    try:
                        blob = zf.read(inner)
                    except Exception:
                        continue
                    text = extract_text_from_file(inner, blob)
                    if text.strip():
                        title = inner.split("/")[-1]
                        docs.append((title, text, []))
            continue
        # Regular single file
        text = extract_text_from_file(fname, data)
        if text.strip():
            title = fname.split("/")[-1]
            docs.append((title, text, []))
    if not docs:
        return {"documents": 0}
    return ingest_text_documents(agent_id, docs)


