import sys
from pathlib import Path

root = Path(__file__).parent
sys.path.append(str(root))

import argparse

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("module", choices=["scraper", "recommendation"])
    
    args, extra_args = parser.parse_known_args()

    if args.module == "scraper":
        # pyrhon run.py scraper --module both --hr 24
        from scraper.main import main
        main(args=extra_args)
        
    elif args.module == "recommendation":
        # python run.py recommendation --port 8080 --reload
        from recommender.main import main
        main(args=extra_args)