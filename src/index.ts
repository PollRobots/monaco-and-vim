import monaco from "monaco-editor";
import type vim from "vim-monaco";

declare global {
  interface Window {
    monaco: typeof monaco;
    vim: typeof vim;
    getMonaco: () => Promise<void>;
  }
}

export const main = () => {
  const monacoParent = document.getElementById("monaco") as HTMLDivElement;
  const statusParent = document.getElementById("status") as HTMLDivElement;

  const editor = window.monaco.editor.create(monacoParent, {
    value: "Hello, Monaco!",
    language: "text",
  });

  const statusbar = window.vim.makeDomStatusBar(statusParent, () =>
    editor.focus()
  );
  const vimMode = new window.vim.VimMode(editor, statusbar);

  statusbar.toggleVisibility(true);
  vimMode.enable();

  window.addEventListener("resize", () =>
    editor.layout({
      width: monacoParent.offsetWidth,
      height: monacoParent.offsetHeight,
    })
  );

  vimMode.addEventListener("open-file", () =>
    showOpenFilePicker()
      .then((handles) => handles[0].getFile())
      .then((file) =>
        file.text().then((text) => {
          editor.setValue(text);
          window.monaco.editor.setModelLanguage(editor.getModel()!, file.type);
          monacoParent.setAttribute("data-filename", file.name);
        })
      )
      .catch((err) => console.error("Error opening file:", err))
  );

  vimMode.addEventListener("save-file", ({ filename }) =>
    showSaveFilePicker({
      suggestedName:
        filename.trim() ||
        monacoParent.getAttribute("data-filename") ||
        "untitled",
    })
      .then((handle) => handle.createWritable())
      .then((writable) => {
        const blob = new Blob([editor.getValue()]);
        return writable.write(blob).then(() => writable.close());
      })
  );
};
