import argparse
import logging
from .runtime import load_env, settings, run, ProcessLock

def main():
    parser = argparse.ArgumentParser(description='UMAN2GO Telegram dispatch bot')
    parser.add_argument('--env', default='.env')
    parser.add_argument('--db', default='data/uman2go.sqlite3')
    args = parser.parse_args()
    logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')
    load_env(args.env)
    try:
        token, admins, currency = settings()
        with ProcessLock(args.db):
            run(args.db, token, admins, currency)
    except ValueError as exc:
        parser.exit(2, str(exc) + '\n')
    except KeyboardInterrupt:
        pass

if __name__ == '__main__':
    main()
