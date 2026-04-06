import os

def replace_colors(directory):
    replacements = {
        'primary-600': 'amber-500',
        'primary-500': 'amber-500',
        'primary-700': 'amber-600',
        'primary-50': 'amber-50',
        'primary-100': 'amber-100',
        'primary-600/10': 'amber-500/10',
        'indigo-600': 'slate-900', # Primary Navy
        'indigo-500': 'slate-800'  # Secondary Navy
    }
    
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith('.tsx') or file.endswith('.css'):
                path = os.path.join(root, file)
                with open(path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                new_content = content
                for old, new in replacements.items():
                    new_content = new_content.replace(old, new)
                
                if new_content != content:
                    with open(path, 'w', encoding='utf-8') as f:
                        f.write(new_content)
                    print(f"Updated: {path}")

if __name__ == "__main__":
    replace_colors('src')
