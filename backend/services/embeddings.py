import math
from typing import List

try:
    from sentence_transformers import SentenceTransformer
    HAS_SENTENCE_TRANSFORMERS = True
except ImportError:
    HAS_SENTENCE_TRANSFORMERS = False

class EmbeddingsService:
    def __init__(self):
        self.model = None
        if HAS_SENTENCE_TRANSFORMERS:
            try:
                # Load a small, lightweight model
                self.model = SentenceTransformer('all-MiniLM-L6-v2')
            except Exception:
                self.model = None

    def get_embeddings(self, text: str) -> List[float]:
        """
        Generate embedding vector for a given query or document text.
        """
        if self.model:
            return self.model.encode(text).tolist()
        else:
            # Fallback simple mathematical hash vector representation for offline/lightweight execution
            return self._fallback_hash_embedding(text)

    def calculate_similarity(self, vec1: List[float], vec2: List[float]) -> float:
        """
        Calculate cosine similarity between two vectors.
        """
        if len(vec1) != len(vec2) or not vec1 or not vec2:
            return 0.0
        
        dot_product = sum(a * b for a, b in zip(vec1, vec2))
        norm_a = math.sqrt(sum(a * a for a in vec1))
        norm_b = math.sqrt(sum(b * b for b in vec2))
        
        if norm_a == 0 or norm_b == 0:
            return 0.0
        return dot_product / (norm_a * norm_b)

    def _fallback_hash_embedding(self, text: str, dimensions: int = 128) -> List[float]:
        # Generate a deterministic pseudo-embedding based on character counts and hashes
        vector = [0.0] * dimensions
        words = text.lower().split()
        if not words:
            return vector
            
        for i, word in enumerate(words):
            # Compute a hash of the word
            word_hash = sum(ord(char) * (j + 1) for j, char in enumerate(word))
            index = word_hash % dimensions
            # Distribute weights
            vector[index] += 1.0 + math.sin(i)
            # Add secondary hashing to avoid collisions
            vector[(index * 7) % dimensions] += 0.5
            
        # L2 Normalization
        norm = math.sqrt(sum(v * v for v in vector))
        if norm > 0:
            vector = [v / norm for v in vector]
            
        return vector

embeddings_service = EmbeddingsService()
