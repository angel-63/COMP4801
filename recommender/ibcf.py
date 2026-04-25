# import numpy as np
# import pandas as pd
# from sklearn.metrics.pairwise import cosine_similarity
# from typing import List, Dict, Set
# from datetime import datetime

# ACTION_WEIGHTS = {
#     'save': 2,
#     'apply': 3,
#     'explicit_yes': 4,
#     'explicit_no': -2
# }

# def load_interactions_from_db(collection) -> pd.DataFrame:
#     """
#     Fetch all user-job interactions from MongoDB.
#     Returns DataFrame with columns: user_id, job_id, weight.
#     Only actions defined in ACTION_WEIGHTS are kept.
#     """
#     interactions = []
#     for doc in collection.find():
#         action = doc.get('action')
#         if action not in ACTION_WEIGHTS:
#             continue   # skip 'view' and any unknown actions
#         interactions.append({
#             'user_id': doc['user_id'],
#             'job_id': doc['job_id'],
#             'weight': ACTION_WEIGHTS[action]
#         })
#     df = pd.DataFrame(interactions)
#     return df

# # ---------- Item-Item similarity matrix (cached) ----------
# _item_similarity_cache = None
# _job_ids_cache = None
# _last_update = None

# def compute_item_similarity(interactions_df: pd.DataFrame) -> tuple[np.ndarray, List[str]]:
#     """Cosine similarity between jobs based on user interaction vectors."""
#     if interactions_df.empty:
#         return np.array([]), []
#     matrix = interactions_df.pivot_table(
#         index='user_id',
#         columns='job_id',
#         values='weight',
#         fill_value=0
#     )
#     job_ids = matrix.columns.tolist()
#     sim_matrix = cosine_similarity(matrix.T)
#     return sim_matrix, job_ids

# def refresh_similarity_cache(interactions_collection, force=False):
#     """Update the cached item-item similarity matrix."""
#     global _item_similarity_cache, _job_ids_cache, _last_update
#     if not force and _last_update is not None:
#         if (datetime.now(tz=ZoneInfo('Asia/Hong_Kong')) - _last_update).seconds < 300:
#             return
#     df = load_interactions_from_db(interactions_collection)
#     sim_matrix, job_ids = compute_item_similarity(df)
#     _item_similarity_cache = sim_matrix
#     _job_ids_cache = job_ids
#     _last_update = datetime.now(tz=ZoneInfo('Asia/Hong_Kong'))

# def get_similar_jobs(job_id: str, top_n: int = 10) -> List[Dict]:
#     """Return top N jobs similar to given job_id."""
#     if _item_similarity_cache is None or _job_ids_cache is None:
#         return []
#     try:
#         idx = _job_ids_cache.index(job_id)
#     except ValueError:
#         return []
#     sim_scores = list(enumerate(_item_similarity_cache[idx]))
#     sim_scores = sorted(sim_scores, key=lambda x: x[1], reverse=True)
#     sim_scores = [s for s in sim_scores if s[0] != idx][:top_n]
#     return [{'job_id': _job_ids_cache[i], 'similarity': score} for i, score in sim_scores]

# def collaborative_score(user_id: str, job_id: str, interactions_collection) -> float:
#     """
#     Compute collaborative score for a single (user, job) pair.
#     Uses item-based CF, considering positive and negative interactions.
#     """
#     if _item_similarity_cache is None or _job_ids_cache is None:
#         refresh_similarity_cache(interactions_collection)
    
#     # Fetch user's interactions (all types)
#     user_interactions = list(interactions_collection.find({'user_id': user_id}))
#     if not user_interactions:
#         return 0.0
    
#     # Build weight dictionary for jobs the user interacted with
#     user_weights = {}
#     for inter in user_interactions:
#         action = inter['action']
#         if action in ACTION_WEIGHTS:
#             user_weights[inter['job_id']] = ACTION_WEIGHTS[action]
    
#     total_weight = 0.0
#     weighted_sim = 0.0
#     for user_job_id, weight in user_weights.items():
#         # Only positive weights contribute to similarity; negative weights could also be used but careful
#         if weight <= 0:
#             continue
#         similar_jobs = get_similar_jobs(user_job_id, top_n=20)
#         for sim in similar_jobs:
#             if sim['job_id'] == job_id:
#                 weighted_sim += weight * sim['similarity']
#                 total_weight += weight
#                 break
    
#     if total_weight == 0:
#         return 0.0
#     return weighted_sim / total_weight