import requests
from pathlib import Path

image_urls = [
    "https://cyteksolar.com/wp-content/uploads/2025/03/Shimbir-424x580.png",
    "https://cyteksolar.com/wp-content/uploads/2025/03/Dion-Wines-424x580.png",
    "https://cyteksolar.com/wp-content/uploads/2025/03/George-Mathenge-424x543.png",
    "https://cyteksolar.com/wp-content/uploads/2025/03/Mr-Benard-Kisii-424x580.png",
    "https://cyteksolar.com/wp-content/uploads/2025/03/Winebox1-424x580.png",
    "https://cyteksolar.com/wp-content/uploads/2024/02/35746745574_01ea3bcaa1_b-424x580.jpg",
    "https://cyteksolar.com/wp-content/uploads/2024/02/IMG_27411-424x580.jpg",
    "https://cyteksolar.com/wp-content/uploads/2024/02/IMG_24941-424x580.jpg"
]

save_folder = Path("downloaded_images")
save_folder.mkdir(exist_ok=True)

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                  "(KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36"
}

for url in image_urls:
    filename = save_folder / url.split("/")[-1]
    try:
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            filename.write_bytes(response.content)
            print(f"Downloaded: {filename}")
        else:
            print(f"Failed {response.status_code}: {url}")
    except Exception as e:
        print(f"Error downloading {url}: {e}")
