import urllib.request
import re
import os

packages = {
    'scipy': 'scipy-1.17.1-cp314-cp314-win_amd64.whl',
    'transformers': 'transformers-5.9.0-py3-none-any.whl',
    'sentence-transformers': 'sentence_transformers-5.5.1-py3-none-any.whl',
    'openai': 'openai-2.38.0-py3-none-any.whl'
}

for pkg, filename in packages.items():
    if os.path.exists(filename):
        print(f"Already have {filename}")
        continue
    print(f"Fetching {pkg} simple page...")
    url = f"https://pypi.org/simple/{pkg}/"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        html = urllib.request.urlopen(req, timeout=30).read().decode('utf-8')
    except Exception as e:
        print(f"Error fetching index for {pkg}: {e}")
        continue

    # Find the link
    match = re.search(r'href="([^"]+)"[^>]*>' + re.escape(filename) + r'<', html)
    if not match:
        print(f"Could not find URL for {filename}")
        continue
    
    wheel_url = match.group(1)
    if wheel_url.startswith('../../'):
        wheel_url = "https://pypi.org" + wheel_url[5:]
    elif not wheel_url.startswith('http'):
        wheel_url = "https://pypi.org/simple/" + pkg + "/" + wheel_url
    
    print(f"Downloading {filename} from {wheel_url}...")
    try:
        urllib.request.urlretrieve(wheel_url, filename)
        print(f"Downloaded {filename}")
    except Exception as e:
        print(f"Failed to download {filename}: {e}")
