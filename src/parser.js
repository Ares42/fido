import urlRegex from 'url-regex';

function* parseUrls(descriptionText) {
  const lines = descriptionText.split('\n').map((line) => ({
    text: line,
    urls: [
      ...line.matchAll(urlRegex({ strict: false })),
    ].map(({ 0: url, index }) => ({ url, index })),
  }));

  for (let i = 0; i < lines.length; ++i) {
    const { text, urls } = lines[i];

    let label = null;
    if (urls.length == 1 && text == urls[0].url) {
      // Matches the following case:
      //
      // ```
      // Video description
      //
      // This is a label
      // myurl.com
      // ```
      if (lines[i - 2] && lines[i - 2].text == '' && lines[i - 1].text) {
        label = lines[i - 1].text;
      }
    } else if (urls.length == 1) {
      // Matches the following case:
      //
      // ```
      // This is a label: myurl.com
      // ```
      const match = text
        .slice(0, urls[0].index)
        .match(/^([^:]+)\s*[^\s&\+]\s+$/);
      if (match) {
        label = match[1].replace(/►/g, '');
      }
    }

    for (const { url } of urls) {
      yield { url, label };
    }
  }
}

export function parseDescription(text) {
  return {
    text,
    urls: [...parseUrls(text)],
  };
}
