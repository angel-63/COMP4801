from abc import ABC, abstractmethod
from asyncio.log import logger
from db.database import db
import json
import random
import time
from typing import Optional
import tls_client

from db.models.job import JobBase, ScraperInput, Site


class Scraper(ABC):
    def __init__(self, 
                 site: Site, 
                 proxies: list[str],
                 ca_cert: str | None = None
    ):
        self.site = site
        self.proxies = proxies
        self.session = tls_client.Session(
            client_identifier="chrome112",
            random_tls_extension_order=True,
            header_order=[
                "accept",
                "user-agent",
                "accept-encoding",
                "accept-language",
            ],
            supported_signature_algorithms=[
                "ECDSAWithP256AndSHA256",
                "PSSWithSHA256",
                "PKCS1WithSHA256",
                "ECDSAWithP384AndSHA384",
                "PSSWithSHA384",
                "PKCS1WithSHA384",
                "PSSWithSHA512",
                "PKCS1WithSHA512",
            ],
            cert_compression_algo="brotli",
        )
        self.headers = {
            "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
            "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36",
            "accept-encoding": "gzip, deflate, br",
            "accept-language": "en-US,en;q=0.5",
        }
        self.session.headers.update(self.headers)
        
        self.successful_count = 0
        self.request_count = 0
        
        if self.proxies:
            self.rotate_proxy()
        
    def rotate_proxy(self):
        if not self.proxies:
            return
        proxy = self.proxies[self.current_proxy_index]
        self.session.proxies = {"http": proxy, "https": proxy}
        self.current_proxy_index = (self.current_proxy_index + 1) % len(self.proxies)
        logger.debug(f"Using proxy: {proxy}")
        
    @abstractmethod
    def scrape(self, scraperInput: ScraperInput) -> list[JobBase]:
        pass
    
    def get_with_retry(self, url: str, headers: Optional[dict] = None, params: Optional[dict] = None, retries: int = 3) -> Optional[tls_client.response]:
        headers = headers or self.headers
        timeout=30
        for attempt in range(retries):
            # logger.info(f"Scraping: {url} with params: {params}")
            try:
                response = self.session.get(url, 
                                            headers=headers, 
                                            params=params, 
                                            timeout_seconds=timeout)
                # response = self.session.get(full_url, headers=headers)
                if response.status_code == 200:
                    self.successful_count += 1
                    return response
                if response.status_code == 429:
                    wait_time = (2 ** attempt) + random.uniform(0, 1)
                    logger.warning(f"Rate limited. Waiting {wait_time:.2f} seconds...")
                    time.sleep(wait_time)
                    if self.proxies:
                        self.rotate_proxy()
                    continue
                else:
                    logger.warning(f"Unexpected status {response.status_code} on attempt {attempt+1}")
                    continue
            except Exception as e:
                logger.error(f"Attempt {attempt + 1} failed: {e}")
                if attempt < retries - 1:
                    time.sleep(2 ** attempt)
            self.request_count +=1
        
        '''
        # Check content for blocking indicators
        content = response.text.lower() if hasattr(response, 'text') else ""
        
        blocking_indicators = [
            "access denied",
            "rate limit",
            "captcha",
            "security check",
            "bot detected",
            "distil networks",
            "cloudflare",
            "incapsula",
            "please verify you are human",
            "too many requests",
        ]
        
        return any(indicator in content for indicator in blocking_indicators)        
        '''

    
    def save_to_csv(self, jobs: list[JobBase], filename: str):
        df = pd.DataFrame([job.__dict__ for job in jobs])
        df.to_csv(filename, index=False)
        logger.info(f"Saved {len(jobs)} jobs to {filename}")
    
    def save_to_json(self, jobs: list[JobBase], filename: str):
        data = [job.__dict__ for job in jobs]
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, default=str)
        logger.info(f"Saved {len(jobs)} jobs to {filename}")
    
    def save_to_db(self, jobs: list[JobBase]):
        if db.db is None:
            logger.error("Database not connected")
            return 0

        jobs_collection = db.get_collection("job")
        saved_count = 0

        for job in jobs:
            try:
                job_dict = job.model_dump(by_alias=True, exclude={"job_id"})

                # Use original_post_id as the deduplication key
                filter_query = {
                    # "original_post_id": job_dict.get("original_post_id")
                    "dedup_key": job_dict.get("dedup_key")
                }

                # setOnInsert = only applied on insert
                result = jobs_collection.update_one(
                    filter_query,
                    {
                        "$setOnInsert": job_dict,   # Only set all the fields if a new document is being inserted
                    },
                    upsert=True
                )

                # result.matched_count == 0 and result.upserted_id exists → new document inserted
                if result.upserted_id:
                    saved_count += 1
                    # logger.debug(f"Inserted new job: {job_dict.get('job_title')} ({job_dict.get('original_post_id')})")

                # elif result.modified_count > 0:
                #     logger.debug(f"Updated existing job: {job_dict.get('original_post_id')}")

            except Exception as e:
                logger.error(f"Error saving job {job_dict.get('job_title', 'unknown')}: {e}")

        logger.info(f"[{self.site.value}] Inserted {saved_count} new jobs (skipped {len(jobs)-saved_count} duplicates)")
        return saved_count