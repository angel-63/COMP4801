from __future__ import annotations

from io import BytesIO
import logging
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
from PIL import Image
from urllib.parse import unquote

from bson import Binary
import regex as re
import requests
from db.models.job import JobJobsdb, JobMode, EmploymentType, ScraperInput, Site
from scraper.scraper import Scraper
from bs4 import BeautifulSoup
from scraper.tagging import extract_skills, generate_dedup_key, normalise_industry, normalise_job_unction

logger = logging.getLogger(__name__)

def employment_type_code(employment_type_enum: EmploymentType) -> str:
    return {
        EmploymentType.FULL_TIME: "full-time",
        EmploymentType.PART_TIME: "part-time",
        EmploymentType.CONTRACT: "contract-temp",
        EmploymentType.TEMPORARY: "casual-vacation",
    }.get(employment_type_enum, "")
    
def job_mode_code(job_mode_enum: JobMode) -> str:
    return {
        JobMode.ONSITE: "on-site",
        JobMode.REMOTE: "hybrid",
        JobMode.HYBRID: "remote",
    }.get(job_mode_enum, "")
    
def get_location(soup: BeautifulSoup) -> str:
    # location = soup.find("span", class_=re.compile(r"topcard__flavor--bullet")).get_text(strip=True)
    # if not location:
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
        full_url = url
        resp = requests.get(full_url, headers=headers, timeout=8, stream=True)
        if resp.status_code != 200:
            return None

        # Optional: resize to keep size small (Jobsdb logos are usually small already)
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
    description = soup.find("div", class_="_17igs2j0 kx2b1u0").decode_contents()
    # logger.info(f"type of description: {type(description)}\t description scraped: {description[:100]}")
    return description

class JobsdbScraper(Scraper):
    base_url = "https://hk.jobsdb.com"
    delay = 3
    band_delay = 4
    jobs_per_page = 25

    def __init__(
        self, site: Site, proxies: list[str] | str | None = None, ca_cert: str | None = None
    ):
        """
        Initializes JobsdbScraper with the Jobsdb job search url
        """
        super().__init__(site, proxies=proxies, ca_cert=ca_cert)
        # self.session.headers.update(headers)
    
    def scrape(self, scraper_input: ScraperInput) -> list[JobJobsdb]:
        """
        Scrapes Jobsdb for jobs with scraper_input criteria
        :param scraper_input:
        :return: job_response
        """
        self.scraper_input = scraper_input
        job_list: list[JobJobsdb] = []
        seen_ids = set()
        request_count = 0
        continue_search = (
            lambda: len(job_list) < scraper_input.results_wanted
        )
        days_old = scraper_input.hours_old/24
        
        while continue_search():
            request_count += 1
            logger.info(
                f"search page: {request_count}"
            )
            filters = [
                employment_type_code(scraper_input.employment_type) if scraper_input.employment_type else None,
                job_mode_code(scraper_input.job_mode),
            ]
            params = {
                "daterange": days_old,
                "page": request_count if request_count!=1 else None
            }
            params = {k: v for k, v in params.items() if v is not None}
            keywords =  (scraper_input.search_term).replace(" ","-")
            
            # print(f"url: {self.base_url}/{keywords+"-" if keywords is not None else ""}jobs/{"/".join(filter for filter in filters if filter is not None)}")
            response = self.get_with_retry(
                f"{self.base_url}/{keywords+"-" if keywords is not None else ""}jobs/{"/".join(filter for filter in filters if filter is not None)}",
                params=params
                )
            if response is None:
                logger.warning("Giving up on this search page after retries")
                break
            else:
                logger.info(f"Jobsdb response status code {response.status_code}")
                # logger.info(f"{response.headers}")
                # logger.info(f"- {response.text}")

            soup = BeautifulSoup(response.text, "html.parser")
            job_cards = soup.find_all("article", {"data-automation": "normalJob"})
            logger.info(f"number of job cards: {len(job_cards)}")
            if len(job_cards) == 0:
                break
                # return JobBase(jobs=job_list)


            for job_card in job_cards:
                # get job_id list
                link = job_card.find("a", {"data-automation": "jobTitle"})
                # logger.info(f"Found {link} full-link anchor on this page")
                if link and link.has_attr("href"):
                    href = link["href"]
                    if href:
                        job_url = href.split("?")[0]
                        job_id = job_url.split("/")[-1]

                        if job_id in seen_ids:
                            continue
                        
                        seen_ids.add(job_id)
                        # logger.info(f"job url: {job_url}")
                        # logger.info(f"seen_ids {seen_ids}")

            # if continue_search():
            #     time.sleep(random.uniform(self.delay, self.delay + self.band_delay))
        logger.info(f"seen_ids {seen_ids}")
            
        # get job details using job_id
        for job_id in seen_ids:
            logger.info(f"seen_ids to get job_detials: {seen_ids}")
            try:
                job_post = self.get_job_details(job_id, scraper_input)
                # logger.info(f"get_job_details({job_id}) returned: {type(job_post).__name__ if job_post else 'None/empty'}")
                # logger.info(f"get_job_details({job_id}) returned: {job_post}")
                if job_post:
                    job_list.append(job_post)
            except Exception as e:
                logger.error(f"Jobsdb error in scraping job details: {e}")
        # job_list = job_list[: scraper_input.results_wanted]
        return job_list
    
    def get_job_details(
        self, job_id: str, scraper_input: ScraperInput
        # , full_descr: bool = True
    ) -> JobJobsdb:
        res = self.get_with_retry(f"{self.base_url}/job/{job_id}")
        logger.info("trying to get job details")
        
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
            if "Jobsdb.com/signup" in res.url or "authwall" in res.text.lower():
                logger.warning(f"Auth wall / sign-up redirect for job {job_id}")
                return None
            '''
            
        try:
            logger.info(f"Detail page status: {res.status_code}")

            if res.status_code != 200:
                logger.warning(f"Non-200 status {res.status_code} for {job_id}")
                return None

            # Auth wall check
            if any(x in res.url.lower() for x in ["signup", "login", "authwall", "session"]):
                logger.warning(f"Login/auth redirect → {res.url}")
                return None

            # if "sign in to view" in res.text.lower() or "join Jobsdb" in res.text.lower():
            #     logger.warning(f"Sign-in prompt in HTML for {job_id}")
            #     return None

            soup = BeautifulSoup(res.text, "html.parser")
            
            salary_tag = soup.find("span", {"data-automation": "job-detail-salary"})
            logger.debug(f"Raw salary for {job_id}: {salary_tag}")
            
            salary_min = None
            salary_max = None
            
            if salary_tag:
                salary_text = salary_tag.get_text(separator="–", strip=True)
                numbers = re.findall(r'\d[\d,]*', salary_text)
                salary_min = numbers[0].replace(',', '').replace('$','')
                salary_max = numbers[1].replace(',', '').replace('$','')


            title = soup.find("h1", {"data-automation": "job-detail-title"}).get_text(strip=True)
            company_name = soup.find("span", {"data-automation": "advertiser-name"}).get_text(strip=True)

            company_logo = soup.find("img", class_="_1f9wiih0")#.replace("https://","")
            logger.info(f"logo found: {company_logo}")
            if company_logo:
                company_logo_url = company_logo.get('src')
                logger.info(f"company logo url: {company_logo_url}")
                company_logo_bin = download_logo_as_binary(company_logo_url)

            posted = soup.find("span", 
                               class_="_17igs2j0 _36523f4x fy21pi0 fy21pi1 fy21pi1u fy21pi6 _1v1ursz4",
                               string=re.compile(r"Posted|ago", re.I)).get_text(strip=True)
            time_match = re.findall(r'(\d+)([mhdw])', posted)
            date_posted = None
            if time_match:
                number, unit = time_match[0]
                unit_map = {'m': timedelta(minutes=int(number)), 
                            'h': timedelta(hours=int(number)), 
                            'd': timedelta(days=int(number)), 
                            'w': timedelta(weeks=int(number))
                            }
                try:
                    date_posted = datetime.now(tz=ZoneInfo('Asia/Hong_Kong')) - unit_map[unit]
                except:
                    date_posted = None
            
            # logger.info(f"job title: {title}\n company_name:{company_name}\n company_logo:{company_logo}\n date_posted:{date_posted}")
            
            employment_type_str = "Internship" if "internship" in title.lower() else soup.find("span", {"data-automation": "job-detail-work-type"}).get_text(strip=True)
            job_fun_list = normalise_job_unction(soup.find("span", {"data-automation": "job-detail-classifications"}).get_text(strip=True))
            company_profile = soup.find("div", {"data-automation": "compoany-profile"})
            if company_profile:
                industry_text = company_profile.find("span",class_="_17igs2j0 _36523f4x _36523fr").get_text(strip=True)
                industry_list = normalise_industry(industry_text)
                logger.info(f"industry:{industry_list}")

            employment_type_enum = EmploymentType.from_Jobsdb(employment_type_str)
            
            logger.info(f"employment_type_enum: {employment_type_enum}\n job_fun:{job_fun_list}")
            
            if (scraper_input.employment_type is not None) and (scraper_input.employment_type != employment_type_enum):
                logger.warning(f'employment type scrape input and output for {job_id} different')

            job_descp = get_job_description(soup=soup)

            # logger.info(f"Successfully parsed job {job_id}: {title}\n)")# descp: {job_descp}") # url:{parse_application_url(soup=soup)}\n
            
            required_skills, optional_skills = extract_skills(job_descp)
            # generate dedup key for checking b4 saving to db
            dedupKey = generate_dedup_key(title, job_descp)
            
            return JobJobsdb(
                job_title=title,
                company_name = company_name,
                company_logo = company_logo_bin if company_logo is not None else None,
                company_industry = industry_list if company_profile else None,
                location = get_location(soup),
                job_function=job_fun_list,
                employment_type = employment_type_enum,
                job_mode=scraper_input.job_mode,
                job_description = job_descp,
                min_salary= salary_min,
                max_salary= salary_max,
                posted_at=date_posted,
                expires_at=date_posted,
                application_url= f"{self.base_url}/job/{job_id}",
                # application_url= f"{self.base_url}/jobs/view/{job_id}" if scraper_input.is_easy_apply else parse_application_url(soup=soup),
                original_source_site= Site.JOBSDB,
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