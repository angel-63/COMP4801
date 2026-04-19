from __future__ import annotations

from io import BytesIO
import logging
import random
import time
from datetime import datetime, timedelta
from PIL import Image
from urllib.parse import unquote

from bson import Binary
import regex as re
import requests
from db.models.job import ExperienceLevel, JobBase, JobMode, EmploymentType, ScraperInput, Site
from scraper.scraper import Scraper
from bs4 import BeautifulSoup
from scraper.tagging import extract_skills, generate_dedup_key, normalise_industry, normalise_job_unction

logger = logging.getLogger(__name__)

def employment_type_code(employment_type_enum: EmploymentType) -> str:
    return {
        EmploymentType.FULL_TIME: "F",
        EmploymentType.PART_TIME: "P",
        EmploymentType.INTERNSHIP: "I",
        EmploymentType.CONTRACT: "C",
        EmploymentType.TEMPORARY: "T",
    }.get(employment_type_enum, "")
    
def job_mode_code(job_mode_enum: JobMode) -> str:
    return {
        JobMode.ONSITE: "1",
        JobMode.REMOTE: "2",
        JobMode.HYBRID: "3",
    }.get(job_mode_enum, "")
    
def expeirence_level_code(expeirence_level_enum: ExperienceLevel) -> str:
    return {
        ExperienceLevel.INTERNSHIP: "1",
        ExperienceLevel.ENTRY: "2",
        ExperienceLevel.ASSOCIATE: "3",
        ExperienceLevel.MID_SENIOR: "4",
        ExperienceLevel.DIRECTOR: "5",
    }.get(expeirence_level_enum, "")
    
def get_location(soup: BeautifulSoup) -> str:
    location = soup.find("span", class_=re.compile(r"topcard__flavor--bullet")).get_text(strip=True)
    if not location:
        location = "Hong Kong"
    return location

def parse_application_url(soup: BeautifulSoup) -> str | None:
    application_url_direct_regex = re.compile(r'(?<=\?url=)[^"]+')
    application_url_attr = soup.find("a", re.compile("apply-button"))["href"]
    # application_url_attr = soup.find("code", id="companyApplyUrl")
    
    
    logger.info(f"application_url_attr: {application_url_attr}")
    
    if application_url_attr:
        application_url_match = application_url_direct_regex.search(
            application_url_attr.decode_contents().strip()
        )
        if application_url_match:
            application_url = unquote(application_url_match.group())

        return application_url
    
def download_logo_as_binary(url: str, max_size=(180, 180), format="PNG") -> Binary | None:
    """
    Downloads logo, resizes it (optional), returns BSON Binary or None on failure
    """
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Accept": "image/webp,image/apng,image/*,*/*;q=0.8"
        }
        # full_url = f"https://{url}"
        full_url = url
        resp = requests.get(full_url, headers=headers, timeout=8, stream=True)
        if resp.status_code != 200:
            return None

        # Optional: resize to keep size small (LinkedIn logos are usually small already)
        img = Image.open(BytesIO(resp.content))
        img = img.convert("RGBA")  # preserve transparency if any

        if max_size:
            img.thumbnail(max_size, Image.Resampling.LANCZOS)

        buffer = BytesIO()
        img.save(buffer, format=format.upper(), optimize=True)
        binary_data = buffer.getvalue()

        return Binary(binary_data)  # ← this becomes BSON BinData subtype 0

    except Exception as e:
        print(f"Failed to download/convert logo {url}: {e}")
        return None
    
def get_job_description(soup: BeautifulSoup) -> str:
    description = soup.find("div", class_=re.compile(r"show-more-less-html__markup")).decode_contents()
    # logger.info(f"type of description: {type(description)}\t description scraped: {description[:100]}")
    return description

class LinkedInScraper(Scraper):
    base_url = "https://www.linkedin.com"
    delay = 3
    band_delay = 4
    jobs_per_page = 25

    def __init__(
        self, site: Site, proxies: list[str] | str | None = None, ca_cert: str | None = None
    ):
        """
        Initializes LinkedInScraper with the LinkedIn job search url
        """
        super().__init__(site, proxies=proxies, ca_cert=ca_cert)
        # self.session.headers.update(headers)
    
    def scrape(self, scraper_input: ScraperInput) -> list[JobBase]:
        """
        Scrapes LinkedIn for jobs with scraper_input criteria
        :param scraper_input:
        :return: job_response
        """
        self.scraper_input = scraper_input
        job_list: list[JobBase] = []
        seen_ids = set()
        start = scraper_input.offset // 10 * 10 if scraper_input.offset else 0
        request_count = 0
        seconds_old = (
            scraper_input.hours_old * 3600 if scraper_input.hours_old else None
        )
        continue_search = (
            lambda: len(job_list) < scraper_input.results_wanted and start < 1000
        )
        
        while continue_search():
            request_count += 1
            logger.info(
                f"search page: {request_count}"# / {math.ceil(scraper_input.results_wanted / 10)}"
            )
            params = {
                "keywords": scraper_input.search_term,
                # "location": scraper_input.location,
                "geoId": scraper_input.geoId,
                "f_JT": (
                    employment_type_code(scraper_input.employment_type)
                    if scraper_input.employment_type
                    else None
                ),
                "f_WT": job_mode_code(scraper_input.job_mode),
                "f_E": expeirence_level_code(scraper_input.experience_lv) if expeirence_level_code(scraper_input.experience_lv) else None,
                # "pageNum": 0,
                "start": start,
                "f_AL": "true" if scraper_input.is_easy_apply else None,
            }
            if seconds_old is not None:
                params["f_TPR"] = f"r{seconds_old}"  # r86400 = past 24 hours

            params = {k: v for k, v in params.items() if v is not None}
            
            response = self.get_with_retry(
                f"{self.base_url}/jobs-guest/jobs/api/seeMoreJobPostings/search",
                headers=None,
                params = params
                )
            if response is None:
                logger.warning("Giving up on this search page after retries")
                break
            # else:
                # logger.info(f"LinkedIn response status code {response.status_code}")
                # logger.info(f"{response.headers}")
                # logger.info(f"- {response.text}")
            
            '''
            try:
                response = self.session.get(
                    f"{self.base_url}/jobs-guest/jobs/api/seeMoreJobPostings/search?",
                    params=params,
                    timeout_seconds=10,
                )
                if response.status_code not in range(200, 400):
                    if response.status_code == 429:
                        err = (
                            f"Returned Status Code 429. Blocked by LinkedIn for too many requests"
                        )
                    else:
                        err = f"LinkedIn response status code {response.status_code}"
                        err += f" - {response.text}"
                    logger.error(err)
                    return job_list
            except Exception as e:
                if "Proxy responded with" in str(e):
                    logger.error(f"LinkedIn: Bad proxy")
                else:
                    logger.error(f"LinkedIn: {str(e)}")
                return job_list
            '''

            soup = BeautifulSoup(response.text, "html.parser")
            job_cards = soup.find_all("div", class_=re.compile(r"base-search-card"))
            if len(job_cards) == 0:
                # logger.info(f"number of job cards: {len(job_cards)}")
                break
                # return JobBase(jobs=job_list)

            for job_card in job_cards:
                # get job_id list
                link = job_card.find("a", class_=re.compile(r"base-card__full-link"))
                # logger.info(f"Found {link} full-link anchor on this page")
                if link and link.has_attr("href"):
                    href = link["href"]
                    if href:
                        job_url = href.split("?")[0]
                        job_id = job_url.split("-")[-1]

                        if job_id in seen_ids:
                            continue
                        
                        seen_ids.add(job_id)
                        # logger.info(f"job url: {job_url}")
                        # logger.info(f"seen_ids {seen_ids}")

            if continue_search():
                time.sleep(random.uniform(self.delay, self.delay + self.band_delay))
                start += max(self.jobs_per_page, len(job_cards)) # max 25
        logger.info(f"seen_ids {seen_ids}")
            
        # get job details using job_id
        for job_id in seen_ids:
            # logger.info(f"seen_ids to get job_detialsL: {seen_ids}")
            try:
                job_post = self.get_job_details(job_id, scraper_input)
                # logger.info(f"get_job_details({job_id}) returned: {type(job_post).__name__ if job_post else 'None/empty'}")
                # logger.info(f"get_job_details({job_id}) returned: {job_post}")
                if job_post:
                    job_list.append(job_post)
            except Exception as e:
                logger.error(f"LinkedIn error in scraping job details: {e}")
        # job_list = job_list[: scraper_input.results_wanted]
        return job_list
    
    def get_job_details(
        self, job_id: str, scraper_input: ScraperInput
        # , full_descr: bool = True
    ) -> JobBase:
        res = self.get_with_retry(f"{self.base_url}/jobs/view/{job_id}", headers=None, params=None)
        # logger.info("trying to get job details")
        
        if res is None:
            logger.warning(f"get_with_retry returned None for {job_id} — no response received")
            return None
            '''
            logger.info("trying to get job details")
            # response = self.session.get(
            #     f"{self.base_url}/jobs/view/{job_id}", timeout=30
            # )
            res = self.get_with_retry(f"{self.base_url}/jobs/view/{job_id}")
            logger.info(f"response: {res.text}")
            # logger.info(f"response for job details: {response.raise_for_status()}")
            if "linkedin.com/signup" in res.url or "authwall" in res.text.lower():
                logger.warning(f"Auth wall / sign-up redirect for job {job_id}")
                return None
            '''
            
        try:
            # logger.info(f"Detail page status: {res.status_code}")

            if res.status_code != 200:
                logger.warning(f"Non-200 status {res.status_code} for {job_id}")
                return None

            # Auth wall check
            if any(x in res.url.lower() for x in ["signup", "login", "authwall", "session"]):
                logger.warning(f"Login/auth redirect → {res.url}")
                return None

            # if "sign in to view" in res.text.lower() or "join linkedin" in res.text.lower():
            #     logger.warning(f"Sign-in prompt in HTML for {job_id}")
            #     return None

            soup = BeautifulSoup(res.text, "html.parser")
            
            salary_tag = soup.find("span", class_=re.compile(r"salary compensation__salary"))
            logger.debug(f"Raw salary for {job_id}: {salary_tag}")
            
            salary_min = None
            salary_max = None
            
            if salary_tag:
                salary_text = salary_tag.get_text(separator=" ", strip=Tr)
                numbers = re.findall(r'\d[\d,]*', salary_text)
                salary_min = numbers[0].replace(',', '')
                salary_max = numbers[1].replace(',', '')


            title = soup.find("h1", class_=re.compile(r"top-card-layout__title")).get_text(strip=True)
            company_attr = soup.find("a", class_=re.compile(r"topcard__org-name-link"))
            company_name = company_attr.get_text(strip=True)
            # company_url = company_attr["href"]
            company_logo_url = soup.find("img", class_=re.compile(r"artdeco-entity-image")).get('data-delayed-url')#.replace("https://","")
            # logger.info(f"company logo url: {company_logo_url}")
            company_logo_bin = download_logo_as_binary(company_logo_url)

            datetime_tag = (
                soup.find("time", class_=re.compile(r"main-job-card__listdate"))
                if soup else None
            )
            date_posted = None
            if datetime_tag and "datetime" in datetime_tag.attrs:
                datetime_str = datetime_tag["datetime"]
                try:
                    date_posted = datetime.strptime(datetime_str, "%Y-%m-%d")
                except:
                    date_posted = None
            
            # logger.info(f"job title: {title}\n company_name:{company_name}\n company_logo_url:{company_logo_url}\n date_posted:{date_posted}")
            
            other_info = soup.find_all("span", class_=re.compile(r"description__job-criteria-text"))
            exp_lv_str = other_info[0].get_text(strip=True) if len(other_info) > 0 else None
            employment_type_str = other_info[1].get_text(strip=True) if len(other_info) > 1 else None
            job_fun_list = normalise_job_unction(other_info[2].get_text(strip=True)) if len(other_info) > 2 else None
            industry_list = normalise_industry(other_info[3].get_text(strip=True)) if len(other_info) > 3 else None

            employment_type_enum = EmploymentType.from_linkedin(employment_type_str)
            exp_lv_enum = ExperienceLevel.from_linkedin(exp_lv_str)
            
            # logger.info(f"exp_lv_enum: {exp_lv_enum}\n employment_type_enum: {employment_type_enum}\n job_fun:{job_fun}\n industry:{industry}")
            
            if (scraper_input.employment_type is not None) and (scraper_input.employment_type != employment_type_enum):
                logger.warning(f'employment type scrape input and output for {job_id} different')

            job_descp = get_job_description(soup=soup)

            # logger.info(f"Successfully parsed job {job_id}: {title}\n)")# descp: {job_descp}") # url:{parse_application_url(soup=soup)}\n
            
            required_skills, optional_skills = extract_skills(job_descp)
            # generate dedup key for checking b4 saving to db
            dedupKey = generate_dedup_key(title, job_descp)
            
            return JobBase(
                job_title=title,
                company_name = company_name,
                # company_logo = company_logo_url,
                company_logo = company_logo_bin,
                company_industry = industry_list,
                location = get_location(soup),
                experience_level = exp_lv_enum,
                job_function=job_fun_list,
                employment_type = employment_type_enum,
                job_mode=scraper_input.job_mode,
                job_description = job_descp,
                min_salary= salary_min,
                max_salary= salary_max,
                posted_at=date_posted,
                expires_at=date_posted+timedelta(days=7),
                application_url= f"{self.base_url}/jobs/view/{job_id}",
                # application_url= f"{self.base_url}/jobs/view/{job_id}" if scraper_input.is_easy_apply else parse_application_url(soup=soup),
                original_source_site= Site.LINKEDIN,
                original_post_id=job_id,
                # emails = extract_emails_from_text(description),
                # company_url=company_url,
                skill_tags = required_skills,
                optional_skill_tags = optional_skills,
                role_category = scraper_input.role_category,
                dedup_key = dedupKey
            )
        except Exception as e:
            logger.error(f"Parsing / post-processing failed for {job_id}: {str(e)}")
            return None