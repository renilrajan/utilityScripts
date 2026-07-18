from pathlib import Path
import sys

SKIP_DIRS = {
    ".git",
    "node_modules",
    "__pycache__",
    ".venv",
    "dist",
    "build",
}

SKIP_FILES = {
    ".git"
}

def build_tree(path: Path, lines: list[str], prefix: str = "", output_file: str = ""):
    entries = sorted(
        [
            p for p in path.iterdir()
            if p.name not in SKIP_DIRS
            and p.name not in SKIP_FILES
            and p.name != output_file
        ],
        key=lambda p: (p.is_file(), p.name.lower()),
    )

    for i, entry in enumerate(entries):
        is_last = i == len(entries) - 1
        connector = "|__" if is_last else "|--"
        lines.append(prefix + connector + entry.name)

        if entry.is_dir():
            extension = "   " if is_last else "|   "
            build_tree(entry, lines, prefix + extension, output_file)


if __name__ == "__main__":
    # Project root (defaults to current directory)
    root = Path(sys.argv[1] if len(sys.argv)> 1 else ".").resolve()

    # Output file (defaults to project_tree_structure.md)
    output_file = sys.argv[2] if len(sys.argv) > 2 else "project_tree_structure.md"

    lines = [root.name]
    build_tree(root, lines, output_file=output_file)

    output_path = root / output_file

    with open(output_path, "w", encoding="utf-8") as f:
        f.write("# Project Tree Structure\n\n")
        f.write("```text\n")
        f.write("\n".join(lines))
        f.write("\n```\n")

    print(f"Tree written to: {output_path}")
