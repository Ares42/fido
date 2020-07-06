import deepFreeze from 'deep-freeze';
import parseUrl from 'url-parse';

// Decomposes the DOM given a root element into an annotated version of
// `innerText` split by lines.
//
// Example:
//
// ```html
// this is a <i>line</i>
// this line <a>contained a link</a>
// ```
//
// would yield
//
// ```js
// [
//   [{ text: 'this is a line' }],
//   [{ text: 'this line }, { url: 'contained a link' }]
// ],
// ```
//
// __Note:__ this method assumes that all text is rendered with
// `white-space: pre`. Given our YouTube description use-case, this is fine for
// now.
function createAnnotatedText(element) {
  const lines = [];
  let currentLine = [];

  // We concat adjacent text blocks from different children to create a sense of
  // continuity. For example, `<span>foo</span> bar` would be annotated as
  // `[{ text: 'foo bar' }]` instead of `[{ text: 'foo' }, { text: ' bar' }]`.
  const appendText = (text) => {
    const lastParcel = currentLine.length
      ? currentLine[currentLine.length - 1]
      : null;
    if (lastParcel && 'text' in lastParcel) {
      lastParcel.text += text;
    } else {
      currentLine.push({ text });
    }
  };

  // As a post-processing step, we trim every text block and remove all empty
  // text blocks.
  const flushLine = () => {
    for (const parcel of currentLine) {
      if ('text' in parcel) {
        parcel.text = parcel.text.trim();
      }
    }
    lines.push(
      currentLine.filter((parcel) => !('text' in parcel && !parcel.text.length))
    );
    currentLine = [];
  };

  const recurse = (node) => {
    for (const child of node.childNodes) {
      if (child.childNodes.length) {
        recurse(child);
        continue;
      }

      const isLink = child.parentElement.tagName == 'A';
      const isHashTag = isLink && child.textContent.startsWith('#');

      if (isLink && !isHashTag) {
        // YouTube links come in two flavors:
        //
        // 1. A link as we'd expect: <a href='http://google.com'>
        // 2. A tracking link: <a href='/redirect?q=google.com'>
        //
        // Here we detect which we're dealing with and extract the link.
        const url = child.parentElement.href;
        const parsedUrl = parseUrl(url, true);

        if (
          parsedUrl.pathname == '/redirect' &&
          parsedUrl.host == location.host &&
          parsedUrl.query['q']
        ) {
          currentLine.push({ url: parsedUrl.query['q'] });
        } else {
          currentLine.push({ url });
        }
      } else {
        const sublines = child.textContent.split('\n');
        appendText(sublines[0]);
        for (const subline of sublines.slice(1)) {
          flushLine();
          appendText(subline);
        }
      }
    }
  };

  recurse(element);
  flushLine();
  return lines;
}

function* labelUrls(annotatedText) {
  // Strippable prefix + postfix characters.
  const prefixChars = ['\u25b6', '\u25ba', '\u00bb', '\u2192', '-', '>'];
  const postfixChars = [
    '\u25b6',
    '\u25ba',
    '\u00bb',
    '\u2192',
    ':',
    '-',
    '>',
    '|',
  ];

  const stripLabel = (text) => {
    for (const prefixChar of prefixChars) {
      if (text.startsWith(prefixChar)) {
        text = text.substring(prefixChar.length);
        break;
      }
    }

    for (const postfixChar of postfixChars) {
      if (text.endsWith(postfixChar)) {
        text = text.substring(0, text.length - postfixChar.length);
        break;
      }
    }

    return text.trim();
  };

  let label = null;
  for (const line of annotatedText) {
    if (line.length == 1 && 'url' in line[0]) {
      yield { label, url: line[0].url };
      continue;
    }
    if (line.length == 2 && 'text' in line[0] && 'url' in line[1]) {
      if (prefixChars.indexOf(line[0].text) != -1) {
        yield { label, url: line[1].url };
        continue;
      }
    }

    label =
      line.length == 1 && 'text' in line[0] ? stripLabel(line[0].text) : null;

    if (line.length == 2 && 'text' in line[0] && 'url' in line[1]) {
      yield { label: stripLabel(line[0].text), url: line[1].url };
      continue;
    }

    const urls = line.filter((parcel) => 'url' in parcel);
    for (const { url } of urls) {
      yield { label: null, url };
    }
  }
}

function* createWidgets(urls) {
  const unknownUrls = [];
  for (const { label, url } of urls) {
    const parsedUrl = parseUrl(url, true);

    if (parsedUrl.origin.endsWith('patreon.com')) {
      yield { type: 'patreon', url };
      continue;
    }

    unknownUrls.push({ label, url });
  }

  if (unknownUrls.length) {
    yield {
      type: 'unknown',
      links: unknownUrls,
    };
  }
}

export function parseDescription(element) {
  const annotatedText = deepFreeze(createAnnotatedText(element));
  return {
    source: {
      html: element.innerHTML,
      annotatedText,
    },
    widgets: [...createWidgets(labelUrls(annotatedText))],
  };
}
