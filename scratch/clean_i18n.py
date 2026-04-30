import sys

def clean_i18n(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    new_lines = []
    current_lang = None
    lang_keys = {} # lang -> set of keys seen in current block

    for line in lines:
        stripped = line.strip()
        
        # Detect start of language block
        if stripped == 'en: {':
            current_lang = 'en'
            lang_keys[current_lang] = set()
            new_lines.append(line)
        elif stripped == 'es: {':
            current_lang = 'es'
            lang_keys[current_lang] = set()
            new_lines.append(line)
        elif stripped == 'it: {':
            current_lang = 'it'
            lang_keys[current_lang] = set()
            new_lines.append(line)
        elif current_lang and stripped.startswith('},'):
            current_lang = None
            new_lines.append(line)
        elif current_lang:
            # Check if it's a key definition: key: value, or key: (args) => ...
            if ':' in stripped and not stripped.startswith('//'):
                key = stripped.split(':')[0].strip()
                if key in lang_keys[current_lang]:
                    # Duplicate! Skip it.
                    print(f"Skipping duplicate key '{key}' in '{current_lang}' block")
                    continue
                else:
                    lang_keys[current_lang].add(key)
                    new_lines.append(line)
            else:
                new_lines.append(line)
        else:
            new_lines.append(line)

    with open(file_path, 'w', encoding='utf-8') as f:
        f.writelines(new_lines)

if __name__ == "__main__":
    clean_i18n(sys.argv[1])
