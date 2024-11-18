/**
 * @name LinkSummarizer
 * @description Summarizes links using Ollama. Right-click on any message containing a link to generate a quick summary.
 * @version 1.0.0
 * @author sf000000
 * @authorId 1029852592475472043
 * @source https://github.com/sf000000/discord-plugins/blob/main/plugins/LinkSummarizer/LinkSummarizer.plugin.js
 * @updateUrl https://raw.githubusercontent.com/sf000000/discord-plugins/main/plugins/LinkSummarizer/LinkSummarizer.plugin.js
 * @website https://github.com/sf000000/discord-plugins
 */

module.exports = class LinkSummarizer {
  constructor() {
    this.ollamaEndpoint = "http://localhost:11434/api/generate";
    this.model = "mistral:latest";
    this.maxContentLength = 5000;

    this.defaultSettings = {
      model: "mistral:latest",
      endpoint: "http://localhost:11434/api/generate",
      maxContentLength: 5000,
      summaryPrompt: `Summarize this webpage content in 2-3 concise sentences. Focus on the key information and main points. Do not include any introductory phrases like "Here is a summary" or "This page is about". Just provide the direct summary:`,
    };
  }

  start() {
    this.loadSettings();
    this.patchContextMenu();
  }

  stop() {
    BdApi.ContextMenu.unpatch("message");
  }

  loadSettings() {
    this.model =
      BdApi.Data.load("LinkSummarizer", "model") || this.defaultSettings.model;
    this.ollamaEndpoint =
      BdApi.Data.load("LinkSummarizer", "ollamaEndpoint") ||
      this.defaultSettings.endpoint;
    this.maxContentLength =
      BdApi.Data.load("LinkSummarizer", "maxContentLength") ||
      this.defaultSettings.maxContentLength;
    this.summaryPrompt =
      BdApi.Data.load("LinkSummarizer", "summaryPrompt") ||
      this.defaultSettings.summaryPrompt;
  }

  createSummarizeIcon() {
    return BdApi.React.createElement("svg", {
      width: "20",
      height: "20",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "#b5bac1",
      strokeWidth: "2",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      children: [
        BdApi.React.createElement("path", {
          d: "M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z",
        }),
        BdApi.React.createElement("path", { d: "M20 3v4" }),
        BdApi.React.createElement("path", { d: "M22 5h-4" }),
        BdApi.React.createElement("path", { d: "M4 17v2" }),
        BdApi.React.createElement("path", { d: "M5 18H3" }),
      ],
    });
  }

  patchContextMenu() {
    BdApi.ContextMenu.patch("message", (returnValue, props) => {
      const links = props.message.content.match(/https?:\/\/[^\s]+/g);
      if (!links || !Array.isArray(returnValue.props.children)) return;

      const menuItems = returnValue.props.children;
      const summarizeItem = this.createSummarizeMenuItem(
        links[0],
        props.message
      );
      this.insertMenuItem(menuItems, summarizeItem);
    });
  }

  createSummarizeMenuItem(link, message) {
    return BdApi.ContextMenu.buildItem({
      type: "text",
      id: "summarize-link",
      label: "Summarize Link",
      icon: () => this.createSummarizeIcon(),
      action: () => this.handleSummarize(link, message),
    });
  }

  insertMenuItem(menuItems, summarizeItem) {
    const dividerIndex = menuItems.findIndex(
      (item) => item?.props?.children?.type?.displayName === "MenuGroup"
    );

    if (dividerIndex !== -1) {
      menuItems.splice(dividerIndex, 0, summarizeItem);
    } else {
      menuItems.push(summarizeItem);
    }
  }

  createLoadingDiv() {
    const loadingDiv = document.createElement("div");
    loadingDiv.className = "link-summary-container";

    const style = document.createElement("style");
    style.textContent = `
      @keyframes slideIn {
        from { opacity: 0; transform: translateY(-5px); }
        to { opacity: 1; transform: translateY(0); }
      }
      
      @keyframes fadeOut {
        from { opacity: 1; transform: translateY(0); }
        to { opacity: 0; transform: translateY(-5px); }
      }

      @keyframes sparkle {
        0% { transform: scale(1); }
        50% { transform: scale(1.1); }
        100% { transform: scale(1); }
      }

      @keyframes starBlink {
        0%, 100% { opacity: 1; }
        50% { opacity: 0; }
      }
      
      .link-summary-container {
        animation: slideIn 0.3s ease-out;
        position: relative;
      }

      .link-summary-container.removing {
        animation: fadeOut 0.2s ease-out forwards;
      }

      .loading-sparkle {
        display: inline-flex;
        align-items: center;
        gap: 6px;
      }

      .loading-sparkle svg {
        animation: sparkle 2s ease-in-out infinite;
      }

      .loading-sparkle svg path:not(:first-of-type) {
        animation: starBlink 1.5s ease-in-out infinite;
      }
    `;
    document.head.appendChild(style);

    loadingDiv.style.cssText = `
      margin: 2px 0;
      padding: 12px 16px;
      color: var(--text-normal);
      font-size: 14px;
      max-width: 520px;
      width: fit-content;
      position: relative;
      background-color: var(--background-secondary);
      border-radius: 3px;
    `;

    const loadingContent = document.createElement("div");
    loadingContent.className = "loading-sparkle";
    loadingContent.innerHTML = this.getLoadingContentHTML();

    loadingDiv.appendChild(loadingContent);

    return loadingDiv;
  }

  getLoadingContentHTML() {
    return `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
        <path d="M20 3v4" />
        <path d="M22 5h-4" />
        <path d="M4 17v2" />
        <path d="M5 18H3" />
      </svg>
      <div style="display: flex; flex-direction: column; gap: 2px;">
        <span>Generating summary...</span>
        <span style="font-size: 12px; color: var(--text-muted);">Using ${this.model}</span>
      </div>
    `;
  }

  createCloseButton(loadingDiv) {
    const buttonContainer = document.createElement("div");
    buttonContainer.style.cssText = `
        position: absolute;
        top: 8px;
        right: 8px;
        display: flex;
        gap: 8px;
        align-items: center;
        pointer-events: none;
    `;

    const closeButton = document.createElement("div");
    closeButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
            <path d="M18 6l-12 12" />
            <path d="M6 6l12 12" />
        </svg>
    `;
    closeButton.style.cssText = `
        cursor: pointer;
        color: var(--text-muted);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 6px;
        border-radius: 4px;
        transition: all 0.2s ease;
        pointer-events: auto;
    `;

    closeButton.addEventListener("mouseenter", () => {
      closeButton.style.backgroundColor = "var(--background-modifier-hover)";
      closeButton.style.color = "var(--text-normal)";
    });

    closeButton.addEventListener("mouseleave", () => {
      closeButton.style.backgroundColor = "transparent";
      closeButton.style.color = "var(--text-muted)";
    });

    closeButton.onclick = () => {
      loadingDiv.classList.add("removing");
      setTimeout(() => loadingDiv.remove(), 200);
    };

    buttonContainer.appendChild(closeButton);
    return buttonContainer;
  }

  async handleSummarize(url, message) {
    const messageElement = document.querySelector(
      `[id="message-content-${message.id}"]`
    );
    if (!messageElement) return;

    const startTime = performance.now();

    const messageAccessories = document.querySelector(
      `[id="message-accessories-${message.id}"]`
    );
    const loadingDiv = this.createLoadingDiv();
    const insertAfterElement = messageAccessories || messageElement;
    insertAfterElement.parentElement.insertBefore(
      loadingDiv,
      insertAfterElement.nextSibling
    );

    try {
      const response = await BdApi.Net.fetch(url);
      const pageContent = await response.text();
      const textContent = await this.extractPageContent(pageContent);

      const currentPrompt =
        BdApi.Data.load("LinkSummarizer", "summaryPrompt") ||
        this.defaultSettings.summaryPrompt;

      const ollamaResponse = await BdApi.Net.fetch(this.ollamaEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: this.model,
          prompt: `${currentPrompt}\n\n${textContent}`,
          stream: false,
        }),
        timeout: 30000,
      });

      const ollamaResult = await ollamaResponse.json();
      const endTime = performance.now();
      const processingTime = ((endTime - startTime) / 1000).toFixed(2);

      this.updateSummaryContent(
        loadingDiv,
        ollamaResult.response,
        textContent.length,
        processingTime,
        url
      );
    } catch (error) {
      const errorMessage = error.message || "Failed to generate summary";
      BdApi.UI.showToast(errorMessage, {
        type: "error",
        timeout: 5000,
      });
      document.querySelector(".link-summary-container")?.remove();
    }
  }

  updateSummaryContent(
    loadingDiv,
    response,
    contentLength,
    processingTime,
    url
  ) {
    loadingDiv.style.opacity = "0";

    setTimeout(async () => {
      loadingDiv.innerHTML = await this.getSummaryHTML(
        response,
        processingTime,
        contentLength,
        url
      );

      const copyButton = loadingDiv.querySelector(".copy-button");
      if (copyButton) {
        copyButton.addEventListener("mouseenter", () => {
          copyButton.style.backgroundColor = "var(--background-modifier-hover)";
          copyButton.style.color = "var(--text-normal)";
        });

        copyButton.addEventListener("mouseleave", () => {
          copyButton.style.backgroundColor = "transparent";
          copyButton.style.color = "var(--text-muted)";
        });

        copyButton.addEventListener("click", () => {
          const content = loadingDiv.querySelector(
            "div > div:nth-child(2)"
          ).textContent;
          DiscordNative.clipboard.copy(content);

          copyButton.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                        <path d="M5 12l5 5l10 -10" />
                    </svg>
                    <span>Copied!</span>
                `;
          copyButton.style.color = "var(--text-positive)";

          setTimeout(() => {
            copyButton.innerHTML = `
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                        <span>Copy</span>
                    `;
            copyButton.style.color = "var(--text-muted)";
          }, 2000);
        });
      }

      loadingDiv.style.opacity = "1";
      loadingDiv.style.position = "relative";
      loadingDiv.appendChild(this.createCloseButton(loadingDiv));
    }, 200);
  }

  getStatsBarHTML(model, processingTime, contentLength) {
    return `
      <div style="
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 11px;
        color: var(--text-muted);
        border-top: 1px solid var(--background-modifier-accent);
        padding-top: 8px;
        margin-top: 4px;
      ">
        <div style="display: flex; gap: 12px;">
          <div style="display: flex; align-items: center; gap: 4px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M15.5 13a3.5 3.5 0 0 0 -3.5 3.5v1a3.5 3.5 0 0 0 7 0v-1.8" />
              <path d="M8.5 13a3.5 3.5 0 0 1 3.5 3.5v1a3.5 3.5 0 0 1 -7 0v-1.8" />
              <path d="M17.5 16a3.5 3.5 0 0 0 0 -7h-.5" />
              <path d="M19 9.3v-2.8a3.5 3.5 0 0 0 -7 0" />
              <path d="M6.5 16a3.5 3.5 0 0 1 0 -7h.5" />
              <path d="M5 9.3v-2.8a3.5 3.5 0 0 1 7 0v10" />
            </svg>
            <span>${model}</span>
          </div>
          <div style="display: flex; align-items: center; gap: 4px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M6 20v-2a6 6 0 1 1 12 0v2a1 1 0 0 1 -1 1h-10a1 1 0 0 1 -1 -1z" />
              <path d="M6 4v2a6 6 0 1 0 12 0v-2a1 1 0 0 0 -1 -1h-10a1 1 0 0 0 -1 1z" />
            </svg>
            <span>${processingTime}s</span>
          </div>
        </div>
        <div class="copy-button" style="
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 4px 8px;
          border-radius: 3px;
          transition: all 0.2s ease;
          color: var(--text-muted);
          margin-right: -4px;
        ">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
          <span>Copy</span>
        </div>
      </div>
    `;
  }

  async getSummaryHTML(response, processingTime, contentLength, url) {
    const displayUrl = url.length > 50 ? url.substring(0, 47) + "..." : url;
    const favicon = await this.getFavicon(url);

    return `
      <div style="display: flex; flex-direction: column; gap: 8px; padding: 8px 12px;">
        <div style="
          font-size: 12px;
          color: var(--text-muted);
          display: flex;
          align-items: center;
          gap: 6px;
          padding-right: 60px;
        ">
          ${
            favicon
              ? `<img src="${favicon}" width="14" height="14" style="border-radius: 2px;">`
              : ""
          }
          <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 15l6 -6" />
            <path d="M11 6l.463 -.536a5 5 0 0 1 7.071 7.072l-.534 .464" />
            <path d="M13 18l-.397 .534a5.068 5.068 0 0 1 -7.127 0a4.972 4.972 0 0 1 0 -7.071l.524 -.463" />
          </svg>
          <span title="${url}" style="
            max-width: 400px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          ">${displayUrl}</span>
        </div>
        <div style="
          white-space: pre-wrap;
          word-break: break-word;
          line-height: 1.4;
          letter-spacing: 0.2px;
          font-size: 14px;
          color: var(--text-normal);
        ">${response}</div>
        ${this.getStatsBarHTML(this.model, processingTime, contentLength)}
      </div>
    `;
  }

  async extractPageContent(pageContent) {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = pageContent;

    const elementsToRemove = [
      "script",
      "style",
      "iframe",
      "header",
      "footer",
      "nav",
      "noscript",
      "svg",
      "figure",
      "video",
      "form",
      "input",
      "button",
      "aside",
    ];

    elementsToRemove.forEach((tag) => {
      const elements = tempDiv.getElementsByTagName(tag);
      for (let i = elements.length - 1; i >= 0; i--) {
        elements[i].remove();
      }
    });

    let mainContent = tempDiv.querySelector(
      'article, [role="main"], main, .main-content, #main-content'
    );
    if (!mainContent) {
      mainContent = this.findLargestTextContainer(tempDiv);
    }

    return (mainContent || tempDiv).textContent
      .replace(/\s+/g, " ")
      .replace(/\n+/g, "\n")
      .trim()
      .substring(0, this.maxContentLength);
  }

  findLargestTextContainer(tempDiv) {
    const containers = tempDiv.querySelectorAll("div, section");
    return Array.from(containers).reduce((largest, current) => {
      return current.textContent.length > (largest?.textContent.length || 0)
        ? current
        : largest;
    }, null);
  }

  getSettingsPanel() {
    const panel = document.createElement("div");
    panel.className = "link-summarizer-settings";

    const createSetting = (title, note, type, key, options = {}) => {
      const container = document.createElement("div");
      container.className = "setting-item";

      const titleEl = document.createElement("div");
      titleEl.className = "setting-item-title";
      titleEl.textContent = title;
      container.appendChild(titleEl);

      if (note) {
        const noteEl = document.createElement("div");
        noteEl.className = "setting-item-note";
        noteEl.textContent = note;
        container.appendChild(noteEl);
      }

      let input;
      if (type === "textarea") {
        input = document.createElement("textarea");
      } else {
        input = document.createElement("input");
        input.type = type;
      }

      input.value = this[key];
      input.addEventListener("change", () => {
        const value = type === "number" ? parseInt(input.value) : input.value;
        this[key] = value;
        BdApi.Data.save("LinkSummarizer", key, value);
      });

      if (options.min) input.min = options.min;
      if (options.max) input.max = options.max;

      container.appendChild(input);
      return { container, input };
    };

    const style = document.createElement("style");
    style.textContent = `
        .link-summarizer-settings {
            padding: 16px;
        }
        .link-summarizer-settings .setting-item {
            margin-bottom: 16px;
        }
        .link-summarizer-settings .setting-item-title {
            color: var(--header-primary);
            font-size: 16px;
            font-weight: 500;
            margin-bottom: 8px;
        }
        .link-summarizer-settings .setting-item-note {
            color: var(--text-muted);
            font-size: 14px;
            margin-bottom: 8px;
        }
        .link-summarizer-settings input[type="text"],
        .link-summarizer-settings input[type="number"],
        .link-summarizer-settings textarea {
            width: 100%;
            padding: 8px;
            border-radius: 4px;
            border: 1px solid var(--background-modifier-accent);
            background: var(--background-secondary);
            color: var(--text-normal);
            font-size: 14px;
        }
        .link-summarizer-settings textarea {
            min-height: 100px;
            resize: vertical;
        }
        .link-summarizer-settings .reset-button {
            background: var(--button-danger-background);
            color: var(--text-normal);
            padding: 8px 16px;
            border-radius: 4px;
            border: none;
            cursor: pointer;
            font-size: 14px;
            margin-top: 16px;
        }
        .link-summarizer-settings .reset-button:hover {
            background: var(--button-danger-background-hover);
        }
        .link-summarizer-settings .installed-models {
            margin-top: 8px;
            padding: 8px;
            background: var(--background-secondary-alt);
            border-radius: 4px;
            font-size: 13px;
        }
        .link-summarizer-settings .installed-models-title {
            color: var(--text-muted);
            margin-bottom: 6px;
            display: flex;
            align-items: center;
            gap: 6px;
        }
        .link-summarizer-settings .model-item {
            display: flex;
            justify-content: space-between;
            padding: 4px 8px;
            border-radius: 3px;
            cursor: pointer;
            color: var(--text-normal);
        }
        .link-summarizer-settings .model-item:hover {
            background: var(--background-modifier-hover);
        }
        .link-summarizer-settings .model-details {
            color: var(--text-muted);
            font-size: 12px;
        }
        .link-summarizer-settings .refresh-models {
            background: none;
            border: none;
            color: var(--text-muted);
            cursor: pointer;
            padding: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 4px;
            transition: background-color 0.2s ease, transform 0.2s ease;
        }
        .link-summarizer-settings .refresh-models:hover {
            color: var(--text-normal);
            background: var(--background-modifier-hover);
        }
        .link-summarizer-settings .refresh-models svg {
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .link-summarizer-settings .refresh-models:hover svg {
            transform: rotate(-50deg);
        }
        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        .link-summarizer-settings .refresh-models.spinning svg {
            animation: spin 1s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
    `;
    document.head.appendChild(style);

    const inputs = {};

    const modelSetting = {
      title: "Ollama Model",
      note: "The model to use for summarization",
      type: "text",
      key: "model",
    };

    const { container: modelContainer, input: modelInput } = createSetting(
      modelSetting.title,
      modelSetting.note,
      modelSetting.type,
      modelSetting.key
    );

    // installed models section
    const installedModelsDiv = document.createElement("div");
    installedModelsDiv.className = "installed-models";

    const titleDiv = document.createElement("div");
    titleDiv.className = "installed-models-title";
    titleDiv.innerHTML = `
        <span>Installed Models</span>
        <button class="refresh-models">
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
                <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                <path d="M16 16h5v5" />
            </svg>
        </button>
    `;

    const modelsListDiv = document.createElement("div");
    modelsListDiv.className = "models-list";

    const refreshButton = titleDiv.querySelector(".refresh-models");
    const updateModelsList = async () => {
      refreshButton.classList.add("spinning");
      const models = await this.fetchInstalledModels();
      refreshButton.classList.remove("spinning");

      modelsListDiv.innerHTML = models.length
        ? ""
        : "<div style='color: var(--text-muted); padding: 4px 8px;'>No models found</div>";

      models.forEach((model) => {
        const modelDiv = document.createElement("div");
        modelDiv.className = "model-item";
        modelDiv.innerHTML = `
                <div>
                    <div>${model.name}</div>
                    <div class="model-details">
                        ${model.details.parameter_size || ""} 
                        ${
                          model.details.quantization_level
                            ? `• ${model.details.quantization_level}`
                            : ""
                        }
                    </div>
                </div>
                <div class="model-details">
                    ${(model.size / 1024 / 1024 / 1024).toFixed(1)}GB
                </div>
            `;
        modelDiv.onclick = () => {
          modelInput.value = model.name;
          modelInput.dispatchEvent(new Event("change"));
        };
        modelsListDiv.appendChild(modelDiv);
      });
    };

    refreshButton.onclick = (e) => {
      e.preventDefault();
      updateModelsList();
    };

    installedModelsDiv.appendChild(titleDiv);
    installedModelsDiv.appendChild(modelsListDiv);
    modelContainer.appendChild(installedModelsDiv);

    // initial load of models
    updateModelsList();

    inputs[modelSetting.key] = modelInput;
    panel.appendChild(modelContainer);

    const remainingSettings = [
      {
        title: "Ollama Endpoint",
        note: "The URL of your Ollama API endpoint",
        type: "text",
        key: "ollamaEndpoint",
      },
      {
        title: "Max Content Length",
        note: "Maximum number of characters to process from webpage content",
        type: "number",
        key: "maxContentLength",
        options: { min: 1000, max: 100000 },
      },
      {
        title: "Summary Prompt",
        note: "The prompt template used to generate summaries",
        type: "textarea",
        key: "summaryPrompt",
      },
    ];

    remainingSettings.forEach((setting) => {
      const { container, input } = createSetting(
        setting.title,
        setting.note,
        setting.type,
        setting.key,
        setting.options || {}
      );
      inputs[setting.key] = input;
      panel.appendChild(container);
    });

    const resetButton = document.createElement("button");
    resetButton.className = "reset-button";
    resetButton.textContent = "Reset to Default";
    resetButton.onclick = () => {
      Object.entries(this.defaultSettings).forEach(([key, value]) => {
        this[key] = value;
        inputs[key].value = value;
        BdApi.Data.save("LinkSummarizer", key, value);
      });
      BdApi.UI.showToast("Settings reset to default!", { type: "success" });
    };
    panel.appendChild(resetButton);

    return panel;
  }

  async getFavicon(url) {
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
    } catch {
      return null;
    }
  }

  async fetchInstalledModels() {
    try {
      const endpoint =
        BdApi.Data.load("LinkSummarizer", "ollamaEndpoint") ||
        this.defaultSettings.endpoint;
      const baseUrl = new URL(endpoint).origin;

      const response = await BdApi.Net.fetch(`${baseUrl}/api/tags`);
      const data = await response.json();
      return data.models || [];
    } catch (error) {
      console.error("Failed to fetch installed models:", error);
      BdApi.UI.showToast("Failed to fetch installed models", { type: "error" });
      return [];
    }
  }
};
