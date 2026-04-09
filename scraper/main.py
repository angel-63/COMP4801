import argparse
from asyncio.log import logger
import logging
from db.database import db
from scraper.linkedin import LinkedInScraper
from db.models.job import ROLES_DICTIONARY, EmploymentType, ExperienceLevel, JobMode, ScraperInput, Site

def main(args=None):
    logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
    
    parser = argparse.ArgumentParser(description="LinkedIn Job Scraper")
    parser.add_argument(
        "--mode", "-m",
        choices=["keywords", "no-keywords", "both"],
        default="both",
        help="Scraping mode: use keywords (roles), no keywords (empty search_term), or both"
    )
    parser.add_argument(
        "--hr",
        type=int,
        default=24,
        help="Only scrape jobs posted within the last N hours"
    )
    '''
    parser.add_argument(
        "--roles", "-r",
        nargs="+",
        help="Specific roles to scrape (default: all roles from ROLES_DICTIONARY)"
    )
    parser.add_argument(
        "--job-modes", "-jm",
        nargs="+",
        choices=[mode.value for mode in JobMode],
        default=[mode.value for mode in JobMode],
        help="Job modes to scrape (default: all)"
    )
    '''

    args = parser.parse_args(args)
    
    if not db.connect():
        raise RuntimeError("Failed to connect to MongoDB")
    db.cleanup_old_jobs()
    print("MongoDB ready")
    
    scraper = LinkedInScraper(site=Site.LINKEDIN)  # Fixed: Pass site


    '''
    if args.roles:
        roles = args.roles
    else:
        roles = [role for roles in ROLES_DICTIONARY.values() for role in roles]
    '''
    roles = [role for roles in ROLES_DICTIONARY.values() for role in roles]
    
    def scrape_condition(role):
        for jobMode in JobMode:
            input_data = ScraperInput(
                site_type = [Site.LINKEDIN],
                search_term=role,
                location="Hong Kong",
                # employment_type = EmploymentType.INTERNSHIP,
                job_mode=jobMode,    # JOBMODE must be filled in
                # experience_lv = ExperienceLevel.INTERNSHIP,
                role_category = role if role else None,
                is_easy_apply = False,
                # results_wanted = 30,
                hours_old = args.hr,
            )
            
            jobs = scraper.scrape(input_data)
            logger.info(f"Scraped {len(jobs)} jobs for '{role}' ({jobMode})")
            
            scraper.save_to_db(jobs)  # Save to DB
        
    # 1. Scrape with keywords (each role as search_term)
    if args.mode in ("keywords", "both"):
        for role in roles:
            scrape_condition(role=role)

    # 2. Scrape without keywords (empty search_term)
    #    Usually you want this only once, not per role.
    if args.mode in ("no-keywords", "both"):
        scrape_condition(role="")

    db.close()
    
    # scraper.save_to_json(jobs, "test2")

if __name__ == "__main__":
    main()