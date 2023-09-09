import { defaultKeymap } from "@codemirror/commands";
import {
  HighlightStyle,
  StreamLanguage,
  syntaxHighlighting,
  syntaxTree,
} from "@codemirror/language";
import { RangeSetBuilder } from "@codemirror/state";
import {
  Decoration,
  Direction,
  EditorView,
  ViewPlugin,
  keymap,
} from "@codemirror/view";
import { tags } from "@lezer/highlight";

const parser = {
  token(stream) {
    if (stream.match(/^{.*?}/)) {
      return "keyword";
    } else {
      stream.eatWhile(/[^{]+/);
      return "string";
    }
  },
};

const style = HighlightStyle.define([
  {
    tag: tags.keyword,
    color: "#872bff",
    fontFamily: "monospace",
    whiteSpace: "pre",
  },
  { tag: tags.string, whiteSpace: "pre-line" },
]);

const dirLTR = Decoration.mark({
  attributes: { dir: "ltr", style: "unicode-bidi: isolate" },
  bidiIsolate: Direction.LTR,
});

function getDecorations(view) {
  const deco = new RangeSetBuilder();
  syntaxTree(view.state).iterate({
    enter(node) {
      if (node.name === "keyword") {
        deco.add(node.from, node.to, dirLTR);
      }
    },
  });
  return deco.finish();
}

const decoratorPlugin = ViewPlugin.fromClass(
  class {
    decorations;
    tree;
    constructor(view) {
      this.decorations = getDecorations(view);
      this.tree = syntaxTree(view.state);
    }
    update(update) {
      if (update.docChanged || syntaxTree(update.state) != this.tree) {
        this.decorations = getDecorations(update.view);
        this.tree = syntaxTree(update.state);
      }
    }
  },
  {
    provide: (plugin) => [
      EditorView.decorations.of((view) => view.plugin(plugin).decorations),
      EditorView.bidiIsolatedRanges.of(
        (view) => view.plugin(plugin).decorations
      ),
    ],
  }
);

new EditorView({
  doc: "הורדת {foo}LTR{bar}",
  extensions: [
    keymap.of(defaultKeymap),
    StreamLanguage.define(parser),
    syntaxHighlighting(style),
    decoratorPlugin,
  ],
  parent: document.getElementById("editor"),
});
