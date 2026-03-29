# database.py  (or wherever you keep this)
from datetime import datetime
from pymongo import MongoClient
import os
from dotenv import load_dotenv
import logging

load_dotenv()
logger = logging.getLogger(__name__)

class MongoDB:
    def __init__(self):
        self.uri = os.getenv("MONGODB_URI")
        self.db_name = os.getenv("MONGODB_NAME")
        self.client = None
        self.db = None

    def connect(self):
        if self.client is not None:
            return True  # already connected

        try:
            self.client = MongoClient(
                self.uri,
                maxPoolSize=50,
                connectTimeoutMS=30000,
                socketTimeoutMS=30000,
                serverSelectionTimeoutMS=30000
            )
            # Quick health check
            self.client.admin.command('ping')
            self.db = self.client[self.db_name]
            logger.info(f"Connected to MongoDB database: {self.db_name}")
            
            return True
            
        except Exception as e:
            logger.error(f"MongoDB connection failed: {e}")
            return False
    
    def close(self):
        """Close MongoDB connection"""
        if self.client:
            self.client.close()
            logger.info("MongoDB connection closed")
    
    def get_collection(self, collection_name):
        """Get a collection instance"""
        return self.db[collection_name]
    
    def cleanup_old_jobs(self):
        """Remove jobs that have expired (older than expires_at)"""
        cutoff_date = datetime.utcnow()
        result = self.db.jobs.update_many(
            {"expires_at": {"$lt": cutoff_date}, "is_active": True},
            {"$set": {"is_active": False, "updated_at": datetime.utcnow()}}
        )
        logger.info(f"Deactivated {result.modified_count} expired jobs")
        return result.modified_count
        
# Singleton / global access
db = MongoDB()