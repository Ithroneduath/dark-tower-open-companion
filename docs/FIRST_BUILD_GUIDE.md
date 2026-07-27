# First Windows Build — No Python or Programming Required

This guide uses GitHub's Windows build computers. You do **not** need Python, Rust, Node.js, Visual Studio, or Tauri installed on your PC.

## 1. Create the repository

1. Sign in to GitHub.
2. Select the **+** menu near the upper-right corner.
3. Choose **New repository**.
4. Repository name: `dark-tower-open-companion`
5. Choose **Public**. Public repositories receive GitHub-hosted Actions usage suitable for this project.
6. Leave **Add a README**, **.gitignore**, and **license** unchecked because this project already includes them.
7. Select **Create repository**.

## 2. Upload the project

1. Unzip the project package on your PC.
2. Open the unzipped `dark-tower-open-companion` folder.
3. On the empty GitHub repository page, choose **uploading an existing file**.
4. Drag the **contents inside** the unzipped folder into the upload area. Include `.github`, `web`, `src-tauri`, `tests`, `docs`, and the top-level files.
5. At the bottom, enter a message such as `Initial Milestone 1 upload`.
6. Choose **Commit changes**.

Do not upload the outer ZIP file by itself; GitHub will not unpack it into a source repository.

## 3. Allow the automated build

1. Open the repository's **Actions** tab.
2. If GitHub displays an enable-workflows button, enable them.
3. Select **Build Windows App** in the left column.
4. The first upload to `main` should start a build automatically. If it does not, choose **Run workflow**, then **Run workflow** again.
5. Wait for the job to show a green checkmark. The first build may take several minutes because Rust and Tauri dependencies must be compiled.

## 4. Download the `.exe`

1. Open the completed **Build Windows App** workflow run.
2. Scroll to the **Artifacts** section.
3. Download `dark-tower-open-companion-windows`.
4. Unzip that download.

It contains:

- `dark-tower-open-companion.exe` — portable application;
- a file ending in `-setup.exe` — normal Windows installer.

The installer is usually the easiest version to use. Because the app is not yet digitally code-signed, Windows SmartScreen may display an "unknown publisher" warning. The source code and automated build log remain visible in the public repository for inspection.

## 5. Enable the iPad web version

1. In the repository, open **Settings**.
2. Select **Pages** in the left column.
3. Under **Build and deployment**, choose **GitHub Actions** as the source.
4. Open the **Actions** tab and run **Deploy iPad Web App** if it did not run automatically.
5. When deployment finishes, open the address shown by the workflow.
6. On the iPad, open that address in Safari, tap **Share**, and select **Add to Home Screen**.

Windows and iPad use the same game engine, although their browser/app autosaves are stored separately. Use **Export Save** and **Import Save** to move a game between devices.
