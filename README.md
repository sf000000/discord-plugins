# Discord Plugins

A collection of plugins for BetterDiscord.

## Plugins

| Plugin                                                            | Description                                                                                                             | Version |
| ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ------- |
| [LinkSummarizer](plugins/LinkSummarizer/LinkSummarizer.plugin.js) | Summarizes links using Ollama's local AI models. Right-click on any message containing a link to get a concise summary. | 1.0.0   |

## Requirements

- [BetterDiscord](https://betterdiscord.app/)
- Specific requirements for each plugin are listed in their respective README files

## Installation

1. Install [BetterDiscord](https://betterdiscord.app/)
2. Download the desired plugin's `.plugin.js` file
3. Move it to your BetterDiscord plugins folder
4. Enable the plugin in BetterDiscord settings

## Plugin Development

Each plugin is contained in its own folder under `plugins/` with the following structure:

```
plugins/
├── PluginName/
│   ├── README.md         # Plugin documentation
│   ├── PluginName.plugin.js
│   └── assets/          # Images, etc.
```

## Contributing

Contributions are welcome! To contribute:

1. Fork the repository
2. Create a new branch for your feature/fix
3. Make your changes
4. Submit a pull request

When creating a new plugin, include:

- README.md with documentation
- YourPlugin.plugin.js
- Any necessary assets

Feel free to open an issue for bug reports or feature requests.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for a detailed history of changes.

## License

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

All plugins are released under the MIT License unless otherwise specified.
