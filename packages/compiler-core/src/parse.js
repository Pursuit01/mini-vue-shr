const State = {
  initial: 1,
  tagOpen: 2,
  tagName: 3,
  text: 4,
  tagEnd: 5,
  tagEndName: 6,
};
function isAlpha(char) {
  return (char >= "a" && char <= "z") || (char >= "A" && char <= "Z");
}

export function tokenize(str) {
  let currentState = State.initial;

  const chars = [];

  const tokens = [];

  while (str) {
    const char = str[0];
    switch (currentState) {
      case State.initial:
        if (char === "<") {
          currentState = State.tagOpen;
          str = str.slice(1);
        } else if (isAlpha(char)) {
          currentState = State.text;
          chars.push(char);
          str = str.slice(1);
        }
        break;
      case State.tagOpen:
        if (isAlpha(char)) {
          currentState = State.tagName;
          str = str.slice(1);
        } else if (char === "/") {
          currentState = State.tagEnd;
          str = str.slice(1);
        }
        break;
      case State.tagName:
        if (isAlpha(char)) {
          chars.push(char);
          str = str.slice(1);
        } else if (char === ">") {
          currentState = State.initial;
          tokens.push({
            type: "tag",
            name: chars.join(""),
          });
          chars.length = 0;
          str = str.slice(1);
        }
        break;
      case State.text:
        if (isAlpha(char)) {
          chars.push(char);
          str = str.slice(1);
        } else if (char === "<") {
          currentState = State.tagOpen;
          tokens.push({
            type: "text",
            content: chars.join(""),
          });
          chars.length = 0;
          str = str = str.slice(1);
        }
        break;
      case State.tagEnd:
        if (isAlpha(char)) {
          currentState = State.tagEndName;
          chars.push(char);
          str = str.slice(1);
        }
        break;
      case State.tagEndName:
        if (isAlpha(char)) {
          chars.push(char);
          str = str.slice(1);
        } else if (char === ">") {
          currentState = State.initial;
          tokens.push({
            type: "tagEnd",
            name: chars.join(""),
          });
          chars.length = 0;
          str = str.slice(1);
        }
        break;
    }
  }
  return tokens;
}
