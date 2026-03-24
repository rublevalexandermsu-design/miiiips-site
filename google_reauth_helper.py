from pathlib import Path
from local_api_server import get_config, load_google_credentials, GMAIL_SCOPES, SHEETS_SCOPES

config = get_config()
print('Refreshing Gmail token...')
load_google_credentials(config.get('gmail_credentials',''), config.get('gmail_token',''), GMAIL_SCOPES)
print('Refreshing Sheets token...')
load_google_credentials(config.get('sheets_credentials',''), config.get('sheets_token',''), SHEETS_SCOPES)
print('Done. Tokens refreshed if browser auth completed successfully.')
