function getWebsiteImage(url) {
  return new Promise((resolve, reject) => {
    fetch(url)
      .then((response) => response.text())
      .then((html) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");

        // 1. Twitter Cards 메타 정보 분석
        let metaTag = doc.querySelector('meta[name="twitter:image"]');
        if (metaTag) {
          const imageUrl = new URL(metaTag.content, url).href;
          return checkImage(imageUrl, "twitter:image").then((image) =>
            resolve(image)
          );
        }

        // 2. Open Graph Protocol (OGP) 메타 정보 분석
        metaTag = doc.querySelector('meta[property="og:image"]');
        if (metaTag) {
          const imageUrl = new URL(metaTag.content, url).href;
          return checkImage(imageUrl, "og:image").then((image) =>
            resolve(image)
          );
        }

        // 3. og:image:secure_url 시도 (OGP의 HTTPS URL)
        metaTag = doc.querySelector('meta[property="og:image:secure_url"]');
        if (metaTag) {
          const imageUrl = new URL(metaTag.content, url).href;
          return checkImage(imageUrl, "og:image:secure_url").then((image) =>
            resolve(image)
          );
        }

        // 4. favicon 시도 (그래도 이미지가 없을 경우)
        const domain = new URL(url).hostname;
        const faviconUrl = `https://${domain}/favicon.ico`;
        return checkImage(faviconUrl, "favicon").then((image) =>
          resolve(image)
        );

        resolve(null); // 이미지 메타 정보가 없는 경우
      })
      .catch((error) => {
        console.error("HTML 파싱 에러:", error);
        reject(error);
      });
  });
}

function checkImage(url, rel) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ url, rel });
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

function updateBookmarkImages() {
  const bookmarkDivs = document.querySelectorAll(".bookmark > div");

  bookmarkDivs.forEach((div) => {
    const url = div.dataset.url;
    if (url) {
      getWebsiteImage(url)
        .then((image) => {
          if (image) {
            const spanElement = div.querySelector("span");
            const existingImg = spanElement.querySelector("img");
            if (existingImg) {
              existingImg.remove();
            }
            const img = document.createElement("img");
            img.src = image.url;
            img.alt = image.rel;
            spanElement.appendChild(img);
          } else {
            console.log(`${url}에서 이미지를 찾을 수 없습니다.`);
            const spanElement = div.querySelector("span");
            const img = document.createElement("img");
            img.src = "default-image.png"; // 대체 이미지 URL
            img.alt = "Default Image";
            spanElement.appendChild(img);
          }
        })
        .catch((error) => console.error(`${url} 이미지 가져오기 에러:`, error));
    }
  });
}

window.addEventListener("DOMContentLoaded", updateBookmarkImages);

function navigateToUrl(element) {
  const url = element.dataset.url;
  if (url) {
    window.open(url, "_blank");
  }
}
