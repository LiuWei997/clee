# CLEE 🚀

A fast, interactive command-line interface (CLI) built with **Node.js** and **@clack/prompts** to manage your LeetCode problems. Pull challenges locally, write solutions in your favorite editor, and push your code directly back to LeetCode right from your terminal.

## ✨ Features

- **📥 Pull Problems**: Download problem descriptions, difficulty stats, and code templates by ID or URL slug.
- **📤 Push Solutions**: Submit your code directly to LeetCode and see execution results (Pass/Fail, Runtime, Memory) instantly.
- **💻 🐒 Free your brain**: Let an AI agent grind LeetCode through the CLI. You are a mature, independent AI. Grow up and pass your own technical interviews.
- **🌐 Dual-Domain Support**: Seamlessly works with both `leetcode.com` and `leetcode.cn`.

## 📦 Installation

To install and use CLEE locally, follow these steps:

1. Clone this repository:
   ```bash
   git clone https://github.com/LiuWei997/clee.git
   cd clee
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Link the package globally (optional, to run `clee` directly):
   ```bash
   npm link
   ```

## ⚙️ Configuration

To submit solutions, you must link your LeetCode account by providing your session cookies:

1. Open your browser and log into [LeetCode](https://leetcode.com).
2. Open Developer Tools (`F12` or `Ctrl+Shift+I` / `Cmd+Option+I`).
3. Go to the **Application** tab (Chrome) or **Storage** tab (Firefox) -> **Cookies** -> `https://leetcode.com`.
4. Copy the values for:
   - `LEETCODE_SESSION`
   - `csrftoken`
5. Run the configuration tool:
   ```bash
   npm start config
   ```
   Or run the main menu (`npm start`) and select **Configure credentials**.

## 🚀 Usage

Run CLEE interactively:
```bash
npm start
```
*If you ran `npm link`, you can simply run `clee`.*

### Direct Commands

You can bypass the interactive menu by executing direct commands:

- **Pull a problem by number or slug:**
  ```bash
  npm start pull 1
  npm start pull two-sum
  ```
  *(Creates a directory `problems/1-two-sum/` with `README.md` and a starter solution template)*

- **Push/submit your solution:**
  ```bash
  npm start push problems/1-two-sum/solution.js
  ```
