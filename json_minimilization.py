import ast
import json
import sys
from typing import Any

def minimize_json(value: Any) -> Any:

    """
        Recursively minimize nested JSON-like data.
    """

    if isinstance(value, dict):
        return {k: minimize_json(v) for k, v in value.items()}

    if isinstance(value, list):
        if not value:
            return []
        return [minimize_json(value[0])]

    return value


def load_input(text: str) -> Any:
    """
        Try JSON first, then Python literal syntax.
        This helps when input was copied from logs or chat and uses single quotes.
    """

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        return ast.literal_eval(text)        
    

def main():
    if len(sys.argv) < 2:
        print("Usage: python json_minimizer.py input.txt [output.json]")
        sys.exit(1)
    
    input_file = sys.argv[1]
    output_file = sys.argv[2] if len(sys.argv) > 2 else None

    with open(input_file, "r", encoding="utf-8") as f:
        raw = f.read().strip()
    
    try:
        data = load_input(raw)
    except Exception as e:
        print("Could not parse input as JSON or Python literal.")
        print(f"Error: {e}")
        sys.exit(1)

    minimized = minimize_json(data)
    result = json.dumps(minimized, indent=2, ensure_ascii=False)

    if output_file:
        with open(output_file, "w", encoding="utf-8") as f:
            f.write(result)
    else:
        print(result)

if __name__=="__main__":
    main()