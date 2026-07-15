import { Extension } from "@tiptap/core";
import { PluginKey } from "@tiptap/pm/state";
import { ReactRenderer } from "@tiptap/react";
import Suggestion, {
  exitSuggestion,
  type SuggestionKeyDownProps,
  type SuggestionOptions,
  type SuggestionProps,
} from "@tiptap/suggestion";
import {
  SlashCommandList,
  type SlashCommandListRef,
} from "./SlashCommandList";
import { filterSlashItems, type SlashCommandItem } from "./slash-items";

export const slashCommandPluginKey = new PluginKey("slashCommand");

type SlashSuggestionOptions = Omit<
  SuggestionOptions<SlashCommandItem, SlashCommandItem>,
  "editor"
>;

/**
 * Slash command palette (`/`) built on TipTap Suggestion.
 * Inserts custom Step/Callout nodes and light formatting commands.
 */
export const SlashCommand = Extension.create({
  name: "slashCommand",

  addOptions() {
    return {
      suggestion: {
        char: "/",
        pluginKey: slashCommandPluginKey,
        startOfLine: false,
        allowSpaces: false,
        allowedPrefixes: [" ", "\u00A0"],
        allow: ({ state, range }) => {
          const $from = state.doc.resolve(range.from);
          const type = $from.parent.type;
          // Keep slash out of code-like nodes if present; allow in text blocks.
          if (type.name === "codeBlock") return false;
          return $from.parent.isTextblock;
        },
        command: ({ editor, range, props }) => {
          props.command({ editor, range });
        },
        items: ({ query }) => filterSlashItems(query),
        render: () => {
          let component: ReactRenderer<SlashCommandListRef> | null = null;
          let unmount: (() => void) | null = null;

          return {
            onStart: (props: SuggestionProps<SlashCommandItem, SlashCommandItem>) => {
              component = new ReactRenderer(SlashCommandList, {
                props: {
                  items: props.items,
                  command: props.command,
                },
                editor: props.editor,
              });

              unmount = props.mount(component.element);
            },

            onUpdate: (props: SuggestionProps<SlashCommandItem, SlashCommandItem>) => {
              component?.updateProps({
                items: props.items,
                command: props.command,
              });
            },

            onKeyDown: (props: SuggestionKeyDownProps) => {
              if (props.event.key === "Escape") {
                exitSuggestion(props.view, slashCommandPluginKey);
                return true;
              }

              return component?.ref?.onKeyDown(props) ?? false;
            },

            onExit: () => {
              unmount?.();
              unmount = null;
              component?.destroy();
              component = null;
            },
          };
        },
      } satisfies SlashSuggestionOptions,
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion<SlashCommandItem, SlashCommandItem>({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ];
  },
});
