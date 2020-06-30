import deepFreeze from 'deep-freeze';

function* labelUrls(annotatedText) {
  let label = null;
  for (const line of annotatedText) {
    if (line.length == 1 && 'url' in line[0]) {
      yield { label, url: line[0].url };
      continue;
    }

    label = line.length == 1 && 'text' in line[0] ? line[0].text : null;

    if (line.length == 2 && 'text' in line[0] && 'url' in line[1]) {
      yield { label: line[0].text, url: line[1].url };
      continue;
    }

    const urls = line.filter((parcel) => 'url' in parcel);
    for (const { url } of urls) {
      yield { label: null, url };
    }
  }
}

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

      // We can safely assume that all root nodes are text nodes.

      if (child.parentElement.tagName == 'A') {
        // We assume all links are a single line. This seems to be true as
        // enforced by YouTube's description editor.
        currentLine.push({ url: child.textContent });
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

export function parseDescription(element) {
  const annotatedText = deepFreeze(createAnnotatedText(element));
  return {
    source: {
      html: element.innerHTML,
      annotatedText,
    },
    urls: [...labelUrls(annotatedText)],
  };
}
