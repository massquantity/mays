import json
import os
import re
from pathlib import Path
from typing import Any, Optional, Self, cast

import Stemmer
import bm25s
import jieba
from llama_index.core.base.base_retriever import BaseRetriever
from llama_index.core.callbacks.base import CallbackManager
from llama_index.core.constants import DEFAULT_SIMILARITY_TOP_K
from llama_index.core.schema import (
    BaseNode,
    IndexNode,
    NodeWithScore,
    QueryBundle,
    MetadataMode,
)
from llama_index.core.storage.docstore.types import BaseDocumentStore
from llama_index.core.vector_stores.utils import (
    node_to_metadata_dict,
    metadata_dict_to_node,
)


DEFAULT_PERSIST_ARGS = {"similarity_top_k": "similarity_top_k", "_verbose": "verbose"}

DEFAULT_PERSIST_FILENAME = "retriever.json"


class MixedLanguageBM25Retriever(BaseRetriever):
    """Retriever implementing BM25 retrieval for mixed Chinese and English text.

    The retriever can be initialized with an existing BM25 index or will build one
    from the provided document store. Documents are tokenized using language-specific
    approaches, with different handling for Chinese and English segments within the same text.
    """

    def __init__(
        self,
        docstore: Optional[BaseDocumentStore] = None,
        stemmer: Optional[Stemmer.Stemmer] = None,
        existing_bm25: Optional[bm25s.BM25] = None,
        similarity_top_k: int = DEFAULT_SIMILARITY_TOP_K,
        callback_manager: Optional[CallbackManager] = None,
        objects: Optional[list[IndexNode]] = None,
        object_map: Optional[dict] = None,
        verbose: bool = False,
        skip_stemming: bool = False,
        token_pattern: str = r"(?u)\b\w\w+\b",
    ) -> None:
        self.stemmer = stemmer or Stemmer.Stemmer("english")
        self.similarity_top_k = similarity_top_k
        self.token_pattern = token_pattern
        self.skip_stemming = skip_stemming
        self.cn_stopwords = self.load_cn_stopwords()

        if existing_bm25 is not None:
            self.bm25 = existing_bm25
            self.corpus = existing_bm25.corpus
        else:
            nodes = cast(list[BaseNode], list(docstore.docs.values()))
            mixed_corpus_tokens = self._tokenize_mixed_corpus(
                [node.get_content(metadata_mode=MetadataMode.EMBED) for node in nodes],
            )
            self.corpus = [node_to_metadata_dict(node) for node in nodes]
            self.bm25 = bm25s.BM25()
            self.bm25.index(mixed_corpus_tokens, show_progress=verbose)

        super().__init__(
            callback_manager=callback_manager,
            object_map=object_map,
            objects=objects,
            verbose=verbose,
        )

    def _tokenize_mixed_corpus(self, texts: list[str]) -> list[list[str]]:
        """Tokenize a corpus with mixed Chinese and English text."""
        results = []
        for text in texts:
            tokens = self._tokenize_mixed_text(text)
            results.append(tokens)
        return results

    def _tokenize_mixed_text(self, text: str) -> list[str]:
        """
        Tokenize text containing both Chinese and English.
        - Chinese segments are tokenized with jieba
        - English segments are tokenized and stemmed using the original approach
        """
        # noinspection RegExpSimplifiable
        english_pattern = re.compile(r"[a-zA-Z0-9_]+")
        segments = []
        last_end = 0
        for match in english_pattern.finditer(text):
            start, end = match.span()
            if start > last_end:
                segments.append((text[last_end:start], 'zh'))
            segments.append((match.group(), 'en'))
            last_end = end

        # Add any remaining Chinese text
        if last_end < len(text):
            segments.append((text[last_end:], 'zh'))

        all_tokens = []
        for segment_text, lang in segments:
            if lang == 'zh':
                tokens = jieba.cut_for_search(segment_text)
                chinese_tokens = [t for t in tokens if t not in self.cn_stopwords]
                all_tokens.extend(chinese_tokens)
            else:
                english_tokens = bm25s.tokenize(
                    segment_text,
                    stopwords="english",
                    stemmer=self.stemmer if not self.skip_stemming else None,
                    token_pattern=self.token_pattern,
                    return_ids=False,
                )
                # bm25s.tokenize returns a list of lists when given a single string,
                # so we need to extract the inner list.
                if isinstance(english_tokens, list) and len(english_tokens) == 1:
                    english_tokens = english_tokens[0]

                all_tokens.extend(english_tokens)

        return all_tokens

    @staticmethod
    def load_cn_stopwords():
        path = str(Path.cwd().absolute() / "cn_stopwords.txt")
        with open(path, encoding="utf-8") as f:
            chinese_stopwords = set(line.strip() for line in f if line.strip())
        return chinese_stopwords

    def get_persist_args(self) -> dict[str, Any]:
        """Get Persist Args Dict to Save."""
        return {
            DEFAULT_PERSIST_ARGS[key]: getattr(self, key)
            for key in DEFAULT_PERSIST_ARGS
            if hasattr(self, key)
        }

    def persist(self, path: str, **kwargs: Any) -> None:
        """Persist the retriever to a directory."""
        self.bm25.save(path, corpus=self.corpus, **kwargs)
        with open(os.path.join(path, DEFAULT_PERSIST_FILENAME), "w") as f:
            json.dump(self.get_persist_args(), f, indent=2)

    @classmethod
    def from_persist_dir(cls, path: str, **kwargs: Any) -> Self:
        """Load the retriever from a directory."""
        bm25 = bm25s.BM25.load(path, load_corpus=True, **kwargs)
        with open(os.path.join(path, DEFAULT_PERSIST_FILENAME)) as f:
            retriever_data = json.load(f)
        return cls(existing_bm25=bm25, **retriever_data)

    def _retrieve(self, query_bundle: QueryBundle) -> list[NodeWithScore]:
        query = query_bundle.query_str
        tokenized_query = [self._tokenize_mixed_text(query)]
        indexes, scores = self.bm25.retrieve(
            tokenized_query, k=self.similarity_top_k, show_progress=self._verbose
        )

        # batched, but only one query
        indexes = indexes[0]
        scores = scores[0]

        nodes = []
        for idx, score in zip(indexes, scores):
            # idx can be an int or a dict of the node
            if isinstance(idx, dict):
                node = metadata_dict_to_node(idx)
            else:
                node_dict = self.corpus[int(idx)]
                node = metadata_dict_to_node(node_dict)
            nodes.append(NodeWithScore(node=node, score=float(score)))

        return nodes
