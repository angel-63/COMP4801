import logging
from database import db
from linkedin import LinkedInScraper
from models.job import EmploymentType, ExperienceLevel, JobMode, ScraperInput, Site

def main():
    logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
    
    if not db.connect():
        print("DB connection failed")
        return
    
    scraper = LinkedInScraper(site=Site.LINKEDIN)  # Fixed: Pass site
    
    input_data = ScraperInput(
        site_type=[Site.LINKEDIN],
        search_term="",
        location="Hong Kong",
        # employment_type=EmploymentType.INTERNSHIP,
        job_mode=JobMode.ONSITE,    # JOBMODE must be filled in
        # experience_lv=ExperienceLevel.INTERNSHIP,
        is_easy_apply=False,
        # results_wanted=30,
        hours_old=24
    )
    
    
    jobs = scraper.scrape(input_data)
    print(f"Scraped {len(jobs)} jobs")
    
    scraper.save_to_db(jobs)  # Save to DB
    db.close()
    
    # scraper.save_to_json(jobs, "test2")

if __name__ == "__main__":
    main()